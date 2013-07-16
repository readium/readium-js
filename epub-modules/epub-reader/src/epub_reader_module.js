define(['require', 'module', 'jquery', 'underscore', 'backbone', './views/epub_reader_view'],
    function (require, module, $, _, Backbone, EpubReaderView) {


        var EpubReaderModule = function (readerBoundElement, epubSpineInfo, viewerSettings, epubFetch, renderStrategy) {

            var epubReaderView = new EpubReaderView({
                readerElement: readerBoundElement,
                spineInfo: epubSpineInfo,
                viewerSettings: viewerSettings,
                epubFetch: epubFetch,
                renderStrategy: renderStrategy
            });

            // Description: The public interface
            return {

                render: function () {
                    return epubReaderView.render();
                },
                showFirstPage: function (callback, callbackContext) {
                    return epubReaderView.showFirstPage(callback, callbackContext);
                },
                showSpineItem: function (spineIndex, callback, callbackContext) {
                    return epubReaderView.showSpineItem(spineIndex, callback, callbackContext);
                },
                showPageByCFI: function (CFI, callback, callbackContext) {
                    return epubReaderView.showPageByCFI(CFI, callback, callbackContext);
                },
                showPageByElementId: function (spineIndex, hashFragmentId, callback, callbackContext) {
                    return epubReaderView.showPageByElementId(spineIndex, hashFragmentId, callback, callbackContext);
                },
                nextPage: function (callback, callbackContext) {
                    return epubReaderView.nextPage(callback, callbackContext);
                },
                previousPage: function (callback, callbackContext) {
                    return epubReaderView.previousPage(callback, callbackContext);
                },
                setFontSize: function (fontSize) {
                    return epubReaderView.setFontSize(fontSize);
                },
                setMargin: function (margin) {
                    return epubReaderView.setMargin(margin);
                },
                setTheme: function (theme) {
                    return epubReaderView.setTheme(theme);
                },
                setSyntheticLayout: function (isSynthetic) {
                    return epubReaderView.setSyntheticLayout(isSynthetic);
                },
                getNumberOfPages: function () {
                    return epubReaderView.getNumberOfPages();
                },
                getCurrentPage: function () {
                    return epubReaderView.getCurrentPage();
                },
                on: function (eventName, callback, callbackContext) {
                    return epubReaderView.attachEventHandler(eventName, callback, callbackContext);
                },
                off: function (eventName) {
                    return epubReaderView.removeEventHandler(eventName);
                },
                getViewerSettings: function () {
                    return epubReaderView.getViewerSettings();
                },
                resizeContent: function () {
                    return epubReaderView.reader.fitCurrentPagesView();
                },
                customize: function (customProperty, styleNameOrCSS) {
                    epubReaderView.customize(customProperty, styleNameOrCSS);
                    return this;
                }
            };
        };
        return EpubReaderModule;
    });