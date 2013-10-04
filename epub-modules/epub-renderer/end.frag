        var origLoadIframeFunction = ReadiumSDK.Helpers.LoadIframe;
        var origReadiumSDKModelSpineItem = ReadiumSDK.Models.SpineItem;
        ReadiumSDK.Models.SpineItem = function(itemData, index, spine) {
            function SpineItem() {
                this.media_type = itemData.media_type;
            }
            SpineItem.prototype = new origReadiumSDKModelSpineItem(itemData, index, spine);
            SpineItem.constructor = SpineItem;
            return new SpineItem();
        };

        var loadIframeFunctionGenerator = function(epubFetch) {
            return  function(iframe, src, callback, context) {
                if (epubFetch.isPackageExploded()) {
                    return origLoadIframeFunction(iframe, src, callback, context);
                } else {
                    var onLoadWrapperFunction = function(boolArg) {
                        var context = this;
                        var itemHref = context.currentSpineItem.href;
                        epubFetch.relativeToPackageFetchFileContents(itemHref, 'text', function(contentDocumentText) {
                            var srcMediaType = context.currentSpineItem.media_type;

                            epubFetch.resolveInternalPackageResources(itemHref, srcMediaType, contentDocumentText,
                                function (resolvedContentDocumentDom) {
                                    var contentDocument = iframe.contentDocument;
                                    contentDocument.replaceChild(resolvedContentDocumentDom.documentElement,
                                        contentDocument.documentElement);
                                    callback.call(context, boolArg);
                                });
                        }, function(err) {
                            if (err.message) {
                                console.error(err.message);
                            };
                            console.error(err);
                            callback.call(context, boolArg);
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
        var EpubRendererModule = function (epubFetch, elementToBindReaderTo, packageData) {

            /*
             * Patch the ReadiumSDK.Helpers.LoadIframe global function to support zipped EPUB packages:
             */
            ReadiumSDK.Helpers.LoadIframe = loadIframeFunctionGenerator(epubFetch);

            var reader = new ReadiumSDK.Views.ReaderView({
              el: elementToBindReaderTo
            });

            // Description: The public interface
            return {

                openBook : function () { 
                    return reader.openBook(packageData);
                },
                openSpineItemElementCfi : function (idref, elementCfi) { 
                    return reader.openSpineItemElementCfi(idref, elementCfi); 
                },
                openSpineItemPage: function(idref, pageIndex) {
                    return reader.openSpineItemPage(idref, pageIndex);
                },
                openPageIndex: function(pageIndex) {
                    return reader.openPageIndex(pageIndex);
                },
                openPageRight : function () { 
                    return reader.openPageRight(); 
                },
                openPageLeft : function () { 
                    return reader.openPageLeft(); 
                },
                updateSettings : function (settingsData) {
                    return reader.updateSettings(settingsData);
                },
                bookmarkCurrentPage : function () {
                    return reader.bookmarkCurrentPage();
                }
            };
        };
        return EpubRendererModule;
});
