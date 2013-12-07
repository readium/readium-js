define(['require', 'module', 'jquery', 'URIjs', './markup_parser'], function (require, module, $, URI, MarkupParser) {
    console.log('plain_fetcher module id: ' + module.id);

    var PlainExplodedFetcher = function(baseUrl){

        var _parser = new MarkupParser();

        var _packageUrl;

        getPackagePath();

        this.resolveURI = function (epubResourceURI) {
            // Make absolute to the package document path
            var epubResourceRelURI = new URI(epubResourceURI);
            var epubResourceAbsURI = epubResourceRelURI.absoluteTo(_packageUrl);
            return epubResourceAbsURI.toString();
        };


        this.getPackageUrl = function() {
            return _packageUrl;
        };

        function getPackagePath() {

            var containerPath = new URI(baseUrl + '/META-INF/container.xml');

            getXmlFileDom(containerPath.path(), function (containerDom) {
                _packageUrl = baseUrl + "/" + getRootFile(containerDom);
            }, function(error) {
                console.error("unable to find package document: " + error);
                _packageUrl = baseUrl;
            });

        }

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
            }, errorCallback, false);
        }

        function fetchFileContentsText (fileUrl, fetchCallback, onerror, async) {

            if (typeof fileUrl === 'undefined') {
                throw 'Fetched file URL is undefined!';
            }
            $.ajax({
                url: fileUrl,
                dataType: 'text',
                async: async,
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

        this.relativeToPackageFetchFileContents = function (relativeToPackagePath, fetchMode, fetchCallback, onerror) {
            fetchFileContentsText(this.resolveURI(relativeToPackagePath), fetchCallback, onerror, true);
        };

        this.getPackageDom = function (callback, onerror) {
            console.log('getting package DOM');

            console.log('baseUrl: ' + _packageUrl);

            fetchFileContentsText(_packageUrl, function (packageXml) {

                var packageDom = _parser.parseXml(packageXml);
                callback(packageDom);

            }, onerror, true);
        };
    };

    return PlainExplodedFetcher;
});