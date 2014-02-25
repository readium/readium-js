define(['require', 'module', 'jquery', 'URIjs', './markup_parser', './plain_resource_fetcher', './zip_resource_fetcher',
    './content_document_fetcher'],
    function (require, module, $, URI, MarkupParser, PlainResourceFetcher, ZipResourceFetcher, ContentDocumentFetcher) {

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
        var _packageDomInitializationDeferred;
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
                console.log('using new PlainResourceFetcher');
                _dataFetcher = new PlainResourceFetcher(self, rootUrl);
                _dataFetcher.initialize(function () {
                    callback(_dataFetcher);
                });
                return;
            } else {
                console.log('using new ZipResourceFetcher');
                _dataFetcher = new ZipResourceFetcher(self, rootUrl, libDir);
                callback(_dataFetcher);
            }
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

        this.fetchContentDocument = function (attachedData, contentDocumentResolvedCallback) {

            var contentDocumentFetcher = new ContentDocumentFetcher(attachedData.spineItem, self);
            contentDocumentFetcher.fetchContentDocumentAndResolveDom(contentDocumentResolvedCallback, function (err) {
                _handleError(err);
                callback.call(caller, success, attachedData);
            });
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
                if (_isExploded && isEncryptionSpecified) {
                    _isExploded = false;
                }
                encryptionInitializedCallback();
            }, function (error) {
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
                if (_packageDomInitializationDeferred) {
                    _packageDomInitializationDeferred.done(callback);
                } else {
                    _packageDomInitializationDeferred = $.Deferred();
                    _packageDomInitializationDeferred.done(callback);
                    self.getPackageFullPath(function (packageFullPath) {
                        _packageFullPath = packageFullPath;
                        self.getXmlFileDom(packageFullPath, function (packageDom) {
                            _packageDom = packageDom;
                            _packageDomInitializationDeferred.resolve(packageDom);
                            _packageDomInitializationDeferred = undefined;
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
