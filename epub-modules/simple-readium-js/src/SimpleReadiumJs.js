define(['require', 'module', 'jquery', 'underscore', 'backbone', 'epub_fetch_module',
    'epub_parser_module', 'epub_module', 'epub_reader_module',
    'epub_reading_system'],
    function (require, module, $, _, Backbone, EpubFetchModule, EpubParserModule, EpubModule, EpubReaderModule,
              EpubReadingSystem) {
        /**
         * Creates an instance of simple Readium object.
         *
         * @constructor
         * @param elementToBindReaderTo The document element to bind display of the reader to.
         * @param viewerPreferences The object holding the viewer settings.
         * @param viewerPreferences The URI of the package document (.opf file for exploded packages, .epub file for zipped ones).
         * @param jsLibDir The path (relative to the current document) in which dependant zip.js libraries can be found.
         * @param renderStrategy The render stratego to be used, "lazy" or "eager".
         * @param definitionCallback The callback function that asynchronously receives the object's public interface once it has been initialized (document has been parsed).
         */
        var SimpleReadiumJs = function (elementToBindReaderTo, viewerPreferences, packageDocumentURL, jsLibDir,
                                        renderStrategy, definitionCallback) {

            // -------------- Initialization of viewer ------------------ //
            var epubFetch = new EpubFetchModule(packageDocumentURL, jsLibDir);
            var epubParser = new EpubParserModule(epubFetch);
            epubParser.parse(function (packageDocumentObject) {
                var epub = new EpubModule(packageDocumentObject, epubFetch);
                var epubViewer = new EpubReaderModule(elementToBindReaderTo, epub.getSpineInfo(), viewerPreferences,
                    epubFetch, renderStrategy);
                // Description: The public interface, async definition:
                definitionCallback({

                    // epub module api
                    // -- None added so far

                    // epub viewer module api
                    render: function () {
                        return epubViewer.render();
                    },
                    showFirstPage: function (callback, callbackContext) {
                        return epubViewer.showFirstPage(callback, callbackContext);
                    },
                    showSpineItem: function (spineIndex, callback, callbackContext) {
                        return epubViewer.showSpineItem(spineIndex, callback, callbackContext);
                    },
                    showPageByCFI: function (CFI, callback, callbackContext) {
                        return epubViewer.showPageByCFI(CFI, callback, callbackContext);
                    },
                    showPageByElementId: function (spineIndex, hashFragmentId, callback, callbackContext) {
                        return epubViewer.showPageByElementId(spineIndex, hashFragmentId, callback, callbackContext);
                    },
                    nextPage: function (callback, callbackContext) {
                        return epubViewer.nextPage(callback, callbackContext);
                    },
                    previousPage: function (callback, callbackContext) {
                        return epubViewer.previousPage(callback, callbackContext);
                    },
                    setFontSize: function (fontSize) {
                        return epubViewer.setFontSize(fontSize);
                    },
                    setMargin: function (margin) {
                        return epubViewer.setMargin(margin);
                    },
                    setTheme: function (theme) {
                        return epubViewer.setTheme(theme);
                    },
                    setSyntheticLayout: function (isSynthetic) {
                        return epubViewer.setSyntheticLayout(isSynthetic);
                    },
                    getNumberOfPages: function () {
                        return epubViewer.getNumberOfPages();
                    },
                    getCurrentPage: function () {
                        return epubViewer.getCurrentPage.call(epubViewer);
                    },
                    on: function (eventName, callback, callbackContext) {
                        return epubViewer.on(eventName, callback, callbackContext);
                    },
                    off: function (eventName) {
                        return epubViewer.off(eventName);
                    },
                    getViewerSettings: function () {
                        return epubViewer.getViewerSettings();
                    },
                    resizeContent: function () {
                        return epubViewer.resizeContent();
                    },
                    customize: function (customElement, styleNameOrCSSObject) {
                        epubViewer.customize(customElement, styleNameOrCSSObject);
                        return this;
                    }
                });
            });
        };

        // Note: the epubReadingSystem object may not be ready when directly using the
        // window.onload callback function (from within an (X)HTML5 EPUB3 content document's Javascript code)
        // To address this issue, the recommended code is:
        // -----
        //        function doSomething() {
        console.log(navigator.epubReadingSystem);
        //        };

        return SimpleReadiumJs;
    });
