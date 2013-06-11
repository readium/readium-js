EpubReader.EpubReaderView = Backbone.View.extend({

    initialize : function (options) {

        var that = this;
        this.packageDocumentDOM = options.packageDocumentDOM;
        this.reader = new EpubReader.EpubReader({
            spineInfo : options.spineInfo,
            viewerSettings : options.viewerSettings,
            parentElement : options.readerElement,
            renderStrategy : options.renderStrategy
        });
        // Rationale: Propagate the loaded event after all the content documents are loaded
        this.reader.on("epubLoaded", function () {
            that.trigger("epubLoaded");
            // that.$el.css("opacity", "1");
        }, this);

        this.readerBoundElement = options.readerElement;
        this.cfi = new EpubCFIModule();
    },

    render : function () {

        // Set the element that this view will be bound to
        $(this.readerBoundElement).css("opacity", "0");
        this.setElement(this.readerBoundElement);
        this.reader.loadSpineItems();
        return this.el;
    },

    // ------------------------ Public interface ------------------------------------------------------------------------

    showSpineItem : function (spineIndex, callback, callbackContext) {

        var that = this;
        var pagesViewIndex = this.reader.getPagesViewIndex(spineIndex);
        this.$el.css("opacity", "0");
        this.reader.renderPagesView(pagesViewIndex, false, undefined, function () {

            var pagesViewInfo = this.reader.getCurrentPagesViewInfo();

            // If the pages view is fixed
            if (pagesViewInfo.type === "fixed") {
                pageNumber = that.getPageNumber(pagesViewInfo, spineIndex);
                pagesViewInfo.pagesView.showPageByNumber(pageNumber);
            }
            else {
                pagesViewInfo.pagesView.showPageByNumber(1);    
            }
            
            that.$el.css("opacity", "1");
            callback.call(callbackContext);
        }, this);
    },

    // Rationale: As with the CFI library API, it is up to calling code to ensure that the content document CFI component is
    //   is a reference into the content document pointed to by the supplied spine index. 
    showPageByCFI : function (CFI, callback, callbackContext) {

        // Dereference CFI, get the content document href
        var contentDocHref;
        var spineIndex;
        var pagesView;
        try {
            
            contentDocHref = this.cfi.getContentDocHref(CFI, this.packageDocumentDOM);
            spineIndex = this.reader.findSpineIndex(contentDocHref);
            this.showSpineItem(spineIndex, function () {
                pagesView = this.reader.getCurrentPagesView();
                pagesView.showPageByCFI(CFI);
                callback.call(callbackContext);
            }, this);
        }
        catch (error) {
            throw error; 
        }
    },

    showPageByElementId : function (spineIndex, elementId, callback, callbackContext) { 

        // Rationale: Try to locate the element before switching to a new page view try/catch
        this.showSpineItem(spineIndex, function () {
            this.reader.getCurrentPagesView().showPageByHashFragment(elementId);
            callback.call(callbackContext);
        }, this);
    },

    nextPage : function (callback, callbackContext) {

        var that = this;
        var currentPagesView = this.reader.getCurrentPagesView();

        if (currentPagesView.onLastPage()) {

            this.$el.css("opacity", "0");
            this.reader.renderNextPagesView(function () {
                that.$el.css("opacity", "1");
                callback.call(callbackContext);
            }, this);
        }
        else {
            currentPagesView.nextPage();
        }
    },

    previousPage : function (callback, callbackContext) {

        var that = this;
        var currentPagesView = this.reader.getCurrentPagesView();

        if (currentPagesView.onFirstPage()) {

            this.$el.css("opacity", "0");
            this.reader.renderPreviousPagesView(function () {
                that.$el.css("opacity", "1");
                callback.call(callbackContext);
            }, this);
        }
        else {
            currentPagesView.previousPage();
        }
    },

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
    },

    getPageNumber : function (fixedPagesViewInfo, spineIndex) {

        var spineIndexes = fixedPagesViewInfo.spineIndexes;
        var pageNumber = undefined;

        _.each(spineIndexes, function (currSpineIndex, index) {

            if (currSpineIndex === spineIndex) {
                pageNumber = index + 1;
                return true;
            }
        });

        return pageNumber;
    }
});