define(['require', 'module', 'jquery', 'underscore', 'backbone', 'readerView', 'annotations_module'],

    function (require, module, $, _, Backbone, ReadiumSDK, annotations_module) {

        var ReadiumSDK = window.ReadiumSDK;

        var origLoadIframeFunction = ReadiumSDK.Helpers.LoadIframe;

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
        }

        var EpubRendererModule = function (epubFetch, elementToBindReaderTo, packageData) {

            /*
             * Patch the ReadiumSDK.Helpers.LoadIframe global function to support zipped EPUB packages:
             */
            ReadiumSDK.Helpers.LoadIframe = loadIframeFunctionGenerator(epubFetch);

            var reader = new ReadiumSDK.Views.ReaderView({
                el: elementToBindReaderTo
            });

            //TODODM this is questionable. There should be a better way. Ask Boris.
            var packageDom;
            epubFetch.getPackageDom(function (dom) {
                packageDom = dom;
                console.log("packageDom: " + packageDom);
            });

            var createFullyQualifiedCfi = function(cfi) {
                var spineIndex = reader.currentView.currentSpineItem.index
                var packageDocCFIComponent = EPUBcfi.generatePackageDocumentCFIComponentWithSpineIndex(spineIndex, packageDom);
                var completeCFI = EPUBcfi.generateCompleteCFI(packageDocCFIComponent, cfi);
                return completeCFI;
            };

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
                }, 

                addSelectionHighlight: function(id, type) {
                    debugger;
                    var annotationsManager = reader.getAnnotaitonsManagerForCurrentSpineItem();
                    var annotation = annotationsManager.addSelectionHighlight(id,type);
                    annotation.CFI = createFullyQualifiedCfi(annotation.CFI);
                    return annotation; 
                },

                addSelectionImageAnnotation: function(id, type) {
                    var annotationsManager = reader.getAnnotaitonsManagerForCurrentSpineItem();
                    var annotation = annotationsManager.addSelectionImageAnnotation(id,type);
                    annotation.CFI = createFullyQualifiedCfi(annotation.CFI);
                    return annotation;
                },

                addSelectionBookmark: function(id, type) {
                    var annotationsManager = reader.getAnnotaitonsManagerForCurrentSpineItem();
                    var annotation = annotationsManager.addSelectionBookmark(id,type);
                    annotation.CFI = createFullyQualifiedCfi(annotation.CFI);
                    return annotation;
                },



                showPageByCFI : function (CFI, callback, callbackContext) {
                    var contentDocHref = EPUBcfi.getContentDocHref(CFI, packageDom);
                    var spine = reader.spine.getItemByHref(contentDocHref);
                    var idref = spine.idref;
                    var targetElementCFI; 

                    // TODODM: this is hacky replace it properly
                    // what i'm doing here is essentially saying that we only expect one indirection step
                    // between package document and content document. to properly make this work, we need
                    // to wait until the content document is open and resolve the indirection then? 
                    // at least that's hwo justin does it.
                    var cfiWrapperPattern = new RegExp("^.*!")
                    // remove epubcfi( and indirection step
                    var partiallyNakedCfi = CFI.replace(cfiWrapperPattern, "");
                    // remove last paren
                    var nakedCfi = partiallyNakedCfi.substring(0, partiallyNakedCfi.length -1);
                    console.log("idref: " + idref + " nakedCfi=" + nakedCfi);
                    return reader.openSpineItemElementCfi(idref, nakedCfi);
                }, 


            };
        };

        return EpubRendererModule;

    });

