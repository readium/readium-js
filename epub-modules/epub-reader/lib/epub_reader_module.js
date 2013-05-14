var EpubReaderModule = function(readerBoundElement, epubSpineInfo, viewerSettings, packageDocumentDOM) {
    
    var EpubReader = {};

    // Rationale: The order of these matters
    EpubReader.LoadStrategy = Backbone.Model.extend({

    defaults : {
        "numFixedPagesPerView" : 100
    },

    initialize : function (attributes, options) {},

    // Description: This method chooses the appropriate page view to load for individual 
    //   spine items, and sections of the spine. 
    loadSpineItems : function (viewerSettings, annotations, bindings) {

        var spineIndex;
        var currSpineItem;
        var currFixedSpineItems = [];
        var nextSpineItem;
        var pagesViews = [];
        var currPageView;
        var nextSpineItem;
        for (spineIndex = 0; spineIndex <= this.get("spineInfo").length - 1; spineIndex++) {

            currSpineItem = this.get("spineInfo")[spineIndex];

            // A fixed layout spine item
            if (currSpineItem.isFixedLayout) {

                currFixedSpineItems.push(currSpineItem);

                // Check how many fixed pages have been added for the next view
                if (currFixedSpineItems.length === this.get("numFixedPagesPerView")) {

                    currPageView = this.loadFixedPagesView(currFixedSpineItems, viewerSettings);
                    pagesViews.push(currPageView);
                    currFixedSpineItems = [];
                    continue;
                }

                nextSpineItem = this.get("spineInfo")[spineIndex + 1];
                if (nextSpineItem) {

                    if (!nextSpineItem.isFixedLayout) {

                        currPageView = this.loadFixedPagesView(currFixedSpineItems, viewerSettings);
                        pagesViews.push(currPageView);
                        currFixedSpineItems = [];
                    }
                }
                else {
                    currPageView = this.loadFixedPagesView(currFixedSpineItems, viewerSettings);
                    pagesViews.push(currPageView);
                    currFixedSpineItems = [];
                }
            }
            // A scrolling spine item 
            else if (currSpineItem.shouldScroll) {

                // Load the scrolling pages view
            }
            // A reflowable spine item
            else {
                currPageView = this.loadReflowablePagesView(currSpineItem, viewerSettings, annotations, bindings);
                pagesViews.push(currPageView);
            }
        }

        return pagesViews;
    },

    loadReflowablePagesView : function (spineItem, viewerSettings, annotations, bindings) {

        var view = new EpubReflowableModule(
            spineItem,
            viewerSettings, 
            annotations, 
            bindings
            );

        var pagesViewInfo = {
            pagesView : view, 
            spineIndexes : [spineItem.spineIndex],
            isRendered : false,
            type : "reflowable"
        };

        return pagesViewInfo;
    },

    loadFixedPagesView : function (spineItemList, viewerSettings) {

        var view = new EpubFixedModule(
            spineItemList,
            viewerSettings
        );

        var spineIndexes = [];
        _.each(spineItemList, function (spineItem) {
            spineIndexes.push(spineItem.spineIndex)
        });

        var pagesViewInfo = {
            pagesView : view, 
            spineIndexes : spineIndexes,
            isRendered : false,
            type : "fixed"
        };

        return pagesViewInfo;
    }
});
    EpubReader.EpubReader = Backbone.Model.extend({

    defaults : function () { 
        return {
            "loadedPagesViews" : [],
            "currentPagesViewIndex" : 0,
            "pagesViewEventList" : []
        };
    },

    initialize : function (attributes, options) {

        var spineInfo = this.get("spineInfo");
        this.set("spine", spineInfo.spine);
        this.set("bindings", spineInfo.bindings);
        this.set("annotations", spineInfo.annotations);

        this.loadStrategy = new EpubReader.LoadStrategy({ spineInfo : this.get("spine")});
        this.cfi = new EpubCFIModule();
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

    // This is an asychronous method
    getRenderedPagesView : function (spineIndex, callback, callbackContext) {

        // Get pages view info
        var that = this;
        var viewElement;
        var pagesViewInfo = this.getPagesViewInfo(spineIndex);

        // Check if it is rendered
        if (!pagesViewInfo.isRendered) {

            // invoke callback when the content document loads
            pagesViewInfo.pagesView.on("contentDocumentLoaded", function (pagesView) {
                callback.call(callbackContext, pagesViewInfo.pagesView);
            });

            // This logic is duplicated and should be abstracted
            viewElement = pagesViewInfo.pagesView.render(false, undefined);
            $(this.get("parentElement")).append(viewElement);
            this.applyPreferences(pagesViewInfo.pagesView);
            pagesViewInfo.isRendered = true;
        }
        else {
            callback.call(callbackContext, pagesViewInfo.pagesView);
        }
    },

    attachEventHandler : function (eventName, callback, callbackContext) {

        // Rationale: Maintain a list of the callbacks, which need to be attached when pages views are loaded
        this.get("pagesViewEventList").push({
            eventName : eventName,
            callback : callback,
            callbackContext : callbackContext
        });

        // Attach the event handler to each current pages view
        _.each(this.get("loadedPagesViews"), function (pagesViewInfo) {
            pagesViewInfo.pagesView.on(eventName, callback, callbackContext);
        }, this);
    },

    removeEventHandler : function (eventName) {

        var that = this;
        // Find index of events
        var indexOfEventsToRemove = [];
        _.each(this.get("pagesViewEventList"), function (pagesViewEvent, index) {

            if (pagesViewEvent.eventName === eventName) {
                indexOfEventsToRemove.push(index);
            }
        });

        // Remove them in reverse order, so each index is still valid
        indexOfEventsToRemove.reverse();
        _.each(indexOfEventsToRemove, function (indexToRemove) {
            that.get("pagesViewEventList").splice(indexToRemove, 1);
        });

        // Remove event handlers on views
        _.each(this.get("loadedPagesViews"), function (pagesViewInfo) {
            pagesViewInfo.pagesView.off(eventName);
        }, this);
    },

    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //

    eagerRenderStrategy : function () {

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
            
            // This will cause the pages view to try to retrieve its resources
            $(that.get("parentElement")).append(pagesViewInfo.pagesView.render(false, undefined));
        });

        setTimeout(function () { 
            
            if (numPagesViewsToLoad != 0) {
                // throw an exception
            }

        }, 1000);
    },

    // Description: This method chooses the appropriate page view to load for individual 
    //   spine items, and sections of the spine. 
    loadSpineItems : function () {

        var pagesViews = this.loadStrategy.loadSpineItems(this.get("viewerSettings"), this.get("annotations"), this.get("bindings"));
        this.set("loadedPagesViews", pagesViews);
        // Attach list of event handlers
        // _.each(this.get("pagesViewEventList"), function (eventInfo) {
        //     view.on(eventInfo.eventName, eventInfo.callback, eventInfo.callbackContext);
        // });
        this.eagerRenderStrategy();
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

        var contentDocHref = contentDocumentHref;
        var foundSpineItem;

        foundSpineItem = _.find(this.get("spine"), function (spineItem, index) { 

            var uri = new URI(spineItem.contentDocumentURI);
            var filename = uri.filename();
            if (contentDocumentHref.trim() === filename.trim()) {
                return true;
            }
        });

        return foundSpineItem.spineIndex;
    },

    getPagesViewInfo : function (spineIndex) {

        var foundPagesViewInfo = _.find(this.get("loadedPagesViews"), function (currPagesViewInfo, index) {

            var foundSpineIndex = _.find(currPagesViewInfo.spineIndexes, function (currSpineIndex) {
                if (currSpineIndex === spineIndex) {
                    return true;
                }
            });

            // Only checking for null and undefined, as "foundSpineIndex" can be 0, which evaluates as falsy
            if (foundSpineIndex !== undefined && foundSpineIndex !== null) {
                return true;
            }
        });

        return foundPagesViewInfo;
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
            parentElement : options.readerElement
        });
        // Rationale: Propagate the loaded event after all the content documents are loaded
        this.reader.on("epubLoaded", function () {
            that.trigger("epubLoaded");
            that.$el.css("opacity", "1");
        }, this);

        this.readerBoundElement = options.readerElement;
        this.cfi = new EpubCFIModule();
    },

    render : function () {

        // Set the element that this view will be bound to
        $(this.readerBoundElement).css("opacity", "0");
        this.reader.loadSpineItems();
        this.setElement(this.readerBoundElement);
        return this.el;
    },

    // ------------------------ Public interface ------------------------------------------------------------------------

    // REFACTORING CANDIDATE: This will only work for reflowable page views; there is currently not a mapping between
    //   spine items and the page views in which they are rendered, for FXL epubs. When support for FXL is included, this 
    //   abstraction will include more.
    showSpineItem : function (spineIndex) {

        this.reader.renderPagesView(spineIndex, false, undefined);
        this.reader.getCurrentPagesView().showPageByNumber(spineIndex + 1);
    },

    // Rationale: As with the CFI library API, it is up to calling code to ensure that the content document CFI component is
    //   is a reference into the content document pointed to by the supplied spine index. 
    showPageByCFI : function (CFI) {

        // Dereference CFI, get the content document href
        var contentDocHref;
        var spineIndex;
        var pagesView;
        try {
            
            contentDocHref = this.cfi.getContentDocHref(CFI, this.packageDocumentDOM);
            spineIndex = this.reader.findSpineIndex(contentDocHref);
            this.showSpineItem(spineIndex);
            pagesView = this.reader.getCurrentPagesView();
            pagesView.showPageByCFI(CFI);
        }
        catch (error) {
            throw error; 
        }
    },

    showPageByElementId : function (spineIndex, elementId) { 

        // Rationale: Try to locate the element before switching to a new page view try/catch
        this.showSpineItem(spineIndex);
        this.reader.getCurrentPagesView().showPageByHashFragment(elementId);
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
        this.reader.get("viewerSettings").currentTheme = theme;
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

    addSelectionHighlight : function (id) {

        var contentDocCFIComponent;
        var packageDocCFIComponent;
        var completeCFI;
        var spineIndex;
        var currentViewInfo = this.reader.getCurrentPagesViewInfo();
        spineIndex = currentViewInfo.spineIndexes[0]; // Assumes reflowable
        annotationInfo = currentViewInfo.pagesView.addSelectionHighlight(id);

        // Generate a package document cfi component and construct the whole cfi, append
        contentDocCFIComponent = annotationInfo.CFI;
        packageDocCFIComponent = this.cfi.generatePackageDocumentCFIComponentWithSpineIndex(spineIndex, this.packageDocumentDOM);
        completeCFI = this.cfi.generateCompleteCFI(packageDocCFIComponent, contentDocCFIComponent);
        annotationInfo.CFI = completeCFI;

        return annotationInfo;
    },

    addSelectionBookmark : function (id) {

        var contentDocCFIComponent;
        var packageDocCFIComponent;
        var completeCFI;
        var spineIndex;
        var currentViewInfo = this.reader.getCurrentPagesViewInfo();
        spineIndex = currentViewInfo.spineIndexes[0]; // Assumes reflowable
        annotationInfo = currentViewInfo.pagesView.addSelectionBookmark(id);

        // Generate a package document cfi component and construct the whole cfi, append
        contentDocCFIComponent = annotationInfo.CFI;
        packageDocCFIComponent = this.cfi.generatePackageDocumentCFIComponentWithSpineIndex(spineIndex, this.packageDocumentDOM);
        completeCFI = this.cfi.generateCompleteCFI(packageDocCFIComponent, contentDocCFIComponent);
        annotationInfo.CFI = completeCFI;

        return annotationInfo;
    },

    addHighlight : function (CFI, id, callback, callbackContext) {

        var annotationInfo;
        var contentDocSpineIndex = this.getSpineIndexFromCFI(CFI);
        this.reader.getRenderedPagesView(contentDocSpineIndex, function (pagesView) {

            try {
                annotationInfo = pagesView.addHighlight(CFI, id);
                callback.call(callbackContext, undefined, contentDocSpineIndex, CFI, annotationInfo);
            }
            catch (error) {
                callback.call(callbackContext, error, undefined, undefined);
            }
        });
    },

    addBookmark : function (CFI, id, callback, callbackContext) {

        var annotationInfo;
        var contentDocSpineIndex = this.getSpineIndexFromCFI(CFI);
        this.reader.getRenderedPagesView(contentDocSpineIndex, function (pagesView) {

            try {
                annotationInfo = pagesView.addBookmark(CFI, id);
                callback.call(callbackContext, undefined, contentDocSpineIndex, CFI, annotationInfo);
            }
            catch (error) {
                callback.call(callbackContext, error, undefined, undefined);
            }
        });
    },

    getViewerSettings : function () {

        return this.reader.get("viewerSettings");
    },

    assignEventHandler : function (eventName, callback, callbackContext) {

        if (eventName === "keydown-left") {
            this.reader.attachEventHandler(eventName, callback, callbackContext);
        }
        else if (eventName === "keydown-right") {
            this.reader.attachEventHandler(eventName, callback, callbackContext);
        } 
        else {
            this.on(eventName, callback, callbackContext);
        }
    },

    removeEventHandler : function (eventName) {

        if (eventName === "keydown-left") {
            this.reader.removeEventHandler(eventName);
        }
        else if (eventName === "keydown-right") {
            this.reader.removeEventHandler(eventName);
        } 
        else {
            this.off(eventName);
        }
    },

    // ----------------------- Private Helpers -----------------------------------------------------------

    getSpineIndexFromCFI : function (CFI) {

        try {
            var contentDocumentHref = this.cfi.getContentDocHref(CFI, this.packageDocumentDOM);
            var spineIndex = this.reader.findSpineIndex(contentDocumentHref);
            return spineIndex;
        }
        catch (error) {
            throw error;
        }
    }
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
        on : function (eventName, callback, callbackContext) { return epubReaderView.assignEventHandler.call(epubReaderView, eventName, callback, callbackContext); },
        off : function (eventName) { return epubReaderView.removeEventHandler.call(epubReaderView, eventName); }, 
        addSelectionHighlight : function (id) { return epubReaderView.addSelectionHighlight.call(epubReaderView, id); },
        addSelectionBookmark : function (id) { return epubReaderView.addSelectionBookmark.call(epubReaderView, id); },
        addHighlight : function (CFI, id, callback, callbackContext) { return epubReaderView.addHighlight.call(epubReaderView, CFI, id, callback, callbackContext); },
        addBookmark : function (CFI, id, callback, callbackContext) { return epubReaderView.addBookmark.call(epubReaderView, CFI, id, callback, callbackContext); },
        getViewerSettings : function () { return epubReaderView.getViewerSettings.call(epubReaderView); }
    };
};
