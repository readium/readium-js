define(['require', 'module', 'jquery', 'URIjs', './markup_parser'], function (require, module, $, URI, MarkupParser) {
    console.log('plain_fetcher module id: ' + module.id);

    var PlainExplodedFetcher = function(baseUrl){

        var _parser = new MarkupParser();
        var _jsonMetadata;

        var _packageUrl;

        this.initialize = function(callback) {

            var containerPath = new URI(baseUrl + '/META-INF/container.xml');

            getXmlFileDom(containerPath.path(), function (containerDom) {
                _packageUrl = baseUrl + "/" + getRootFile(containerDom);

                callback();

            }, function(error) {
                console.error("unable to find package document: " + error);
                _packageUrl = baseUrl;

                callback();
            });
        };

        this.resolveURI = function (epubResourceURI) {
            // Make absolute to the package document path
            var epubResourceRelURI = new URI(epubResourceURI);
            var epubResourceAbsURI = epubResourceRelURI.absoluteTo(_packageUrl);
            return epubResourceAbsURI.toString();
        };


        this.getPackageUrl = function() {
            return _packageUrl;
        };


        function getRootFile (containerDom) {
            var rootFile = $('rootfile', containerDom);
            var packageFullPath = rootFile.attr('full-path');
            console.log('packageFullPath: ' + packageFullPath);
            return packageFullPath;
        }

        function getXmlFileDom (filePath, callback, errorCallback) {

            fetchFileContentsText(filePath, function (xmlFileContents) {
                var fileDom = _parser.parseXml(xmlFileContents);
                callback(fileDom);
            }, errorCallback);
        }

        function fetchFileContentsText (fileUrl, fetchCallback, onerror) {

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
        }

        this.getRelativeXmlFileDom = function(relativeToPackagePath, callback, errorCallback) {
            getXmlFileDom (this.resolveURI(relativeToPackagePath), callback, errorCallback);
        };
        
        this.relativeToPackageFetchFileContents = function (relativeToPackagePath, fetchMode, fetchCallback, onerror) {
            fetchFileContentsText(this.resolveURI(relativeToPackagePath), fetchCallback, onerror);
        };

        this.getEncryptionDom = function (callback, onerror) {
            // TODO: need a reliable method of finding META-INF/encryption.xml.
            // This is a challenge since we begin with a path directly to the package document and don't go through META-INF/container.xml.
            onerror(new Error('Getting encryption descriptor not yet implemented!'));
        }

        this.getPackageDom = function (callback, onerror) {
            console.log('getting package DOM');

            console.log('baseUrl: ' + _packageUrl);

            fetchFileContentsText(_packageUrl, function (packageXml) {

                var packageDom = _parser.parseXml(packageXml);
                callback(packageDom);

            }, onerror);
        };

        // Currently needed for deobfuscating fonts
        this.setPackageJson = function(jsonMetadata) {
            _jsonMetadata = jsonMetadata;
        };
    };

    return PlainExplodedFetcher;
});