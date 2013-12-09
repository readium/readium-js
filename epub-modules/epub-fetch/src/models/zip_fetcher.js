define(['require', 'module', 'jquery', 'URIjs', './markup_parser', './discover_content_type'], function (require, module, $, URI, MarkupParser, ContentTypeDiscovery) {
    console.log('zip_fetcher module id: ' + module.id);

    var ZipFetcher = function(baseUrl, libDir) {

        var self = this;
        var _checkCrc32 = false;
        var _zipFs;
        var _packageFullPath;
        var _packageJson;
        var _encryptionDom;
        var _encryptionHash;
        var _packageDom;
        var _packageDomInitializationSubscription;
        var _markupParser = new MarkupParser();

        var ENCRYPTION_METHODS = {
            'http://www.idpf.org/2008/embedding': embeddedFontDeobfuscateIdpf
        }

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

        // Description: perform a function with an initialized zip filesystem, making sure that such filesystem is initialized.
        // Note that due to a race condition, more than one zip filesystem may be instantiated.
        // However, the last one to be set on the model object will prevail and others would be garbage collected later.
        function withZipFsPerform(callback, onerror) {

            if (_zipFs) {

                callback(_zipFs, onerror);

            } else {

                console.log('zip.workerScriptsPath = ' + libDir);
                zip.workerScriptsPath = libDir;
                _zipFs = new zip.fs.FS();
                _zipFs.importHttpContent(baseUrl, true, function () {

                    callback(_zipFs, onerror);

                }, onerror)
            }
        }

        this.resolveURI = function (epubResourceURI) {
            return epubResourceURI;
        };

        function fetchFileContents (relativePath, readCallback, onerror) {

            if (typeof relativePath === 'undefined') {
                throw 'Fetched file relative path is undefined!';
            }

            withZipFsPerform(function (zipFs, onerror) {
                var entry = zipFs.find(relativePath);
                if (typeof entry === 'undefined' || entry === null) {
                    onerror(new Error('Entry ' + relativePath + ' not found in zip ' + baseUrl));
                } else {
                    if (entry.directory) {
                        onerror(new Error('Entry ' + relativePath + ' is a directory while a file has been expected'));
                    } else {
                        readCallback(entry);
                    }
                }
            }, onerror);
        }

        function fetchFileContentsText(relativePath, fetchCallback, onerror) {

            fetchFileContents(relativePath, function (entry) {
                entry.getText(fetchCallback, undefined, _checkCrc32);
            }, onerror)
        }

        function fetchFileContentsData64Uri(relativePath, fetchCallback, onerror) {
            fetchFileContents(relativePath, function (entry) {
                entry.getData64URI(ContentTypeDiscovery.identifyContentTypeFromFileName(relativePath), fetchCallback, undefined,  _checkCrc32);
            }, onerror)
        }

        function fetchFileContentsBlob(relativePath, fetchCallback, onerror) {
            var encryptionMethod = this.getEncryptionMethodForRelativePath(relativePath);
            if (encryptionMethod) {
                console.log('== decryption required for ' + relativePath);
                var decryptionFunction = ENCRYPTION_METHODS[encryptionMethod];
                var origFetchCallback = fetchCallback;
                fetchCallback = function (unencryptedBlob) {
                    decryptionFunction(unencryptedBlob, function (decryptedBlob) {
                        origFetchCallback(decryptedBlob);
                    });
                };
            }
            // TODO: implement deobfuscation based on _encryptionDom configuration
            fetchFileContents(relativePath, function (entry) {
                entry.getBlob(ContentTypeDiscovery.identifyContentTypeFromFileName(relativePath), fetchCallback, undefined,  _checkCrc32);
            }, onerror)
        }

        this.relativeToPackageFetchFileContents = function(relativeToPackagePath, fetchMode, fetchCallback, onerror) {

            if (! onerror) {
                onerror = _handleError;
            }

            var pathRelativeToZipRoot = decodeURIComponent(new URI(relativeToPackagePath).absoluteTo(_packageFullPath).toString());
            var fetchFunction = fetchFileContentsText;
            if (fetchMode === 'blob') {
                fetchFunction = fetchFileContentsBlob;
            } else if (fetchMode === 'data64uri') {
                fetchFunction = fetchFileContentsData64Uri;
            }
            fetchFunction.call(self, pathRelativeToZipRoot, fetchCallback, onerror);
        };

        function getFileContentsFromPackage(fileRelativePath, callback, onerror) {

            fetchFileContentsText(fileRelativePath, function (fileContents) {
                callback(fileContents);
            }, onerror);
        }

//        function getContainerXml(callback) {
//            var fileRelativePath = 'META-INF/container.xml';
//            getFileContentsFromPackage(fileRelativePath, callback);
//        }

        function getXmlFileDom (xmlFileRelativePath, callback, onerror) {

            getFileContentsFromPackage(xmlFileRelativePath, function (xmlFileContents) {
                var fileDom = _markupParser.parseXml(xmlFileContents);
                callback(fileDom);
            }, onerror);
        }

        function getPackageFullPath(callback, onerror) {

            getXmlFileDom('META-INF/container.xml', function (containerXmlDom) {
                getRootFile(containerXmlDom, callback);
            }, onerror);
        }

        function getRootFile (containerXmlDom, callback) {
            var rootFile = $('rootfile', containerXmlDom);
            var packageFullPath = rootFile.attr('full-path');
            console.log('packageFullPath: ' + packageFullPath);
            callback(packageFullPath);
        }

        function blob2BinArray(blob, callback) {
            var fileReader = new FileReader();
            fileReader.onload = function(){
                var arrayBuffer = this.result;
                callback(new Uint8Array(arrayBuffer));
            }
            fileReader.readAsArrayBuffer(blob);
        }

        // TODO: move to the epub module into a new "encryption" submodule?
        function embeddedFontDeobfuscateIdpf(obfuscatedResourceBlob, callback) {
            // TODO: use implementation from Readium Chrome Extension
            var uid = _packageJson.metadata.id;
            var hashedUid = window.Crypto.SHA1(unescape(encodeURIComponent(uid.trim())), { asBytes: true });
            // Shamelessly copied from
            // https://github.com/readium/readium-chrome-extension/blob/26d4b0cafd254cfa93bf7f6225887b83052642e0/scripts/models/path_resolver.js#L102 :
            //            if ((resourceBlob.indexOf("OTTO") == 0) || (resourceBlob.indexOf("wOFF") == 0)) {
            //                callback(resourceBlob);
            //            }
            //            else {
            var obfuscatedPrefixBlob = obfuscatedResourceBlob.slice(0, 1040);
            blob2BinArray(obfuscatedPrefixBlob, function(bytes) {
                var masklen = hashedUid.length;
                for (var i = 0; i < 1040; i++) {
                    bytes[i] = bytes[i] ^ (hashedUid[i % masklen]);
                }
                var deobfuscatedPrefixBlob = new Blob([bytes], { type: obfuscatedResourceBlob.type });
                var remainderBlob = obfuscatedResourceBlob.slice(1040);
                var deobfuscatedBlob = new Blob([deobfuscatedPrefixBlob, remainderBlob], { type: obfuscatedResourceBlob.type });

                callback(deobfuscatedBlob);
            });
        }

        // TODO: move to the epub module as a new "encryption_config" submodule?
        this._initializeEncryptionHash = function () {
            this.getEncryptionDom(function (encryptionDom) {
                // TODO: build the hash
                if (!_encryptionHash) {
                    _encryptionHash = {};
                }
                $('EncryptedData', encryptionDom).each(function (index, encryptedData) {
                    var encryptionAlgorithm = $('EncryptionMethod', encryptedData).first().attr('Algorithm');
                    $('CipherData>CipherReference', encryptedData).each(function (index, CipherReference) {
                        var cipherReferenceURI = $(CipherReference).attr('URI');
                        _encryptionHash[cipherReferenceURI] = encryptionAlgorithm;
                    });
                });
                console.log('_encryptionHash:');
                console.log(_encryptionHash);
            }, function (error) {
                console.log('Found no META-INF/encrypion.xml:');
                console.log(error.message);
                console.log("Document doesn't make use of encryption.");
            });
        };

        // TODO: move to the epub module as a new "encryption_config" submodule?
        this.getEncryptionMethodForRelativePath = function(pathRelativeToRoot) {
            if (_encryptionHash){
                return _encryptionHash[pathRelativeToRoot];
            }   else {
                return undefined;
            }
        };

        this.getEncryptionDom = function (callback, onerror) {
            if (_encryptionDom) {
                callback(_encryptionDom);
            } else {
                getXmlFileDom('META-INF/encryption.xml', function (encryptionDom) {
                    _encryptionDom = encryptionDom;
                    callback(_encryptionDom);
                }, onerror);
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
                    getPackageFullPath(function (packageFullPath) {
                        _packageFullPath = packageFullPath;
                        console.log('Have set _packageFullPath' + packageFullPath);
                        getXmlFileDom(packageFullPath, function (packageDom) {
                            _packageDom = packageDom;
                            _packageDomInitializationSubscription.forEach(function (subscriberCallback) {
                                subscriberCallback(packageDom);
                            });
                            _packageDomInitializationSubscription = undefined;
                        })
                    }, onerror);
                }
            }
        }

        // Currently needed for deobfuscating fonts
        this.setPackageJson = function(packageJson) {
            _packageJson = packageJson;
            this._initializeEncryptionHash();
        };
    };

    return ZipFetcher;
});