EpubReader.EpubReaderView = Backbone.View.extend({

    initialize : function (options) {

        // Initialize the spine info thing, or whatever it's going to be called
        var currSpineIndex = 0;
        this.reader = new EpubReader.EpubReader({
            spineInfo : options.spineInfo,
            viewerSettings : options.viewerSettings
        });
        this.readerBoundElement = options.readerElement;
    },

    render : function () {

        // Set the element that this view will be bound to
        this.setElement(this.readerBoundElement);
        return this.el;
    },

    // ---- Public interface ------------------------------------------------------------------------

    // REFACTORING CANDIDATE: This will only work for reflowable page views; there is currently not a mapping between
    //   spine items and the page views in which they are rendered, for FXL epubs. When support for FXL is included, this 
    //   abstraction will include more.
    showSpineItem : function (spineIndex) {

        var pagesViewElement = this.reader.renderPagesView(spineIndex, false, undefined);
        this.$el.append(pagesViewElement);
    },

    // Rationale: As with the CFI library API, it is up to calling code to ensure that the content document CFI component is
    //   is a reference into the content document pointed to by the supplied spine index. 
    showPageByCFI : function (spineIndex, contentDocumentCFIComponent) {

        this.showSpineItem(spineIndex);

        // Show the element by passing the CFI fragment to the current view
    },

    showPageByElementId : function (spineIndex, elementId) { 

        // Rationale: Try to locate the element before switching to a new page view try/catch
        this.reader.getCurrentPageView().goToHashFragment(elementId);
        this.showSpineItem(spineIndex);
    },

    nextPage : function () {

        var currentPageView = this.reader.getCurrentPageView();
        if (currentPageView.onLastPage()) {
            this.renderNextPageView();
        }
        else {
            currentPageView.nextPage();
        }
    },

    previousPage : function () {

        var currentPageView = this.getCurrentPageView();
        if (currentPageView.onFirstPage()) {
            this.renderPreviousPageView();
        }
        else {
            currentPageView.previousPage();
        }
    },

    // changeMargin()
    // changeFontSize()
    // changeTheme()
    // addSpine() ---- not sure about this. Maybe just do the initialize
    // toggleTOC() <---- I don't think this should actually be part of it

    // ----------------------- Private Helpers -----------------------------------------------------------

    renderNextPageView : function () {

        var nextPageViewIndex;
        if (this.reader.hasNextPageView()) {
            nextPageViewIndex = this.reader.get("currentPagesViewIndex") + 1;
            this.reader.renderPagesView(nextPageViewIndex, false, undefined);
        }
    },

    renderPreviousPageView : function () {

        var previousPageViewIndex;
        if (this.reader.hasPreviousPageView()) {
            previousPageViewIndex = this.reader.get("currentPagesViewIndex") - 1;
            this.reader.renderPagesView(previousPageViewIndex, true, undefined);
        }
    }
});