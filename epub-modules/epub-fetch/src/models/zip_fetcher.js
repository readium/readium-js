define(['require', 'module', 'jquery', 'URIjs/URI', './fetch_base'], function (require, module, $, URI, EpubFetchBase) {
    console.log('zip_fetcher module id: ' + module.id);

    var ZipFetcher = function(baseUrl, contentTypeDiscovery, libDir) {

        var self = this;
        var _checkCrc32 = false;
        var _zipFs;
        var _packageFullPath;
        var _packageDom;
        var _packageDomInitializationSubscription;
        var _baseFetcher = new EpubFetchBase();

        // Description: perform a function with an initialized zip filesystem, making sure that such filesystem is initialized.
        // Note that due to a race condition, more than one zip filesystem may be instantiated.
        // However, the last one to be set on the model object will prevail and others would be garbage collected later.
        function withZipFsPerform(callback, onerror) {

            if (_zipFs) {

                callback(_zipFs);

            } else {

                console.log('zip.workerScriptsPath = ' + libDir);
                zip.workerScriptsPath = libDir;
                _zipFs = new zip.fs.FS();
                _zipFs.importHttpContent(baseUrl, false, function () {

                    callback(_zipFs);

                }, onerror)
            }
        }

        function identifyContentTypeFromFileName(fileUri) {
            return contentTypeDiscovery.identifyContentTypeFromFileName(fileUri);
        }

        // Zipped EPUB packages are not exploded by definition:
        this.isExploded = function () {
            return false;
        };

        this.resolveURI = function (epubResourceURI) {
            return epubResourceURI;
        };

        function fetchFileContents (relativePath, readCallback, onerror) {

            if (typeof relativePath === 'undefined') {
                throw 'Fetched file relative path is undefined!';
            }

            withZipFsPerform(function (zipFs) {
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
            }, self.handleError);
        }

        function fetchFileContentsText(relativePath, fetchCallback, onerror) {

            fetchFileContents(relativePath, function (entry) {
                entry.getText(fetchCallback, undefined, _checkCrc32);
            }, onerror)
        }

        function fetchFileContentsData64Uri(relativePath, fetchCallback, onerror) {
            fetchFileContents(relativePath, function (entry) {
                entry.getData64URI(identifyContentTypeFromFileName(relativePath), fetchCallback, undefined,  _checkCrc32);
            }, onerror)
        }

        function fetchFileContentsBlob(relativePath, fetchCallback, onerror) {
            fetchFileContents(relativePath, function (entry) {
                entry.getBlob(identifyContentTypeFromFileName(relativePath), fetchCallback, undefined,  _checkCrc32);
            }, onerror)
        }

        this.relativeToPackageFetchFileContents = function(relativeToPackagePath, fetchMode, fetchCallback, onerror) {

            console.log('Have got _packageFullPath ' + _packageFullPath);
            console.log('packageFullPath: ' + _packageFullPath);
            console.log('relativePath: ' + relativeToPackagePath);
            var pathRelativeToPackage = decodeURIComponent(new URI(relativeToPackagePath).absoluteTo(_packageFullPath).toString());
            console.log('pathRelativeToPackage: ' + pathRelativeToPackage);
            var fetchFunction = fetchFileContentsText;
            if (fetchMode === 'blob') {
                fetchFunction = fetchFileContentsBlob;
            } else if (fetchMode === 'data64uri') {
                fetchFunction = fetchFileContentsData64Uri;
            }
            fetchFunction.call(self, pathRelativeToPackage, fetchCallback, onerror);
        };

        function getFileContentsFromPackage(fileRelativePath, callback) {

            fetchFileContentsText(fileRelativePath, function (fileContents) {
                callback(fileContents);
            }, _baseFetcher.handleError);
        }

//        function getContainerXml(callback) {
//            var fileRelativePath = 'META-INF/container.xml';
//            getFileContentsFromPackage(fileRelativePath, callback);
//        }

        function getXmlFileDom (xmlFileRelativePath, callback) {

            getFileContentsFromPackage(xmlFileRelativePath, function (xmlFileContents) {
                var fileDom = _baseFetcher.parseXml(xmlFileContents);
                callback(fileDom);
            });
        }

        function getPackageFullPath(callback) {

            getXmlFileDom('META-INF/container.xml', function (containerXmlDom) {
                getRootFile(containerXmlDom, callback);
            });
        }

        function getRootFile (containerXmlDom, callback) {
            var rootFile = $('rootfile', containerXmlDom);
            var packageFullPath = rootFile.attr('full-path');
            console.log('packageFullPath: ' + packageFullPath);
            callback(packageFullPath);
        }

        this.getPackageDom = function(callback) {

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
                    });
                }
            }
        }
    };

    return ZipFetcher;
});