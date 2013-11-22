define(['require', 'module', 'jquery', 'underscore', 'backbone', 'URIjs'],

    function (require, module, $, _, Backbone, URI) {

        var self = this;

        var loadIframeFunctionGenerator = function(reader, getCurrentResourceFetcher, origLoadIframeFunction) {
            return  function(iframe, src, callback, context) {

                if (getCurrentResourceFetcher().isPackageExploded()) {
                    return origLoadIframeFunction(iframe, src, callback, context);
                } else {
                    var onLoadWrapperFunction = function(success) {
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
                    return origLoadIframeFunction(iframe, emptyDocumentDataUri, onLoadWrapperFunction, context);
                }
            };
        };

        return function (ReadiumSDK, reader, getCurrentResourceFetcher) {


            /*
             * Patch the ReadiumSDK.Helpers.LoadIframe global function to support zipped EPUB packages:
             */

            var origLoadIframeFunction = ReadiumSDK.Helpers.LoadIframe;

            ReadiumSDK.Helpers.LoadIframe = loadIframeFunctionGenerator(reader, getCurrentResourceFetcher, origLoadIframeFunction);

        };

    });

