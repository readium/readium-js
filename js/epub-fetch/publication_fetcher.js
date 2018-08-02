//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//
//  Redistribution and use in source and binary forms, with or without modification,
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice,
//  this list of conditions and the following disclaimer in the documentation and/or
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be
//  used to endorse or promote products derived from this software without specific
//  prior written permission.

define(['jquery', 'URIjs', './plain_resource_fetcher', './zip_resource_fetcher',
    './content_document_fetcher', './resource_cache', './encryption_handler', './discover_content_type', 'readium_shared_js/helpers', 'readium_shared_js/XmlParse'],
    function ($, URI, PlainResourceFetcher, ZipResourceFetcher, ContentDocumentFetcher,
              ResourceCache, EncryptionHandler, ContentTypeDiscovery, Helpers, XmlParse) {

    var PublicationFetcher = function(ebookURL, jsLibRoot, sourceWindow, cacheSizeEvictThreshold, contentDocumentTextPreprocessor, contentType) {

        var self = this;

        var _ebookURLOPF = undefined;
        var ebookURLTrimmed = ebookURL;
        try {
            //.absoluteTo("http://readium.org/epub")
            ebookURLTrimmed = new URI(ebookURLTrimmed).search('').hash('').toString();
        } catch(err) {
            console.error(err);
            console.log(ebookURL);
        }
        if (/\.opf$/.test(ebookURLTrimmed)) {
            
            var iSlash = ebookURLTrimmed.lastIndexOf("/");
            if (iSlash >= 0) {
                console.log("ebookURL is OPF: " + ebookURL);
                
                ebookURL = ebookURLTrimmed.substr(0, iSlash+1);
                console.log("ebookURL rebased: " + ebookURL);
                
                _ebookURLOPF = ebookURLTrimmed.substr(iSlash+1, ebookURLTrimmed.length-1);
                console.log("ebookURL OPF file (bypass META-INF/container.xml): " + _ebookURLOPF);
            }
        } else if (/\/META-INF\/container\.xml$/.test(ebookURLTrimmed)) {
            ebookURL = ebookURL.substr(0, ebookURL.length-("/META-INF/container.xml".length)+1);
        }
        
        self.contentTypePackageReadStrategyMap = {
            'application/oebps-package+xml': 'exploded',
            'application/epub+zip': 'zipped',
            'application/zip': 'zipped'
        };

        var _shouldConstructDomProgrammatically;
        var _resourceFetcher;
        var _encryptionHandler;
        var _packageFullPath;
        var _packageDocumentAbsoluteUrl;
        var _packageDom;
        var _packageDomInitializationDeferred;
        var _publicationResourcesCache = new ResourceCache(sourceWindow, cacheSizeEvictThreshold);

        var _contentDocumentTextPreprocessor = contentDocumentTextPreprocessor;
        var _contentType = contentType;

        this.initialize =  function(callback) {

            var isEpubExploded = isExploded();

            // Non exploded EPUBs (i.e. zipped .epub documents) should be fetched in a programmatical manner:
            _shouldConstructDomProgrammatically = !isEpubExploded;
            console.log("_shouldConstructDomProgrammatically INIT: " + _shouldConstructDomProgrammatically);
            
            createResourceFetcher(isEpubExploded, function(resourceFetcher) {
    
                //NOTE: _resourceFetcher == resourceFetcher
                
                self.getPackageDom(
                    function() {callback(resourceFetcher);},
                    function(error) {console.error("unable to find package document: " + error); callback(undefined);}
                );
            });
        };



        // INTERNAL FUNCTIONS

        function isExploded() {
            // binary object means packed EPUB
            if (ebookURL instanceof Blob || ebookURL instanceof File) return false;

            if (_contentType &&
                (
                    _contentType.indexOf("application/epub+zip") >= 0
                    ||
                    _contentType.indexOf("application/zip") >= 0
                    ||
                    _contentType.indexOf("application/octet-stream") >= 0
                )
               ) return false;
            
            var uriTrimmed = ebookURL;
            
            try {
                //.absoluteTo("http://readium.org/epub")
                uriTrimmed = new URI(uriTrimmed).search('').hash('').toString();
            } catch(err) {
                console.error(err);
                console.log(ebookURL);
            }
            
            // dumb test: ends with ".epub" file extension
            return  !(/\.epub[3?]$/.test(uriTrimmed));
            
            // var ext = ".epub";
            // return ebookURL.indexOf(ext, ebookURL.length - ext.length) === -1;
        }

        function createResourceFetcher(isExploded, callback) {
            if (isExploded) {
                console.log(' --- using PlainResourceFetcher');
                _resourceFetcher = new PlainResourceFetcher(self);
                callback(_resourceFetcher);
            } else {
                console.log(' --- using ZipResourceFetcher');
                _resourceFetcher = new ZipResourceFetcher(self, jsLibRoot);
                callback(_resourceFetcher);
            }
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
        this.shouldConstructDomProgrammatically = function (){
            
            return _shouldConstructDomProgrammatically;
        };

        /**
         * Determine whether the media assets (audio, video, images) within content documents require special
         * programmatic handling.
         * @returns {*} true if content documents fetched using this fetcher require programmatic fetching
         * of media assets. Typically needed for zipped EPUBs.
         *
         * false if paths to media assets are accessible directly for the browser through their paths relative to
         * the base URI of their content document.
         */
        this.shouldFetchMediaAssetsProgrammatically = function() {
            
            var ret = _shouldConstructDomProgrammatically && !isExploded();
            return ret;
        };

        this.getEbookURL = function() {
            return ebookURL;
        };

        this.getEbookURL_FilePath = function() {
            
            return Helpers.getEbookUrlFilePath(ebookURL);
        };
        
        this.getJsLibRoot = function() {
            return jsLibRoot;
        };

        this.flushCache = function() {
            _publicationResourcesCache.flushCache();
        };


        this.getPackageUrl = function() {
            return _packageDocumentAbsoluteUrl;
        };
        
        this.getPackageFullPathRelativeToBase = function() {
              return _packageFullPath;
        };

        this.fetchContentDocument = function (attachedData, loadedDocumentUri, contentDocumentResolvedCallback, errorCallback) {

            // Resources loaded for previously fetched document no longer need to be pinned:
            // DANIEL: what about 2-page synthetic spread of fixed layout documents / spine items?
            // See https://github.com/readium/readium-js/issues/104
            _publicationResourcesCache.unPinResources();


            var contentDocumentFetcher = new ContentDocumentFetcher(self, attachedData.spineItem, loadedDocumentUri, _publicationResourcesCache, _contentDocumentTextPreprocessor);
            contentDocumentFetcher.fetchContentDocumentAndResolveDom(contentDocumentResolvedCallback, errorCallback);
        };

        this.getFileContentsFromPackage = function(filePathRelativeToPackageRoot, callback, onerror) {
            
            // AVOID INVOKING fetchFileContentsText() directly, use relativeToPackageFetchFileContents() wrapper instead so that additional checks are performed.
            
            // META-INF/container.xml initial fetch, see this.initialize()
            if (!_packageFullPath) {
                console.debug("FETCHING (INIT) ... " + filePathRelativeToPackageRoot);
                if (filePathRelativeToPackageRoot && filePathRelativeToPackageRoot.charAt(0) == '/') {
                    filePathRelativeToPackageRoot = filePathRelativeToPackageRoot.substr(1);
                }
                _resourceFetcher.fetchFileContentsText(filePathRelativeToPackageRoot, function (fileContents) {
                    callback(fileContents);
                }, onerror);
            } else {
                self.relativeToPackageFetchFileContents(filePathRelativeToPackageRoot, 'text', function (fileContents) {
                    callback(fileContents);
                }, onerror);
            }
        };



        this.getXmlFileDom = function (xmlFilePathRelativeToPackageRoot, callback, onerror) {
            self.getFileContentsFromPackage(xmlFilePathRelativeToPackageRoot, function (xmlFileContents) {
                var fileDom = XmlParse.fromString(xmlFileContents, "text/xml");
                callback(fileDom);
            }, onerror);
        };

        this.getPackageFullPath = function(callback, onerror) {
            self.getXmlFileDom('/META-INF/container.xml', function (containerXmlDom) {
                var packageFullPath = self.getRootFile(containerXmlDom);
                callback(packageFullPath);
            }, onerror);
        };

        this.getRootFile = function(containerXmlDom) {
            var rootFile = $('rootfile', containerXmlDom);
            var packageFullPath = rootFile.attr('full-path');
            return packageFullPath;
        };

        this.getPackageDom = function (callback, onerror) {
            if (_packageDom) {
                callback(_packageDom);
            } else {
                // TODO: use jQuery's Deferred
                // Register all callbacks interested in initialized packageDom, launch its instantiation only once
                // and broadcast to all callbacks registered during the initialization once it's done:
                if (_packageDomInitializationDeferred) {
                    _packageDomInitializationDeferred.done(callback);
                } else {
                    _packageDomInitializationDeferred = $.Deferred();
                    _packageDomInitializationDeferred.done(callback);
                    
                    var func = function (packageFullPath) {
                                
                        _packageFullPath = packageFullPath;
                        _packageDocumentAbsoluteUrl = _resourceFetcher.resolveURI(_packageFullPath);
                        
                        console.debug("PACKAGE: ");
                        console.log(_packageFullPath);
                        console.log(_packageDocumentAbsoluteUrl);
                        
                        if (packageFullPath && packageFullPath.charAt(0) != '/') {
                            packageFullPath = '/' + packageFullPath;
                        }
                        
                        self.getXmlFileDom(packageFullPath, function (packageDom) {
                            _packageDom = packageDom;
                            _packageDomInitializationDeferred.resolve(packageDom);
                            _packageDomInitializationDeferred = undefined;
                        })
                    };
                    
                    // We already know which OPF to open, let's bypass META-INF/container.xml rootFile discovery 
                    if (_ebookURLOPF) {
                        func(_ebookURLOPF);
                    } else {
                        self.getPackageFullPath(func, onerror);
                    }
                }
            }
        };

        // Note that if the relativeToPackagePath parameter is in fact absolute
        // (starting with "/", already relative to the EPUB archive's base folder)
        // then the returned value is relativeToPackagePath.
        this.convertPathRelativeToPackageToRelativeToBase = function (relativeToPackagePath) {
            var uriStr = new URI(relativeToPackagePath).absoluteTo(_packageFullPath).toString();
            // Note that _packageFullPath is just be a relative path (to the root folder that contains ./META-INF/container.xml), and so is the returned path
            //console.log(relativeToPackagePath + " /// " + _packageFullPath + " === " + uriStr);
            return uriStr;
        };

        // Note that the relativeToPackagePath parameter can in fact be absolute
        // (starting with "/", already relative to the EPUB archive's base folder)
        // For example: /META-INF/
        this.relativeToPackageFetchFileContents = function(relativeToPackagePath, fetchMode, fetchCallback, errorCallback) {

            var pathRelativeToEpubRoot = decodeURIComponent(self.convertPathRelativeToPackageToRelativeToBase(relativeToPackagePath));

            console.debug("FETCHING ... " + pathRelativeToEpubRoot);

            // In case we received an absolute path, convert it to relative form or the fetch will fail:
            if (pathRelativeToEpubRoot.charAt(0) === '/') {
                pathRelativeToEpubRoot = pathRelativeToEpubRoot.substr(1);
            }

            var onerror = function() {
                
                var err = arguments ?
                    (
                        (arguments.length && (arguments[0] instanceof Error)) ?
                        arguments[0]
                        : ((arguments instanceof Error) ? arguments : undefined)
                    )
                    : undefined;
                
                // hacky! :(
                // (we need to filter these out from the console output, as they are in fact false positives)
                var optionalFetch = (pathRelativeToEpubRoot.indexOf("META-INF/com.apple.ibooks.display-options.xml") == 0)
                || (pathRelativeToEpubRoot.indexOf("META-INF/encryption.xml") == 0);
                    
                console.log("MISSING: " + pathRelativeToEpubRoot);
                    
                if (!optionalFetch) {
                    if (err) {
                        console.error(err);
                        
                        if (err.message) {
                            console.debug(err.message);
                        }
                        if (err.stack) {
                            console.log(err.stack);
                        }
                    }
                }
                
                if (errorCallback) errorCallback.apply(this, arguments);
            };

            // ZIP resource fetcher does not support absolute URLs outside of the EPUB archive
            // (e.g. MathJax.js and annotations.css)
            if (//!isExploded()
                _shouldConstructDomProgrammatically // includes isExploded() and obfuscated fonts
                &&
                new URI(relativeToPackagePath).scheme() !== '') {

                console.log("shouldConstructDomProgrammatically EXTERNAL RESOURCE ...");

                  if (fetchMode === 'blob') {

                      var xhr = new XMLHttpRequest();
                      xhr.open('GET', relativeToPackagePath, true);
                      xhr.responseType = 'arraybuffer';
                      xhr.onerror = onerror;

                      xhr.onload = function (loadEvent) {
                        var blob = new Blob([xhr.response], {
                            type: ContentTypeDiscovery.identifyContentTypeFromFileName(relativeToPackagePath)
                        });
                        fetchCallback(blob);
                      };

                      xhr.send();

                  } else if (fetchMode === 'data64uri') {
                      console.error("data64uri??");
                  } else {

                      $.ajax({
                          // encoding: "UTF-8",
                          // mimeType: "text/plain; charset=UTF-8",
                          // beforeSend: function( xhr ) {
                          //     xhr.overrideMimeType("text/plain; charset=UTF-8");
                          // },
                          isLocal: false,
                          url: relativeToPackagePath,
                          dataType: 'text', //https://api.jquery.com/jQuery.ajax/
                          async: true,
                          success: function (result) {
                              fetchCallback(result);
                          },
                          error: function (xhr, status, errorThrown) {
                              onerror(new Error(errorThrown));
                          }
                    });
                }

                return;
            }
            
            var fetchFunction = _resourceFetcher.fetchFileContentsText;
            if (fetchMode === 'blob') {
                fetchFunction = _resourceFetcher.fetchFileContentsBlob;
            } else if (fetchMode === 'data64uri') {
                console.error("data64uri??");
                fetchFunction = _resourceFetcher.fetchFileContentsData64Uri;
            }

            fetchFunction.call(_resourceFetcher, pathRelativeToEpubRoot, fetchCallback, onerror);
        };



        this.getRelativeXmlFileDom = function (filePath, callback, errorCallback) {
            self.getXmlFileDom(self.convertPathRelativeToPackageToRelativeToBase(filePath), callback, errorCallback);
        };

        // TODO: this function seems unused, and the callback parameter seems to be onError 
        function readEncriptionData(callback) {
            self.getXmlFileDom('/META-INF/encryption.xml', function (encryptionDom, error) {

                if(error) {
                    
                    _encryptionHandler = new EncryptionHandler(undefined);
                    callback();
                }
                else {

                    var encryptions = [];


                    var encryptedData = $('EncryptedData', encryptionDom);
                    encryptedData.each(function (index, encryptedData) {
                        var encryptionAlgorithm = $('EncryptionMethod', encryptedData).first().attr('Algorithm');

                        encryptions.push({algorithm: encryptionAlgorithm});

                        // For some reason, jQuery selector "" against XML DOM sometimes doesn't match properly
                        var cipherReference = $('CipherReference', encryptedData);
                        cipherReference.each(function (index, CipherReference) {
                            var cipherReferenceURI = $(CipherReference).attr('URI');
                            console.log('Encryption/obfuscation algorithm ' + encryptionAlgorithm + ' specified for ' +
                                cipherReferenceURI);
                            encryptions[cipherReferenceURI] = encryptionAlgorithm;
                        });
                    });
                }

            });
        }

        // Currently needed for deobfuscating fonts
        this.setPackageMetadata = function(packageMetadata, settingFinishedCallback) {

            self.getXmlFileDom('/META-INF/encryption.xml', function (encryptionDom) {

                var encryptionData = EncryptionHandler.CreateEncryptionData(packageMetadata.id, encryptionDom);

                _encryptionHandler = new EncryptionHandler(encryptionData);

                if (_encryptionHandler.isEncryptionSpecified()) {
                    // EPUBs that use encryption for any resources should be fetched in a programmatical manner:
                    _shouldConstructDomProgrammatically = true;
                    console.log("_shouldConstructDomProgrammatically ENCRYPTION ACTIVE: " + _shouldConstructDomProgrammatically);
                }

                settingFinishedCallback();


            }, function(error){

                _encryptionHandler = new EncryptionHandler(undefined);

                settingFinishedCallback();
            });
        };

        this.getDecryptionFunctionForRelativePath = function(pathRelativeToRoot) {
            return _encryptionHandler.getDecryptionFunctionForRelativePath(pathRelativeToRoot);
        }
    };

    return PublicationFetcher

});
