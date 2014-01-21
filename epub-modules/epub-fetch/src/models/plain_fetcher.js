define(['require', 'module', 'jquery', 'URIjs', './discover_content_type'], function (require, module, $, URI, ContentTypeDiscovery) {
    console.log('plain_fetcher module id: ' + module.id);

    var PlainExplodedFetcher = function(parentFetcher, baseUrl){

        var self = this;
        var _packageAbsoluteUrl;
        var _packageRelativePath;

        // INTERNAL FUNCTIONS

        function fetchFileContents(fileRelativePath, readCallback, onerror) {
            console.log('binary fetching ' + fileRelativePath);
            var fileUrl = self.resolveURI(fileRelativePath);
            console.log(fileRelativePath + ' resolves to ' + fileUrl);

            if (typeof fileRelativePath === 'undefined') {
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
                _packageRelativePath = parentFetcher.getRootFile(containerXmlDom);
                _packageAbsoluteUrl = self.resolveURI(_packageRelativePath);

                callback();

            }, function(error) {
                console.error("unable to find package document: " + error);
                _packageAbsoluteUrl = baseUrl;

                callback();
            });
        };

        this.resolveURI = function (epubResourceURI) {
            return baseUrl + "/" + epubResourceURI;
            // Make absolute to the package document path
//            var epubResourceRelURI = new URI(epubResourceURI);
//            var epubResourceAbsURI = epubResourceRelURI.absoluteTo(baseUrl);
//            return epubResourceAbsURI.toString();
        };


        this.getPackageUrl = function() {
            return _packageAbsoluteUrl;
        };

        this.getXmlFileDom = function(fileRelativePath, callback, errorCallback) {
            self.fetchFileContentsText(fileRelativePath, function (xmlFileContents) {
                var fileDom = parentFetcher.markupParser.parseXml(xmlFileContents);
                callback(fileDom);
            }, errorCallback);
        };

        this.fetchFileContentsText = function(fileRelativePath, fetchCallback, onerror) {
            console.log('plain fetching ' + fileRelativePath);
            var fileUrl = self.resolveURI(fileRelativePath);
            console.log(fileRelativePath + ' resolves to ' + fileUrl);

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

        this.fetchFileContentsBlob = function(relativePath, fetchCallback, onerror) {

            var decryptionFunction = parentFetcher.getDecryptionFunctionForRelativePath(relativePath);
            if (decryptionFunction) {
                console.log('== decryption required for ' + relativePath);
                var origFetchCallback = fetchCallback;
                fetchCallback = function (unencryptedBlob) {
                    decryptionFunction(unencryptedBlob, function (decryptedBlob) {
                        origFetchCallback(decryptedBlob);
                    });
                };
            }
            fetchFileContents(relativePath, function (contentsArrayBuffer) {
                var blob = new Blob([contentsArrayBuffer], {
                    type: ContentTypeDiscovery.identifyContentTypeFromFileName(relativePath)
                });
                fetchCallback(blob);
            }, onerror);
        };

        this.getRelativeXmlFileDom = function(relativeToPackagePath, callback, errorCallback) {
            getXmlFileDom (this.resolveURI(relativeToPackagePath), callback, errorCallback);
        };
        
        this.relativeToPackageFetchFileContents = function (relativeToPackagePath, fetchMode, fetchCallback, onerror) {
            // TODO: implement other (binary) fetch modes
            self.fetchFileContentsText(relativeToPackagePath, fetchCallback, onerror);
        };

        this.getPackageDom = function (callback, onerror) {
            console.log('getting package DOM');
            console.log('_packageRelativePath: ' + _packageRelativePath);

            self.fetchFileContentsText(_packageRelativePath, function (packageXml) {

                var packageDom = parentFetcher.markupParser.parseXml(packageXml);
                callback(packageDom);

            }, onerror);
        };

    };

    return PlainExplodedFetcher;
});