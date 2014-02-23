define([], function(){

    var zipIframeLoader = function(ReadiumSDK, getCurrentResourceFetcher) {

        var basicIframeLoader = new ReadiumSDK.Views.IFrameLoader();

        this.addIFrameEventListener = function(eventName, callback, context) {
            basicIframeLoader.addIFrameEventListener(eventName, callback, context);
        };

        this.loadIframe = function(iframe, src, callback, caller, attachedData) {

            if (getCurrentResourceFetcher().shouldFetchProgrammatically()) {
                basicIframeLoader.loadIframe(iframe, src, callback, caller, attachedData);
            } else {
                var basicLoadCallback = function(success) {
                    getCurrentResourceFetcher().fetchContentDocument(attachedData, function(resolvedContentDocumentDom){
                        var contentDocument = iframe.contentDocument;
                        contentDocument.replaceChild(resolvedContentDocumentDom.documentElement,
                            contentDocument.documentElement);
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
