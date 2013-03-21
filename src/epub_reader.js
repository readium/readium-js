Readium.Models.EpubReader = Backbone.Model.extend({

    defaults : {
        "renderedPageViews" : {},
        "currentPageView" : 1
    },

    initialize : function (attributes, options) {

        var that = this;
        var currentSpineItem = options.epubController.get("spine_position");
        this.epubSpine = this.get("model");


        // Rendering strategy option
        // 



        this.loadSpineItems(options.epubController, options.viewerSettings);
        this.showSpineItem(currentSpineItem);
    },

    // ---- Public interface ------------------------------------------------------------------------

    // REFACTORING CANDIDATE: This will only work for reflowable page views; there is currently not a mapping between
    //   spine items and the page views in which they are rendered, for FXL epubs. When support for FXL is included, this 
    //   abstraction will include more.
    showSpineItem : function (spineIndex) {

        this.renderPageView(spineIndex, false, undefined);

        // Might want to return the current pageView here
    },

    // Rationale: As with the CFI library API, it is up to calling code to ensure that the content document CFI component is
    //   is a reference into the content document pointed to by the supplied spine index. 
    showCFI : function (spineIndex, contentDocumentCFIComponent) {

        this.showSpineItem(spineIndex);

        // Show the element by passing the CFI fragment to the current view
    },

    showElementId : function (spineIndex, elementId) { 

        // Rationale: Try to locate the element before switching to a new page view try/catch
        this.getCurrentPageView().goToHashFragment(elementId);
        this.showSpineItem(spineIndex)
    },

    nextPage : function () {

        var currentPageView = this.getCurrentPageView();
        if (currentPageView.onLastPage()) {
            this.showNextPageView();
        }
        else {
            currentPageView.pages.goRight();
        }
    },

    previousPage : function () {

        var currentPageView = this.getCurrentPageView();
        if (currentPageView.onFirstPage()) {
            this.showPreviousPageView();
        }
        else {
            currentPageView.pages.goLeft();
        }
    },

    // changeMargin()
    // changeFontSize()
    // changeTheme()
    // addSpine() ---- not sure about this. Maybe just do the initialize
    // toggleTOC() <---- I don't think this should actually be part of it


    // ------------------------------------------------------------------------------------ //  
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //  

    // spinePositionIsRendered()
    // renderSpinePosition()

    // Description: This method chooses the appropriate page view to load for individual 
    //   spine items, and sections of the spine. 
    loadSpineItems : function (epubController, viewerSettings) {

        var spineIndex;
        var currSpineItem; 
        var FXLStartIndex;
        var FXLEndIndex;
        for (spineIndex = 0; spineIndex <= this.epubSpine.length - 1; spineIndex++) {

            currSpineItem = this.epubSpine.at(spineIndex);

            // A fixed layout epub
            if (currSpineItem.isFixedLayout()) {

                FXLStartIndex = spineIndex;

                // Another loop to find the start and end index of the current FXL part of the spine
                spineIndex++;
                for (spineIndex; spineIndex <= this.epubSpine.length - 1; spineIndex++) {

                    currSpineItem = this.epubSpine.at(spineIndex);
                    if (currSpineItem.isFixedLayout()) {
                        FXLEndIndex = spineIndex;
                    }
                    else {
                        break;
                    }
                }

                // This is where the start and end index is passed to the method to load the FXL page view
            }
            // A scrolling epub
            else if (this.shouldScroll(epubController)) {

            }
            // A reflowable epub
            else {
                this.loadReflowableSpineItem(epubController, currSpineItem, viewerSettings);
            }
        }
    },

    showNextPageView : function () {

        var nextPageViewIndex;
        if (this.hasNextPageView()) {
            nextPageViewIndex = this.get("currentPageView") + 1;
            this.renderPageView(nextPageViewIndex, false, undefined);
        }
    },

    showPreviousPageView : function () {

        var previousPageViewIndex;
        if (this.hasPreviousPageView()) {
            previousPageViewIndex = this.get("currentPageView") - 1;
            this.renderPageView(previousPageViewIndex, true, undefined);
        }
    },

    numPageViews : function () {

        return Object.keys(this.get("renderedPageViews")).length;
    },

    hasNextPageView : function () {

        return this.get("currentPageView") < this.numPageViews() ? true : false;
    },

    hasPreviousPageView : function () {

        return this.get("currentPageView") > 0 ? true : false;
    },

    loadReflowableSpineItem : function (epubController, spineItem, viewerSettings) {

        view = new Readium.Views.ReflowablePaginationView({
                model : epubController,
                spineItemModel : spineItem,
                viewerModel : viewerSettings
            });
        this.get("renderedPageViews")[spineItem.get('spine_index')] = view;
    },

    renderPageView : function (pageViewIndex, renderLast, hashFragmentId) {

        this.set("currentPageView", pageViewIndex);
        this.get("renderedPageViews")[pageViewIndex].render(renderLast, hashFragmentId);
    },

    getCurrentPageView : function () {

        return this.get("renderedPageViews")[this.get("currentPageView")];
    },

    shouldScroll : function (epubController) {
        
        return epubController.get("pagination_mode") === "scrolling";
    },




    // initialize: function() {

    //     var self = this;
    //     this.model = this.get("book");
    //     this.zoomer = new Readium.Views.FixedLayoutBookZoomer();
    //     this.model.on("change:pagination_mode", function() { self.renderSpineItems(); });       
    // },

    // updatePaginationSettings: function() {
    //     if (this.get("pagination_mode") == "facing") {
    //         this.set("two_up", true);
    //     } else {
    //         this.set("two_up", false);
    //     }
    // },

    // toggleFullScreen: function() {
    //     var fullScreen = this.get("full_screen");
    //     this.set({full_screen: !fullScreen});
    // },

    // increaseFont: function() {
    //     var size = this.get("font_size");
    //     this.set({font_size: size + 1})
    // },

    // decreaseFont: function() {
    //     var size = this.get("font_size");
    //     this.set({font_size: size - 1})
    // },
});