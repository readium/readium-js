define([], function(){

    var zipIframeLoader = function(ReadiumSDK, getCurrentResourceFetcher) {

        var basicIframeLoader = new ReadiumSDK.Views.IFrameLoader();

        this.loadIframe = function(iframe, src, callback, caller, attachedData) {

            if (getCurrentResourceFetcher().shouldFetchProgrammatically()) {
                basicIframeLoader.loadIframe(iframe, src, callback, caller, attachedData);
            } else {
                var basicLoadCallback = function(success) {

                    var itemHref = attachedData.spineItem.href;
                    getCurrentResourceFetcher().relativeToPackageFetchFileContents(itemHref, 'text', function(contentDocumentText) {
                        var srcMediaType = attachedData.spineItem.media_type;

                        getCurrentResourceFetcher().resolveInternalPackageResources(itemHref, srcMediaType, contentDocumentText,
                            function (resolvedContentDocumentDom) {
                                var contentDocument = iframe.contentDocument;
                                contentDocument.replaceChild(resolvedContentDocumentDom.documentElement,
                                    contentDocument.documentElement);
                                callback.call(caller, success, attachedData);
                            });
                    }, function(err) {
                        if (err.message) {
                            console.error(err.message);
                        }

                        console.error(err);
                        callback.call(caller, success, attachedData);
                    });
                };
                // Feed an artificial empty HTML document to the IFRAME, then let the wrapper onload function
                // take care of actual document loading (from zipped EPUB) and calling callbacks:
                var emptyDocumentDataUri = window.URL.createObjectURL(
                    new Blob(['<html><body></body></html>'], {'type': 'text/html'})
                );

                basicIframeLoader.loadIframe(iframe, emptyDocumentDataUri, basicLoadCallback, caller, attachedData);
            }
        };
    };

    return zipIframeLoader;
});
