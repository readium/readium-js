define(['require', 'module', 'jquery', 'underscore', 'backbone', 'URIjs'],

    function (require, module, $, _, Backbone, URI) {

        var self = this;

        var loadIframeFunctionGenerator = function(reader, getCurrentResourceFetcher, origLoadIframeFunction) {
            return  function(iframe, src, origCallback, context) {
                var callback = function (success) {
                    var epubContentDocument = this.$iframe[0].contentDocument;
                    $('a', epubContentDocument).click(function (clickEvent) {
                        // Check for both href and xlink:href attribute and get value
                        var href;
                        if (clickEvent.currentTarget.attributes["xlink:href"]) {
                            href = clickEvent.currentTarget.attributes["xlink:href"].value;
                        }
                        else {
                            href = clickEvent.currentTarget.attributes["href"].value;
                        }
                        var hrefUri = new URI(href);
                        var hrefIsRelative = hrefUri.is('relative');
                        var hrefUriHasFilename = hrefUri.filename();
                        var overrideClickEvent = false;

                        if (hrefIsRelative) {
                            // TODO:
                            if (hrefUriHasFilename /* TODO: && check whether href actually resolves to a spine item */) {

                                var currentSpineItemUri = new URI(context.currentSpineItem.href);
                                var openedSpineItemUri = hrefUri.absoluteTo(currentSpineItemUri);
                                var idref = openedSpineItemUri.pathname();
                                var hashFrag = openedSpineItemUri.fragment();
                                var spineItem = context.spine.getItemByHref(idref);
                                var pageData = new ReadiumSDK.Models.PageOpenRequest(spineItem, self);
                                if (hashFrag) {
                                    pageData.setElementId(hashFrag);
                                }
                                reader.openPage(pageData);
                                overrideClickEvent = true;
                            } // otherwise it's probably just a hash frag that needs to be handled by browser's default handling
                        } else {
                            // It's an absolute URL to a remote site - open it in a separate window outside the reader
                            window.open(href, '_blank');
                            overrideClickEvent = true;
                        }

                        if (overrideClickEvent) {
                            clickEvent.preventDefault();
                            clickEvent.stopPropagation();
                        }
                    });
                    origCallback.call(this, success);
                };

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

