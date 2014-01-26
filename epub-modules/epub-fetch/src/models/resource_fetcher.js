define(['require', 'module', 'jquery', 'URIjs', './markup_parser', './discover_content_type', './plain_fetcher',
    './zip_fetcher', './resource_cache'],
    function (require, module, $, URI, MarkupParser, ContentTypeDiscovery, PlainExplodedFetcher, ZipFetcher,
              ResourceCache) {
        console.log('resource_resolver module id: ' + module.id);


    var ResourceFetcher = function(rootUrl, libDir) {

        var self = this;

        ResourceFetcher.contentTypePackageReadStrategyMap = {
            'application/oebps-package+xml': 'exploded',
            'application/epub+zip': 'zipped',
            'application/zip': 'zipped'
        };

        var ENCRYPTION_METHODS = {
            'http://www.idpf.org/2008/embedding': embeddedFontDeobfuscateIdpf,
            'http://ns.adobe.com/pdf/enc#RC': embeddedFontDeobfuscateAdobe
        };
        var _isExploded;
        var _dataFetcher;
        var _packageFullPath;
        var _packageDom;
        var _packageDomInitializationSubscription;
        var _encryptionDom;
        var _encryptionHash;
        var _packageJson;

        this.markupParser = new MarkupParser();

        this.initialize =  function(callback) {

            _isExploded = isExploded();

            createDataFetcher(_isExploded, callback);
        };



        // INTERNAL FUNCTIONS

        function _handleError(err) {
            if (err) {
                if (err.message) {
                    console.error(err.message);
                }
                if (err.stack) {
                    console.error(err.stack);
                }
            }
            console.error(err);
        }

        function isExploded() {

            var ext = ".epub";
            return rootUrl.indexOf(ext, rootUrl.length - ext.length) === -1;
        }

        function createDataFetcher(isExploded, callback) {
            if (isExploded) {
                console.log('using new PlainExplodedFetcher');
                _dataFetcher = new PlainExplodedFetcher(self, rootUrl);
                _dataFetcher.initialize(function () {
                    callback(_dataFetcher);
                });
                return;
            } else {
                console.log('using new ZipFetcher');
                _dataFetcher = new ZipFetcher(self, rootUrl, libDir);
                callback(_dataFetcher);
            }
        }

        function fetchResourceForElement(resolvedElem, refAttrOrigVal, refAttr, contentDocumentURI, fetchMode,
                                         resolutionDeferreds, onerror, resourceDataPreprocessing) {
            var resourceUriRelativeToPackageDocument = (new URI(refAttrOrigVal)).absoluteTo(contentDocumentURI).toString();

            var ownerDocument;
            if (resolvedElem.ownerDocument) {
                ownerDocument = resolvedElem.ownerDocument;
            }
            if (resolvedElem[0] && resolvedElem[0].ownerDocument) {
                ownerDocument = resolvedElem[0].ownerDocument;
            }

            var documentResourcesCache = obtainDocumentResourcesCache(ownerDocument);
            var cachedResourceUrl = documentResourcesCache.getResourceURL(resourceUriRelativeToPackageDocument);
            function replaceRefAttrInElem(newResourceUrl) {
                // Store original refAttrVal in a special attribute to provide access to the original href:
                $(resolvedElem).data('epubZipOrigHref', refAttrOrigVal);
                $(resolvedElem).attr(refAttr, newResourceUrl);
            }
            if (cachedResourceUrl) {
                console.log('Using a cached version of [' + resourceUriRelativeToPackageDocument +
                    '] with object URL [' + cachedResourceUrl + ']');
                replaceRefAttrInElem(cachedResourceUrl);
            } else {
                var resolutionDeferred = $.Deferred();
                resolutionDeferreds.push(resolutionDeferred);

                self.relativeToPackageFetchFileContents(resourceUriRelativeToPackageDocument, fetchMode, function (resourceData) {

                    // Generate a function to replace element's resource URL with URL of fetched data.
                    // The function will either be called directly, immediately (if no preprocessing of resourceData is in effect)
                    // or indirectly, later after resourceData preprocessing finishes:
                    var replaceResourceURL = function (finalResourceData) {
                        // Creating an object URL requires a Blob object, so resource data fetched in text mode needs to be wrapped in a Blob:
                        if (fetchMode === 'text') {
                            var textResourceContentType = ContentTypeDiscovery.identifyContentTypeFromFileName(resourceUriRelativeToPackageDocument);
                            var declaredType = $(resolvedElem).attr('type');
                            if (declaredType) {
                                textResourceContentType = declaredType;
                            }
                            finalResourceData = new Blob([finalResourceData], {type: textResourceContentType});
                        }
                        //noinspection JSUnresolvedVariable,JSUnresolvedFunction
                        var resourceObjectURL = window.URL.createObjectURL(finalResourceData);
                        documentResourcesCache.putResourceURL(resourceUriRelativeToPackageDocument, resourceObjectURL);
                        // TODO: take care of releasing object URLs when no longer needed
                        replaceRefAttrInElem(resourceObjectURL);
                        resolutionDeferred.resolve();
                    };

                    if (resourceDataPreprocessing) {
                        resourceDataPreprocessing(resourceData, resourceUriRelativeToPackageDocument, ownerDocument,
                            replaceResourceURL);
                    } else {
                        replaceResourceURL(resourceData);
                    }
                }, onerror);
            }
        }

        function fetchResourceForCssUrlMatch(cssUrlMatch, cssResourceDownloadDeferreds,
                                             styleSheetUriRelativeToPackageDocument, stylesheetCssResourceUrlsMap,
                                             contextDocument, isStyleSheetResource) {
            var origMatchedUrlString = cssUrlMatch[0];
            var extractedUrl = cssUrlMatch[2];
            var extractedUri = new URI(extractedUrl);
            var isCssUrlRelative = extractedUri.scheme() === '';
            if (!isCssUrlRelative) {
                // Absolute URLs don't need programmatic fetching
                return;
            }
            var resourceUriRelativeToPackageDocument = (new URI(extractedUrl)).absoluteTo(styleSheetUriRelativeToPackageDocument).toString();

            var documentResourcesCache = obtainDocumentResourcesCache(contextDocument);
            var cachedResourceURL = documentResourcesCache.getResourceURL(resourceUriRelativeToPackageDocument);


            if (cachedResourceURL) {
                console.log('Using a cached version of [' + resourceUriRelativeToPackageDocument +
                    '] with object URL [' + cachedResourceURL + ']');
                stylesheetCssResourceUrlsMap[origMatchedUrlString] = {
                    isStyleSheetResource: isStyleSheetResource,
                    resourceObjectURL:  cachedResourceURL
                };
            } else {
                var cssUrlFetchDeferred = $.Deferred();
                cssResourceDownloadDeferreds.push(cssUrlFetchDeferred);

                var processedBlobCallback = function (resourceDataBlob) {
                    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
                    var resourceObjectURL = window.URL.createObjectURL(resourceDataBlob);
                    stylesheetCssResourceUrlsMap[origMatchedUrlString] = {
                        isStyleSheetResource: isStyleSheetResource,
                        resourceObjectURL: resourceObjectURL
                    };
                    documentResourcesCache.putResourceURL(resourceUriRelativeToPackageDocument, resourceObjectURL);
                    console.log('origMatchedUrlString: [' + origMatchedUrlString + '], extractedUrl: [' + extractedUrl +
                        '], resourceObjectURL: [' + resourceObjectURL + ']');
                    cssUrlFetchDeferred.resolve();
                };
                var fetchErrorCallback = function (error) {
                    _handleError(error);
                    cssUrlFetchDeferred.resolve();
                };

                var fetchMode;
                var fetchCallback;
                if (isStyleSheetResource) {
                    // TODO: test whether recursion works for nested @import rules with arbitrary indirection depth.
                    fetchMode = 'text';
                    fetchCallback = function(styleSheetResourceData) {
                        preprocessCssStyleSheetData(styleSheetResourceData, resourceUriRelativeToPackageDocument,
                            contextDocument, function(preprocessedStyleSheetData) {
                                var resourceDataBlob = new Blob([preprocessedStyleSheetData], {type: 'text/css'});
                                processedBlobCallback(resourceDataBlob);
                            })
                    }
                } else {
                    fetchMode = 'blob';
                    fetchCallback = processedBlobCallback;
                }

                self.relativeToPackageFetchFileContents(resourceUriRelativeToPackageDocument, fetchMode,  fetchCallback, fetchErrorCallback);
            }
        }

        function preprocessCssStyleSheetData(styleSheetResourceData, styleSheetUriRelativeToPackageDocument,
                                             contextDocument, callback) {
            // TODO: regexp probably invalid for url('someUrl"ContainingQuote'):
            var cssUrlRegexp = /[Uu][Rr][Ll]\(\s*(['"]?)([^']+)\1\s*\)/g;
            var nonUrlCssImportRegexp = /@[Ii][Mm][Pp][Oo][Rr][Tt]\s*(['"])([^"']+)\1/g;
            var stylesheetCssResourceUrlsMap = {};
            var cssResourceDownloadDeferreds = [];
            console.log('========');
            console.log('preprocessing Css StyleSheet Data for stylesheet [' + styleSheetUriRelativeToPackageDocument +
                ']:');
            console.log('--------');
            console.log(styleSheetResourceData);
            console.log('========');
            // Go through the stylesheet text using all regexps and process according to those regexp matches, if any:
            [nonUrlCssImportRegexp, cssUrlRegexp].forEach(function(processingRegexp) {
                // extract all URL references in the CSS sheet,
                var cssUrlMatch = processingRegexp.exec(styleSheetResourceData);
                while (cssUrlMatch != null) {
                    console.log('CSS match using regexp ' + processingRegexp + ':');
                    console.log(cssUrlMatch);
                    // then fetch and replace them with corresponding object URLs:
                    var isStyleSheetResource = false;
                    // Special handling of @import-ed stylesheet files - recursive preprocessing:
                    // TODO: will not properly handle @import url(...):
                    if (processingRegexp == nonUrlCssImportRegexp) {
                        // This resource URL points to an @import-ed CSS stylesheet file. Need to preprocess its text
                        // after fetching but before making an object URL of it:
                        isStyleSheetResource = true;
                    }
                    fetchResourceForCssUrlMatch(cssUrlMatch, cssResourceDownloadDeferreds,
                        styleSheetUriRelativeToPackageDocument, stylesheetCssResourceUrlsMap,
                        contextDocument, isStyleSheetResource);
                    cssUrlMatch = processingRegexp.exec(styleSheetResourceData);
                }

            });

            if (cssResourceDownloadDeferreds.length > 0) {
                $.when.apply($, cssResourceDownloadDeferreds).done(function () {
                    for (var origMatchedUrlString in stylesheetCssResourceUrlsMap) {
                        var processedResourceDescriptor = stylesheetCssResourceUrlsMap[origMatchedUrlString];


                        var processedUrlString;
                        if (processedResourceDescriptor.isStyleSheetResource) {
                            processedUrlString = '@import "' + processedResourceDescriptor.resourceObjectURL + '"';
                        } else {
                            processedUrlString = "url('" + processedResourceDescriptor.resourceObjectURL + "')";
                        }
                        console.log('Replacing in stylesheet text: [' + origMatchedUrlString + '] => [' + processedUrlString + ']');
                        //noinspection JSCheckFunctionSignatures
                        styleSheetResourceData =
                            styleSheetResourceData.replace(origMatchedUrlString, processedUrlString, 'g');
                    }
                    callback(styleSheetResourceData);
                });
            } else {
                callback(styleSheetResourceData);
            }
        }

        function resolveResourceElements(elemName, refAttr, fetchMode, contentDocumentDom, contentDocumentURI,
                                         resolutionDeferreds, onerror, resourceDataPreprocessing) {

            var resolvedElems = $(elemName + '[' + refAttr + ']', contentDocumentDom);

            resolvedElems.each(function (index, resolvedElem) {
                var refAttrOrigVal = $(resolvedElem).attr(refAttr);
                var refAttrUri = new URI(refAttrOrigVal);

                if (refAttrUri.scheme() === '') {
                    // Relative URI, fetch from packed EPUB archive:

                    fetchResourceForElement(resolvedElem, refAttrOrigVal, refAttr, contentDocumentURI, fetchMode,
                        resolutionDeferreds, onerror, resourceDataPreprocessing);
                }
            });
        }

        function resolveDocumentImages(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror) {
            resolveResourceElements('img', 'src', 'blob', contentDocumentDom, contentDocumentURI, resolutionDeferreds,
                onerror);
        }

        function resolveDocumentLinkStylesheets(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror) {
            resolveResourceElements('link', 'href', 'text', contentDocumentDom, contentDocumentURI, resolutionDeferreds,
                onerror, preprocessCssStyleSheetData);
        }

        function resolveDocumentEmbeddedStylesheets(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror) {
            var resolvedElems = $('style', contentDocumentDom);
            resolvedElems.each(function (index, resolvedElem) {
                var resolutionDeferred = $.Deferred();
                resolutionDeferreds.push(resolutionDeferred);
                var styleSheetData = $(resolvedElem).text();
                var styleSheetUriRelativeToPackageDocument = contentDocumentURI;
                preprocessCssStyleSheetData(styleSheetData, styleSheetUriRelativeToPackageDocument,
                    contentDocumentDom, function(resolvedStylesheetData) {
                        $(resolvedElem).text(resolvedStylesheetData);
                        resolutionDeferred.resolve();
                    });
            });
        }

        /**
         * Obtain the reference to the ResourceCache object that caches already fetched resources - used so that
         * the given resource referenced by relative path is fetched only once. The cache is attached to the content document body.
         * // TODO: use it on global EPUB book level to share caching of resources referenced multiple times within the book.
         *
         * @param {Object} contentDocumentDom The content document whose body element has/will have the cache attached to.
         * @return {Object} The cache with hrefs relative to the package document (.opf) as keys
         * and browser object URL as values for fetched resources.
         */
        function obtainDocumentResourcesCache(contentDocumentDom) {
            // The hash of already loaded/imported stylesheet hrefs is being tracked globally on the content document level:
            var documentResourcesCache = $(contentDocumentDom.body).data('epubResourcesCache');
            if (typeof documentResourcesCache === 'undefined') {
                // first use, initialize:
                documentResourcesCache = new ResourceCache;
                $(contentDocumentDom.body).data('epubResourcesCache', documentResourcesCache);
            }
            return documentResourcesCache;
        }

        function blob2BinArray(blob, callback) {
            var fileReader = new FileReader();
            fileReader.onload = function(){
                var arrayBuffer = this.result;
                callback(new Uint8Array(arrayBuffer));
            };
            fileReader.readAsArrayBuffer(blob);
        }

        // TODO: move out to the epub module, as a new "encryption" submodule?
        function xorObfuscatedBlob(obfuscatedResourceBlob, prefixLength, xorKey, callback) {
            var obfuscatedPrefixBlob = obfuscatedResourceBlob.slice(0, prefixLength);
            blob2BinArray(obfuscatedPrefixBlob, function (bytes) {
                var masklen = xorKey.length;
                for (var i = 0; i < prefixLength; i++) {
                    bytes[i] = bytes[i] ^ (xorKey[i % masklen]);
                }
                var deobfuscatedPrefixBlob = new Blob([bytes], { type: obfuscatedResourceBlob.type });
                var remainderBlob = obfuscatedResourceBlob.slice(prefixLength);
                var deobfuscatedBlob = new Blob([deobfuscatedPrefixBlob, remainderBlob],
                    { type: obfuscatedResourceBlob.type });

                callback(deobfuscatedBlob);
            });
        }

        // TODO: move out to the epub module, as a new "encryption" submodule?
        function embeddedFontDeobfuscateIdpf(obfuscatedResourceBlob, callback) {
            var uid = _packageJson.metadata.id;
            var hashedUid = window.Crypto.SHA1(unescape(encodeURIComponent(uid.trim())), { asBytes: true });
            var prefixLength = 1040;
            // Shamelessly copied from
            // https://github.com/readium/readium-chrome-extension/blob/26d4b0cafd254cfa93bf7f6225887b83052642e0/scripts/models/path_resolver.js#L102 :
            xorObfuscatedBlob(obfuscatedResourceBlob, prefixLength, hashedUid, callback);
        }

        // TODO: move out to the epub module, as a new "encryption" submodule?
        function urnUuidToByteArray(id) {
            var uuidRegexp = /(urn:uuid:)?([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})/i;
            var matchResults = uuidRegexp.exec(id);
            var rawUuid =  matchResults[2]+matchResults[3]+matchResults[4]+matchResults[5]+matchResults[6];
            if (! rawUuid || rawUuid.length != 32) {
                console.error('Bad UUID format for ID :' + id);
            }
            var byteArray = [];
            for (var i = 0; i < 16; i++) {
                var byteHex =  rawUuid.substr(i*2, 2);
                var byteNumber = parseInt(byteHex, 16);
                byteArray.push(byteNumber);
            }
            return byteArray;
        }

        // TODO: move out to the epub module, as a new "encryption" submodule?
        function embeddedFontDeobfuscateAdobe(obfuscatedResourceBlob, callback) {
            var uid = _packageJson.metadata.id;
            // extract the UUID and convert to big-endian binary form (16 bytes):
            var uidWordArray = urnUuidToByteArray(uid);
            var prefixLength = 1024;
            xorObfuscatedBlob(obfuscatedResourceBlob, prefixLength, uidWordArray, callback)
        }


        // PUBLIC API

        /**
         * Determine whether the documents fetched using this fetcher require special programmatic handling.
         * (resolving of internal resource references).
         * @returns {*} true if documents fetched using this fetcher require special programmatic handling
         * (resolving of internal resource references). Typically needed for zipped EPUBs or exploded EPUBs that contain
         * encrypted resources specified in META-INF/encryption.xml.
         *
         * false if documents can be fed directly into a window or iframe by src URL without using special fetching logic.
         */
        this.shouldFetchProgrammatically = function (){
            return _isExploded;
        };

        this.getPackageUrl = function() {
            return _dataFetcher.getPackageUrl();
        };

        this.getFileContentsFromPackage = function(filePathRelativeToPackageRoot, callback, onerror) {

            _dataFetcher.fetchFileContentsText(filePathRelativeToPackageRoot, function (fileContents) {
                callback(fileContents);
            }, onerror);
        };



        this.getXmlFileDom = function (xmlFilePathRelativeToPackageRoot, callback, onerror) {
            self.getFileContentsFromPackage(xmlFilePathRelativeToPackageRoot, function (xmlFileContents) {
                var fileDom = self.markupParser.parseXml(xmlFileContents);
                callback(fileDom);
            }, onerror);
        };

        this.getPackageFullPath = function(callback, onerror) {
            self.getXmlFileDom('META-INF/container.xml', function (containerXmlDom) {
                var packageFullPath = self.getRootFile(containerXmlDom);
                callback(packageFullPath);
            }, onerror);
        };

        this.getRootFile = function(containerXmlDom) {
            var rootFile = $('rootfile', containerXmlDom);
            var packageFullPath = rootFile.attr('full-path');
            console.log('packageFullPath: ' + packageFullPath);
            return packageFullPath;
        };

        this.getEncryptionDom = function (callback, onerror) {
            if (_encryptionDom) {
                callback(_encryptionDom);
            } else {
                self.getXmlFileDom('META-INF/encryption.xml', function (encryptionDom) {
                    _encryptionDom = encryptionDom;
                    callback(_encryptionDom);
                }, onerror);
            }
        };

        // TODO: move out to the epub module, as a new "encryption" submodule?
        this._initializeEncryptionHash = function (encryptionInitializedCallback) {
            self.getEncryptionDom(function (encryptionDom) {
                if (!_encryptionHash) {
                    _encryptionHash = {};
                }

                var isEncryptionSpecified = false;

                var encryptedData = $('EncryptedData', encryptionDom);
                encryptedData.each(function (index, encryptedData) {
                    var encryptionAlgorithm = $('EncryptionMethod', encryptedData).first().attr('Algorithm');

                    // For some reason, jQuery selector "" against XML DOM sometimes doesn't match properly
                    var cipherReference = $('CipherReference', encryptedData);
                    cipherReference.each(function (index, CipherReference) {
                        var cipherReferenceURI = $(CipherReference).attr('URI');
                        console.log('Encryption/obfuscation algorithm ' + encryptionAlgorithm + ' specified for ' +
                            cipherReferenceURI);
                        isEncryptionSpecified = true;
                        _encryptionHash[cipherReferenceURI] = encryptionAlgorithm;
                    });
                });
                console.log('_encryptionHash:');
                console.log(_encryptionHash);
                if (_isExploded && isEncryptionSpecified) {
                    _isExploded = false;
                }
                encryptionInitializedCallback();
            }, function (error) {
                console.log('Found no META-INF/encryption.xml:');
                console.log(error.message);
                console.log("Document doesn't make use of encryption.");
                encryptionInitializedCallback();
            });
        };

        // TODO: move out to the epub module, as a new "encryption" submodule?
        this.getEncryptionMethodForRelativePath = function(pathRelativeToRoot) {
            if (_encryptionHash){
                return _encryptionHash[pathRelativeToRoot];
            }   else {
                return undefined;
            }
        };

        this.getDecryptionFunctionForRelativePath = function (pathRelativeToRoot) {
            var encryptionMethod = self.getEncryptionMethodForRelativePath(pathRelativeToRoot);
            if (ENCRYPTION_METHODS[encryptionMethod]) {
                return ENCRYPTION_METHODS[encryptionMethod];
            } else {
                return undefined;
            }
        };

        this.getPackageDom = function (callback, onerror) {
            if (_packageDom) {
                callback(_packageDom);
            } else {
                // TODO: use jQuery's Deferred
                // Register all callbacks interested in initialized packageDom, launch its instantiation only once
                // and broadcast to all callbacks registered during the initialization once it's done:
                if (_packageDomInitializationSubscription) {
                    _packageDomInitializationSubscription.push(callback);
                } else {
                    _packageDomInitializationSubscription = [callback];
                    self.getPackageFullPath(function (packageFullPath) {
                        _packageFullPath = packageFullPath;
                        console.log('Have set _packageFullPath' + packageFullPath);
                        self.getXmlFileDom(packageFullPath, function (packageDom) {
                            _packageDom = packageDom;
                            _packageDomInitializationSubscription.forEach(function (subscriberCallback) {
                                subscriberCallback(packageDom);
                            });
                            _packageDomInitializationSubscription = undefined;
                        })
                    }, onerror);
                }
            }
        };

        this.convertPathRelativeToPackageToRelativeToBase = function (relativeToPackagePath) {
            return new URI(relativeToPackagePath).absoluteTo(_packageFullPath).toString();
        };

        this.relativeToPackageFetchFileContents = function(relativeToPackagePath, fetchMode, fetchCallback, onerror) {

            if (! onerror) {
                onerror = _handleError;
            }

            var pathRelativeToZipRoot = decodeURIComponent(self.convertPathRelativeToPackageToRelativeToBase(relativeToPackagePath));
            var fetchFunction = _dataFetcher.fetchFileContentsText;
            if (fetchMode === 'blob') {
                fetchFunction = _dataFetcher.fetchFileContentsBlob;
            } else if (fetchMode === 'data64uri') {
                fetchFunction = _dataFetcher.fetchFileContentsData64Uri;
            }
            fetchFunction.call(_dataFetcher, pathRelativeToZipRoot, fetchCallback, onerror);
        };

        this.resolveInternalPackageResources = function(contentDocumentURI, contentDocumentType, contentDocumentText,
                                                         resolvedDocumentCallback, onerror) {

            var contentDocumentDom = self.markupParser.parseMarkup(contentDocumentText, contentDocumentType);

            var resolutionDeferreds = [];

            resolveDocumentImages(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror);
            resolveDocumentLinkStylesheets(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror);
            resolveDocumentEmbeddedStylesheets(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror);

            $.when.apply($, resolutionDeferreds).done(function () {
                resolvedDocumentCallback(contentDocumentDom);
            });

        };

        this.getRelativeXmlFileDom = function (filePath, callback, errorCallback) {
            self.getXmlFileDom(self.convertPathRelativeToPackageToRelativeToBase(filePath), callback, errorCallback);
        };
//        this.getPackageDom = function (callback, onerror) {
//            return _dataFetcher.getPackageDom(callback, onerror);
//        };

        // Currently needed for deobfuscating fonts
        this.setPackageJson = function(packageJson, settingFinishedCallback) {
            _packageJson = packageJson;
            this._initializeEncryptionHash(settingFinishedCallback);
        };

    };

    return ResourceFetcher

});
