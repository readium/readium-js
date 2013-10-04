define(['require', 'module', 'jquery', 'underscore', 'backbone', 'epub_fetch_module',
    'epub_module', 'epub_reading_system', 'epub_renderer_module'],
    function (require, module, $, _, Backbone, EpubFetchModule, EpubModule, EpubReadingSystem, EpubRendererModule) {
        /**
         * Creates an instance of the Readium.js object.
         *
         * @constructor
         * @param elementToBindReaderTo The document element to bind display of the reader to.
         * @param packageDocumentURL : The URL to the package document
         * @param jsLibDir The path (relative to the current document) in which dependant zip.js libraries can be found.
         * @param definitionCallback The callback function that asynchronously receives the object's public interface once it has been initialized (document has been parsed).
         */
        var Readium = function (elementToBindReaderTo, packageDocumentURL, jsLibDir, definitionCallback) {

            // -------------- Initialization of viewer ------------------ //
            var epubFetch = new EpubFetchModule({
                packageDocumentURL: packageDocumentURL,
                libDir: jsLibDir
            });
            var epub = new EpubModule(epubFetch, function () {

                var renderer = new EpubRendererModule(epubFetch, elementToBindReaderTo, epub.getPackageData());
                
                // Readium.js module api
                definitionCallback({

                    openBook : function () { 
                        return renderer.openBook();
                    },
                    openSpineItemElementCfi : function (idref, elementCfi) { 
                        return renderer.openSpineItemElementCfi(idref, elementCfi);
                    },
                    openSpineItemPage: function(idref, pageIndex) {
                        return renderer.openSpineItemPage(idref, pageIndex);
                    },
                    openPageIndex: function(pageIndex) {
                        return renderer.openPageIndex(pageIndex);
                    },
                    openPageRight : function () { 
                        return renderer.openPageRight();
                    },
                    openPageLeft : function () { 
                        return renderer.openPageLeft();
                    },
                    updateSettings : function (settingsData) {
                        return renderer.updateSettings(settingsData);
                    },
                    bookmarkCurrentPage : function () {
                        return renderer.bookmarkCurrentPage();
                    }
                });    
            });
        };

        // Note: the epubReadingSystem object may not be ready when directly using the
        // window.onload callback function (from within an (X)HTML5 EPUB3 content document's Javascript code)
        // To address this issue, the recommended code is:
        // -----
        console.log(navigator.epubReadingSystem);
        return Readium;
    });
