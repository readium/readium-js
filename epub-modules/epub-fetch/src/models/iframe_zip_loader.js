define([], function(){

    var zipIframeLoader = function(ReadiumSDK, getCurrentResourceFetcher) {

        var basicIframeLoader = new ReadiumSDK.Views.IFrameLoader();

        this.loadIframe = function(iframe, src, callback, context) {

            if (getCurrentResourceFetcher().isPackageExploded()) {
                basicIframeLoader.loadIframe(iframe, src, callback, context);
            } else {
                var basicLoadCallback = function(success) {
                    var context = this;
                    var itemHref = context.currentSpineItem.href;
                    getCurrentResourceFetcher().relativeToPackageFetchFileContents(itemHref, 'text', function(contentDocumentText) {
                        var srcMediaType = context.currentSpineItem.media_type;

                        getCurrentResourceFetcher().resolveInternalPackageResources(itemHref, srcMediaType, contentDocumentText,
                            function (resolvedContentDocumentDom) {
                                var contentDocument = iframe.contentDocument;
                                contentDocument.replaceChild(resolvedContentDocumentDom.documentElement,
                                    contentDocument.documentElement);
                                callback.call(context, success);
                            });
                    }, function(err) {
                        if (err.message) {
                            console.error(err.message);
                        }

                        console.error(err);
                        callback.call(context, success);
                    });
                };
                // Feed an artificial empty HTML document to the IFRAME, then let the wrapper onload function
                // take care of actual document loading (from zipped EPUB) and calling callbacks:
                var emptyDocumentDataUri = window.URL.createObjectURL(
                    new Blob(['<html><body></body></html>'], {'type': 'text/html'})
                );

                basicIframeLoader.loadIframe(iframe, emptyDocumentDataUri, basicLoadCallback, context);
            }
        };
    };

    return zipIframeLoader;
});
