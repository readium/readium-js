define(['require', 'module', 'jquery', 'URIjs', './markup_parser'], function (require, module, $, URI, MarkupParser) {
    console.log('plain_fetcher module id: ' + module.id);

    var PlainExplodedFetcher = function(baseUrl){

        var _parser = new MarkupParser();

        this.resolveURI = function (epubResourceURI) {
            // Make absolute to the package document path
            var epubResourceRelURI = new URI(epubResourceURI);
            var epubResourceAbsURI = epubResourceRelURI.absoluteTo(baseUrl);
            return epubResourceAbsURI.toString();
        };

        function fetchFileContentsText (fileUrl, fetchCallback, onerror) {

            if (typeof fileUrl === 'undefined') {
                throw 'Fetched file URL is undefined!';
            }
            $.ajax({
                url: fileUrl,
                dataType: 'text',
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
            fetchFileContentsText(this.resolveURI(relativeToPackagePath), fetchCallback, onerror);
        };

        this.getPackageDom = function (callback, onerror) {
            console.log('getting package DOM');

            console.log('baseUrl: ' + baseUrl);

            fetchFileContentsText(baseUrl, function (packageXml) {

                var packageDom = _parser.parseXml(packageXml);
                callback(packageDom);

            }, onerror);
        };
    };

    return PlainExplodedFetcher;
});