define(['require', 'module', 'jquery', 'URIjs', './discover_content_type'], function (require, module, $, URI, ContentTypeDiscovery) {

    var ZipResourceFetcher = function(parentFetcher, baseUrl, libDir) {

        var _checkCrc32 = false;
        var _zipFs;

        // INTERNAL FUNCTIONS

        // Description: perform a function with an initialized zip filesystem, making sure that such filesystem is initialized.
        // Note that due to a race condition, more than one zip filesystem may be instantiated.
        // However, the last one to be set on the model object will prevail and others would be garbage collected later.
        function withZipFsPerform(callback, onerror) {

            if (_zipFs) {

                callback(_zipFs, onerror);

            } else {

                zip.workerScriptsPath = libDir;
                _zipFs = new zip.fs.FS();
                _zipFs.importHttpContent(baseUrl, true, function () {

                    callback(_zipFs, onerror);

                }, onerror)
            }
        }

        function fetchFileContents (relativePathRelativeToPackageRoot, readCallback, onerror) {

            if (typeof relativePathRelativeToPackageRoot === 'undefined') {
                throw 'Fetched file relative path is undefined!';
            }

            withZipFsPerform(function (zipFs, onerror) {
                var entry = zipFs.find(relativePathRelativeToPackageRoot);
                if (typeof entry === 'undefined' || entry === null) {
                    onerror(new Error('Entry ' + relativePathRelativeToPackageRoot + ' not found in zip ' + baseUrl));
                } else {
                    if (entry.directory) {
                        onerror(new Error('Entry ' + relativePathRelativeToPackageRoot + ' is a directory while a file has been expected'));
                    } else {
                        readCallback(entry);
                    }
                }
            }, onerror);
        }


        // PUBLIC API

        this.getPackageUrl = function() {
            return baseUrl;
        };

        this.fetchFileContentsText = function(relativePathRelativeToPackageRoot, fetchCallback, onerror) {

            fetchFileContents(relativePathRelativeToPackageRoot, function (entry) {
                entry.getText(fetchCallback, undefined, _checkCrc32);
            }, onerror)
        };

        this.fetchFileContentsData64Uri = function(relativePathRelativeToPackageRoot, fetchCallback, onerror) {
            fetchFileContents(relativePathRelativeToPackageRoot, function (entry) {
                entry.getData64URI(ContentTypeDiscovery.identifyContentTypeFromFileName(relativePathRelativeToPackageRoot),
                    fetchCallback, undefined, _checkCrc32);
            }, onerror)
        };

        this.fetchFileContentsBlob = function(relativePathRelativeToPackageRoot, fetchCallback, onerror) {
            var decryptionFunction = parentFetcher.getDecryptionFunctionForRelativePath(relativePathRelativeToPackageRoot);
            if (decryptionFunction) {
                var origFetchCallback = fetchCallback;
                fetchCallback = function (unencryptedBlob) {
                    decryptionFunction(unencryptedBlob, function (decryptedBlob) {
                        origFetchCallback(decryptedBlob);
                    });
                };
            }
            fetchFileContents(relativePathRelativeToPackageRoot, function (entry) {
                entry.getBlob(ContentTypeDiscovery.identifyContentTypeFromFileName(relativePathRelativeToPackageRoot), fetchCallback,
                    undefined, _checkCrc32);
            }, onerror)
        };

    };

    return ZipResourceFetcher;
});
