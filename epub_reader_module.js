var EpubReaderModule = function(readerBoundElement, epubSpineInfo, viewerSettings, packageDocumentDOM) {
    
    var EpubReader = {};

    // Rationale: The order of these matters
    EpubReader.EpubReader = Backbone.Model.extend({

    defaults : function () { 
        return {
            "loadedPagesViews" : [],
            "currentPagesViewIndex" : 0
        };
    },

    initialize : function (attributes, options) {

        var spineInfo = this.get("spineInfo");
        this.set("spine", spineInfo.spine);
        this.set("bindings", spineInfo.bindings);
        this.set("annotations", spineInfo.annotations);
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

            this.hideRenderedViews();
            this.set({"currentPagesViewIndex" : pagesViewIndex});
            pagesViewInfo = this.getCurrentPagesViewInfo();

            if (pagesViewInfo.isRendered) {
                pagesViewInfo.pagesView.showPagesView();
                this.applyPreferences(pagesViewInfo.pagesView);
            }
            else {
                
                viewElement = pagesViewInfo.pagesView.render(renderLast, hashFragmentId);
                $(this.get("parentElement")).append(viewElement);
                this.applyPreferences(pagesViewInfo.pagesView);
                pagesViewInfo.isRendered = true;
            }
        }
    },

    renderNextPagesView : function () {

        var nextPagesViewIndex;
        if (this.hasNextPagesView()) {
            nextPagesViewIndex = this.get("currentPagesViewIndex") + 1;
            this.renderPagesView(nextPagesViewIndex, false, undefined);
        }
    },

    renderPreviousPagesView : function () {

        var previousPagesViewIndex;
        if (this.hasPreviousPagesView()) {
            previousPagesViewIndex = this.get("currentPagesViewIndex") - 1;
            this.renderPagesView(previousPagesViewIndex, true, undefined);
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

        // Rendering strategy options could be implemented here
        this.renderAllStrategy();
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
    },

    hideRenderedViews : function () {

        _.each(this.get("loadedPagesViews"), function (pagesViewInfo) {

            if (pagesViewInfo.isRendered) {
                pagesViewInfo.pagesView.hidePagesView();
            }
        });
    },

    renderAllStrategy : function () {

        var that = this;
        var numPagesViewsToLoad = this.get("loadedPagesViews").length;
        
        _.each(this.get("loadedPagesViews"), function (pagesViewInfo) {

            pagesViewInfo.pagesView.on("contentDocumentLoaded", function (viewElement) { 

                pagesViewInfo.isRendered = true;
                pagesViewInfo.pagesView.hidePagesView();

                numPagesViewsToLoad = numPagesViewsToLoad - 1; 
                if (numPagesViewsToLoad === 0) {
                    that.trigger("epubLoaded");
                }
            });

            pagesViewInfo.pagesView.on("internalLinkClicked", function(e){
                that.trigger("internalLinkClicked", e);
            }, this);

            $(that.get("parentElement")).append(pagesViewInfo.pagesView.render(false, undefined));
        });

        setTimeout(function () { 
            
            if (numPagesViewsToLoad != 0) {
                // throw an exception
            }

        }, 1000);
    },


    // REFACTORING CANDIDATE: The each method is causing numPages and currentPage to be hoisted into the global
    //   namespace, I believe. Bad bad. Check this.
    calculatePageNumberInfo : function () {

        var that = this;
        var numPages = 0;
        var currentPage;
        _.each(this.get("loadedPagesViews"), function (pagesViewInfo) {

            // Calculate current page number
            if (that.getCurrentPagesView() === pagesViewInfo.pagesView) {
                currentPage = numPages + pagesViewInfo.pagesView.currentPage()[0];
            }

            // Sum up number of pages
            if (pagesViewInfo.isRendered) {
                numPages += pagesViewInfo.pagesView.numberOfPages();
            }
        });

        return { 
            numPages : numPages,
            currentPage : currentPage
        };
    },

    // REFACTORING CANDIDATE: This method should be replaced when the epub reader api is changed to have an 
    //   instantiated epub module passed to it. 
    findSpineIndex : function (contentDocumentHref) {

        var contentDocHref = contentDocumentHref.split("#", 2)[0];
        var foundSpineItem;

        foundSpineItem = _.find(this.get("spine"), function (spineItem, index) { 

            var uri = new URI(spineItem.contentDocumentURI);
            var filename = uri.filename();
            if (contentDocHref.trim() === filename.trim()) {
                return true;
            }
        });

        return foundSpineItem.spineIndex;
    },

    applyPreferences : function (pagesView) {

        var preferences = this.get("viewerSettings");
        pagesView.setSyntheticLayout(preferences.syntheticLayout);
        pagesView.setMargin(preferences.currentMargin);
        pagesView.setTheme(preferences.currentTheme);
        pagesView.setFontSize(preferences.fontSize);
    }
});

EpubReader.EpubReaderView = Backbone.View.extend({

    initialize : function (options) {

        var that = this;
        this.packageDocumentDOM = options.packageDocumentDOM;
        this.reader = new EpubReader.EpubReader({
            spineInfo : options.spineInfo,
            viewerSettings : options.viewerSettings,
            parentElement : options.readerElement}
        );
        
        // Rationale: Propagate the loaded event after all the content documents are loaded
        this.reader.on("epubLoaded", function () {
            that.trigger("epubLoaded");
        }, this);
        
        this.reader.on("internalLinkClicked", function(e){
            that.trigger("internalLinkClicked", e);
        }, this);

        this.readerBoundElement = options.readerElement;
        this.cfi = new EpubCFIModule();
    },

    render : function () {

        // Set the element that this view will be bound to
        this.reader.loadSpineItems();
        this.setElement(this.readerBoundElement);
        return this.el;
    },

    // ---- Public interface ------------------------------------------------------------------------

    // REFACTORING CANDIDATE: This will only work for reflowable page views; there is currently not a mapping between
    //   spine items and the page views in which they are rendered, for FXL epubs. When support for FXL is included, this 
    //   abstraction will include more.
    showSpineItem : function (spineIndex) {

        this.reader.renderPagesView(spineIndex, false, undefined);
    },

    // Rationale: As with the CFI library API, it is up to calling code to ensure that the content document CFI component is
    //   is a reference into the content document pointed to by the supplied spine index. 
    showPageByCFI : function (CFI) {

        // Dereference CFI, get the content document href
        var contentDocHref;
        var spineIndex;
        try {   
            contentDocHref = this.cfi.getContentDocHref(CFI, this.packageDocumentDOM);
        } 
        catch (error) {
            throw error; 
        }

        // Get the spine index for the content document href
        spineIndex = this.reader.findSpineIndex(contentDocHref);
        
        // render the appropriate pages view
        // show the page, based on the cfi

        this.showSpineItem(spineIndex);

        // Show the element by passing the CFI fragment to the current view
    },

    showPageByElementId : function (spineIndex, elementId) { 

        // Rationale: Try to locate the element before switching to a new page view try/catch
        this.reader.getCurrentPagesView().goToHashFragment(elementId);
        this.showSpineItem(spineIndex);
    },

    nextPage : function () {

        var currentPagesView = this.reader.getCurrentPagesView();
        if (currentPagesView.onLastPage()) {
            this.reader.renderNextPagesView();
        }
        else {
            currentPagesView.nextPage();
        }
    },

    previousPage : function () {

        var currentPagesView = this.reader.getCurrentPagesView();
        if (currentPagesView.onFirstPage()) {
            this.reader.renderPreviousPagesView();
        }
        else {
            currentPagesView.previousPage();
        }
    },

    // REFACTORING CANDIDATE: I don't like that we're maintaining viewer state in the epub object; better that
    //   each time a view was shown, the settings are applied if required

    setFontSize : function (fontSize) {

        var currentView = this.reader.getCurrentPagesView();
        currentView.setFontSize(fontSize);
        this.reader.get("viewerSettings").fontSize = fontSize;
    },

    setMargin : function (margin) {

        var currentView = this.reader.getCurrentPagesView();
        currentView.setMargin(margin);
        this.reader.get("viewerSettings").currentMargin = margin;
    },

    setTheme : function (theme) {

        var currentView = this.reader.getCurrentPagesView();
        currentView.setTheme(theme);
        this.reader.get("viewerSettings").currentTheme = theme
    },

    setSyntheticLayout : function (isSynthetic) {

        var currentView = this.reader.getCurrentPagesView();
        currentView.setSyntheticLayout(isSynthetic);
        this.reader.get("viewerSettings").syntheticLayout = isSynthetic;
    },

    getNumberOfPages : function () {

        return this.reader.calculatePageNumberInfo().numPages;
    },

    getCurrentPage : function () {

        return this.reader.calculatePageNumberInfo().currentPage;
    },

    getCurrentSelectionInfo : function () {

        var currentView = this.reader.getCurrentPagesView();
        annotationInfo = currentView.insertSelectionMarkers();
        return annotationInfo;
    },

    addHighlightMarkersForCFI : function (CFI, id) {

        var annotationInfo;
        var currentView = this.reader.getCurrentPagesView();
        try {
            annotationInfo = currentView.addHighlightMarkersForCFI(CFI, id);
            return annotationInfo;
        }
        catch (error) {
            console.log(error);
        }
    },

    addBookmarkMarkerForCFI : function (CFI, id) {

        var annotationInfo;
        var currentView = this.reader.getCurrentPagesView();
        try {
            annotationInfo = currentView.addBookmarkMarkerForCFI(CFI, id);
            return annotationInfo;
        } 
        catch (error) {
            console.log(error);
        }
    },

    findSpineIndex : function (href) {
        var spineIndex = this.reader.findSpineIndex(href);
        return spineIndex;
    }
    // ----------------------- Private Helpers -----------------------------------------------------------

});

    var epubReaderView = new EpubReader.EpubReaderView({
        readerElement : readerBoundElement,
        spineInfo : epubSpineInfo,
        viewerSettings : viewerSettings,
        packageDocumentDOM : packageDocumentDOM
    });

    // Description: The public interface
    return {

        render : function () { return epubReaderView.render.call(epubReaderView); },
        showSpineItem : function (spineIndex) { return epubReaderView.showSpineItem.call(epubReaderView, spineIndex); },
        showPageByCFI : function (CFI) { return epubReaderView.showPageByCFI.call(epubReaderView, CFI); },
        showPageByElementId : function (spineIndex, hashFragmentId) { return epubReaderView.showPageByElementId.call(epubReaderView, spineIndex, hashFragmentId); },
        nextPage : function () { return epubReaderView.nextPage.call(epubReaderView); },
        previousPage : function () { return epubReaderView.previousPage.call(epubReaderView); },
        setFontSize : function (fontSize) { return epubReaderView.setFontSize.call(epubReaderView, fontSize); },
        setMargin : function (margin) { return epubReaderView.setMargin.call(epubReaderView, margin); },
        setTheme : function (theme) { return epubReaderView.setTheme.call(epubReaderView, theme); },
        setSyntheticLayout : function (isSynthetic) { return epubReaderView.setSyntheticLayout.call(epubReaderView, isSynthetic); },
        getNumberOfPages : function () { return epubReaderView.getNumberOfPages.call(epubReaderView); },
        getCurrentPage : function () { return epubReaderView.getCurrentPage.call(epubReaderView); },
        on : function (eventName, callback, callbackContext) { return epubReaderView.on.call(epubReaderView, eventName, callback, callbackContext); },
        getCurrentSelectionInfo : function () { return epubReaderView.getCurrentSelectionInfo.call(epubReaderView); },
        findSpineIndex : function(href) { return epubReaderView.findSpineIndex.call(epubReaderView, href); },
        addHighlightMarkersForCFI : function (CFI, id) { return epubReaderView.addHighlightMarkersForCFI.call(epubReaderView, CFI, id); },
        addBookmarkMarkerForCFI : function (CFI, id) { return epubReaderView.addBookmarkMarkerForCFI.call(epubReaderView, CFI, id); } 
    };
};
