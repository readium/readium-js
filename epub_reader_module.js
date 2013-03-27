var EpubReaderModule = function(readerBoundElement, epubSpineInfo, viewerSettings) {
    
    var EpubReader = {};

    // Rationale: The order of these matters
    EpubReader.EpubReader = Backbone.Model.extend({

    // Rationale: 
    defaults : function () { 
        return {
            "loadedPagesViews" : [],
            "numRenderedPagesViews" : 0,
            "currentPagesViewIndex" : 0
        };
    },

    initialize : function (attributes, options) {

        var spineInfo = this.get("spineInfo");
        // Attributes: 
        //   current spine position
        //   spine
        this.set("spine", spineInfo.spine);
        this.set("bindings", spineInfo.bindings);
        this.set("annotations", spineInfo.annotations);
        //   viewer settings
        //   bindings

        // Rendering strategy options could be implemented here

        // A mechanism to determine whether a reflowable content document should scroll needs to be determined
        this.loadSpineItems();
    },

    // ------------------------------------------------------------------------------------ //  
    //  "PUBLIC" INTERFACE                                                                  //
    // ------------------------------------------------------------------------------------ //  

    numberOfLoadedPagesViews : function () {

        return this.get("loadedPagesViews").length;
    },

    hasNextPagesView : function () {

        return this.get("currentPagesViewIndex") < this.numberOfLoadedPagesViews() - 1 ? true : false;
    },

    hasPreviousPagesView : function () {

        return this.get("currentPagesViewIndex") > 0 ? true : false;
    },

    getCurrentPagesView : function () {

        return this.get("loadedPagesViews")[this.get("currentPagesViewIndex")].pagesView;
    },

    renderPagesView : function (pagesViewIndex, renderLast, hashFragmentId) {

        var pagesView;
        if (pagesViewIndex >= 0 && pagesViewIndex < this.numberOfLoadedPagesViews()) {

            this.set({"currentPagesViewIndex" : pagesViewIndex});
            pagesViewInfo = this.getCurrentPagesViewInfo();
            pagesViewInfo.isRendered = true;
            viewElement = pagesViewInfo.pagesView.render(renderLast, hashFragmentId);
            return viewElement;
        }
        else {
            return undefined;
        }
    },

    // ------------------------------------------------------------------------------------ //  
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //  

    // spinePositionIsRendered()
    // renderSpinePosition()

    // Description: This method chooses the appropriate page view to load for individual 
    //   spine items, and sections of the spine. 
    loadSpineItems : function () {

        var spineIndex;
        var currSpineItem; 
        var FXLStartIndex;
        var FXLEndIndex;
        for (spineIndex = 0; spineIndex <= this.get("spine").length - 1; spineIndex++) {

            currSpineItem = this.get("spine")[spineIndex];

            // A fixed layout epub
            if (currSpineItem.isFixedLayout) {

                FXLStartIndex = spineIndex;

                // Another loop to find the start and end index of the current FXL part of the spine
                spineIndex++;
                for (spineIndex; spineIndex <= this.get("spine").length - 1; spineIndex++) {

                    currSpineItem = this.get("spine")[spineIndex];
                    if (currSpineItem.isFixedLayout) {
                        FXLEndIndex = spineIndex;
                    }
                    else {
                        break;
                    }
                }
            }
            // A scrolling epub
            else if (currSpineItem.shouldScroll) {

                // Load the scrolling pages view
            }
            // A reflowable epub
            else {
                this.loadReflowableSpineItem(currSpineItem, this.get("viewerSettings"), undefined, this.get("bindings"));
            }
        }
    },

    loadReflowableSpineItem : function (spineItem) {

        var view = new EpubReflowableModule(
            spineItem, 
            this.get("viewerSettings"), 
            this.get("annotations"), 
            this.get("bindings")
            );
        var pagesViewInfo = {
            pagesView : view, 
            spineIndexes : [spineItem.spineIndex],
            isRendered : false
        };

        // Add the pages view to the end of the array
        this.get("loadedPagesViews").push(pagesViewInfo);
    },

    getCurrentPagesViewInfo : function () {

        return this.get("loadedPagesViews")[this.get("currentPagesViewIndex")];
    }


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

    var epubReaderView = new EpubReader.EpubReaderView({
        readerElement : readerBoundElement,
        spineInfo : epubSpineInfo,
        viewerSettings : viewerSettings
    });

    // Description: The public interface
    return {

        render : function () { return epubReaderView.render.call(epubReaderView); },
        showSpineItem : function (spineIndex) { return epubReaderView.showSpineItem.call(epubReaderView, spineIndex); },
        showPageByCFI : function (CFI) { return epubReaderView.showPageByCFI.call(epubReaderView, CFI); },
        showPageByElementId : function (spineIndex, hashFragmentId) { return epubReaderView.showPageByElementId.call(epubReaderView, spineIndex, hashFragmentId); },
        nextPage : function () { return epubReaderView.nextPage.call(epubReaderView); },
        previousPage : function () { return epubReaderView.previousPage.call(epubReaderView); }
    };
};
