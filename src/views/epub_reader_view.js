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
            throw error;
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
            throw error;
        }
    } 

    // ----------------------- Private Helpers -----------------------------------------------------------

});