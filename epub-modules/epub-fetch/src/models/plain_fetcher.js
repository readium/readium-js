define(['require', 'module', 'jquery', 'URIjs', './fetch_base'], function (require, module, $, URI, EpubFetchBase) {
    console.log('plain_fetcher module id: ' + module.id);

    var PlainExplodedFetcher = function(baseUrl){

        var _fetchBase = new EpubFetchBase();

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

        this.isExploded = function () {
            return true;
        };

        this.relativeToPackageFetchFileContents = function (relativeToPackagePath, fetchMode, fetchCallback, onerror) {
            // Not translating relativeToPackagePath, as with exploded EPUB all the URLs are relative
            // to the current page context and are good to go verbatim for fetching:
            fetchFileContentsText(relativeToPackagePath, fetchCallback, onerror);
        };

        this.getPackageDom = function (callback) {
            console.log('getting package DOM');

            console.log('baseUrl: ' + baseUrl);

            fetchFileContentsText(baseUrl, function (packageXml) {

                var packageDom = _fetchBase.parseXml(packageXml);
                callback(packageDom);

            }, _fetchBase.handleError);
        };
    };

    return PlainExplodedFetcher;
});