define(['require', 'module', 'jquery', 'underscore', 'backbone', './views/reflowable_pagination_view'],
    function (require, module, $, _, Backbone, ReflowablePaginationView) {

        var EpubReflowableModule = function (epubFetch, spineObject, viewerSettingsObject, CFIAnnotations, bindings) {

            var reflowableView = new ReflowablePaginationView({
                epubFetch: epubFetch,
                spineItem: spineObject,
                viewerSettings: viewerSettingsObject,
                contentDocumentCFIs: CFIAnnotations,
                bindings: bindings
            });

            // Description: The public interface
            return {

                render: function (goToLastPage, hashFragmentId) {
                    return reflowableView.render(goToLastPage, hashFragmentId);
                },
                nextPage: function () {
                    return reflowableView.nextPage();
                },
                previousPage: function () {
                    return reflowableView.previousPage();
                },
                showPageByHashFragment: function (hashFragmentId) {
                    return reflowableView.showPageByElementId(hashFragmentId);
                },
                showPageByNumber: function (pageNumber) {
                    return reflowableView.showPageByNumber(pageNumber);
                },
                showPageByCFI: function (CFI) {
                    return reflowableView.showPageByCFI(CFI);
                },
                onFirstPage: function () {
                    return reflowableView.pages.onFirstPage();
                },
                onLastPage: function () {
                    return reflowableView.pages.onLastPage();
                },
                showPagesView: function () {
                    return reflowableView.showView();
                },
                hidePagesView: function () {
                    return reflowableView.hideView();
                },
                numberOfPages: function () {
                    return reflowableView.pages.get("numberOfPages");
                },
                currentPage: function () {
                    return reflowableView.pages.get("currentPages");
                },
                setSyntheticLayout: function (isSynthetic) {
                    return reflowableView.setSyntheticLayout(isSynthetic);
                },
                on: function (eventName, callback, callbackContext) {
                    return reflowableView.on(eventName, callback, callbackContext);
                },
                off: function (eventName, callback) {
                    return reflowableView.off(eventName, callback);
                },
                resizeContent: function () {
                    return reflowableView.paginateContentDocument();
                },
                customize: function (customElement, styleNameOrCSSObject) {
                    reflowableView.customizeStyles(customElement, styleNameOrCSSObject);
                    return this;
                }
            };
        };
        return EpubReflowableModule;
    });