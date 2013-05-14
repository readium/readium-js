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

        var pagesViewIndex = this.reader.getPagesViewIndex(spineIndex);
        this.reader.renderPagesView(pagesViewIndex, false, undefined);
        this.reader.getCurrentPagesView().showPageByNumber(1);
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