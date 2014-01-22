define(['require', 'module', 'jquery', 'URIjs', './discover_content_type'], function (require, module, $, URI, ContentTypeDiscovery) {
    console.log('plain_fetcher module id: ' + module.id);

    var PlainExplodedFetcher = function(parentFetcher, baseUrl){

        var self = this;
        var _packageDocumentAbsoluteUrl;
        var _packageDocumentRelativePath;

        // INTERNAL FUNCTIONS

        function fetchFileContents(pathRelativeToPackageRoot, readCallback, onerror) {
            console.log('binary fetching ' + pathRelativeToPackageRoot);
            var fileUrl = self.resolveURI(pathRelativeToPackageRoot);
            console.log(pathRelativeToPackageRoot + ' resolves to ' + fileUrl);

            if (typeof pathRelativeToPackageRoot === 'undefined') {
                throw 'Fetched file relative path is undefined!';
            }

            var xhr = new XMLHttpRequest();
            xhr.open('GET', fileUrl, true);
            xhr.responseType = 'arraybuffer';
            xhr.onerror = onerror;

            xhr.onload = function (loadEvent) {
                readCallback(xhr.response);
            };

            xhr.send();
        }


        // PUBLIC API

        this.initialize = function(callback) {
            console.log('baseUrl: ' + baseUrl);

            parentFetcher.getXmlFileDom('META-INF/container.xml', function (containerXmlDom) {
                _packageDocumentRelativePath = parentFetcher.getRootFile(containerXmlDom);
                _packageDocumentAbsoluteUrl = self.resolveURI(_packageDocumentRelativePath);

                callback();

            }, function(error) {
                console.error("unable to find package document: " + error);
                _packageDocumentAbsoluteUrl = baseUrl;

                callback();
            });
        };

        this.resolveURI = function (pathRelativeToPackageRoot) {
            return baseUrl + "/" + pathRelativeToPackageRoot;
        };


        this.getPackageUrl = function() {
            return _packageDocumentAbsoluteUrl;
        };

        this.fetchFileContentsText = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
            console.log('plain fetching ' + pathRelativeToPackageRoot);
            var fileUrl = self.resolveURI(pathRelativeToPackageRoot);
            console.log(pathRelativeToPackageRoot + ' resolves to ' + fileUrl);

            if (typeof fileUrl === 'undefined') {
                throw 'Fetched file URL is undefined!';
            }
            $.ajax({
                url: fileUrl,
                dataType: 'text',
                async: true,
                success: function (result) {
                    fetchCallback(result);
                },
                error: function (xhr, status, errorThrown) {
                    console.log('Error when AJAX fetching ' + fileUrl);
                    console.log(status);
                    console.log(errorThrown);
                    onerror(errorThrown);
                }
            });
        };

        this.fetchFileContentsBlob = function(pathRelativeToPackageRoot, fetchCallback, onerror) {

            var decryptionFunction = parentFetcher.getDecryptionFunctionForRelativePath(pathRelativeToPackageRoot);
            if (decryptionFunction) {
                console.log('== decryption required for ' + pathRelativeToPackageRoot);
                var origFetchCallback = fetchCallback;
                fetchCallback = function (unencryptedBlob) {
                    decryptionFunction(unencryptedBlob, function (decryptedBlob) {
                        origFetchCallback(decryptedBlob);
                    });
                };
            }
            fetchFileContents(pathRelativeToPackageRoot, function (contentsArrayBuffer) {
                var blob = new Blob([contentsArrayBuffer], {
                    type: ContentTypeDiscovery.identifyContentTypeFromFileName(pathRelativeToPackageRoot)
                });
                fetchCallback(blob);
            }, onerror);
        };

        this.relativeToPackageFetchFileContents = function (pathRelativeToPackageRoot, fetchMode, fetchCallback, onerror) {
            // TODO: implement other (binary) fetch modes
            self.fetchFileContentsText(pathRelativeToPackageRoot, fetchCallback, onerror);
        };

        this.getPackageDom = function (callback, onerror) {
            console.log('getting package DOM');
            console.log('_packageDocumentRelativePath: ' + _packageDocumentRelativePath);

            self.fetchFileContentsText(_packageDocumentRelativePath, function (packageXml) {
                var packageDom = parentFetcher.markupParser.parseXml(packageXml);
                callback(packageDom);
            }, onerror);
        };

    };

    return PlainExplodedFetcher;
});
