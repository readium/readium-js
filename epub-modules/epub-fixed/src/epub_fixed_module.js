define(['require', 'module', 'jquery', 'underscore', 'backbone', './views/fixed_pagination_view'],
    function (require, module, $, _, Backbone, FixedPaginationView) {


        var EpubFixedModule = function (epubFetch, spineObjects, viewerSettingsObject) {

            var fixedView = new FixedPaginationView({
                epubFetch : epubFetch,
                spineObjects : spineObjects,
                viewerSettings : viewerSettingsObject
            });

            // Description: The public interface
            return {

                render : function (goToLastPage, hashFragmentId) {
                    return fixedView.render(goToLastPage, hashFragmentId);
                },
                nextPage : function () {
                    return fixedView.nextPage();
                },
                previousPage : function () {
                    return fixedView.previousPage();
                },
                showPageByHashFragment : function (hashFragmentId) {
                    return;
                },
                showPageByNumber : function (pageNumber) {
                    return fixedView.showPageNumber(pageNumber);
                },
                showPageByCFI : function (CFI) {
                    return;
                },
                onFirstPage : function () {
                    return fixedView.fixedPageViews.onFirstPage();
                },
                onLastPage : function () {
                    return fixedView.fixedPageViews.onLastPage();
                },
                showPagesView : function () {
                    return fixedView.showPagesView();
                },
                hidePagesView : function () {
                    return fixedView.hidePagesView();
                },
                numberOfPages : function () {
                    return fixedView.fixedPageViews.get("fixedPages").length;
                },
                currentPage : function () {
                    return fixedView.fixedPageViews.get("currentPages");
                },
                // setFontSize : function (fontSize) {
                //     return;
                // },
                // setMargin : function (margin) {
                //     return;
                // },
                // setTheme : function (theme) {
                //     return;
                // },
                setSyntheticLayout : function (isSynthetic) {
                    return fixedView.setSyntheticLayout(isSynthetic);
                },
                on : function (eventName, callback, callbackContext) {
                    return fixedView.on(eventName, callback, callbackContext);
                },
                off : function (eventName, callback) {
                    return fixedView.off(eventName, callback);
                },
                resizeContent : function () {
                    return fixedView.resizePageViews();
                },
                customize : function (customProperty, styleNameOrCSS) {
                    fixedView.customize(customProperty, styleNameOrCSS);
                    return this;
                }
            };
        };
        return EpubFixedModule;
    });