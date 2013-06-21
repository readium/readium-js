EpubFixed.FixedPageViews = Backbone.Model.extend({

    defaults : function () {

        return {
            "fixedPages" : [],
            "currentPages" : [1],
        }
    },

    // -------------------------------------------- PUBLIC INTERFACE ---------------------------------

    initialize : function (attributes, options) {

        this.fixedPagination = new EpubFixed.PageNumberDisplayLogic({ spineObjects : this.get("spineObjects") });

        // Rationale: Get the page progression direction off the first spine object. This assumes that ppd is the 
        //   same for all FXL spine objects in the epub - which it should be. 
        this.set("pageProgressionDirection", this.get("spineObjects")[0].pageProgressionDirection);
    },

    renderFixedPages : function (bindingElement, viewerSettings, linkClickHandler, handlerContext) {

        // Reset the default for a synthetic layout
        if (viewerSettings.syntheticLayout) {
            this.set("currentPages", [1, 2]);
        }

        this.loadPageViews(viewerSettings);
        this.renderAll(bindingElement, linkClickHandler, handlerContext);
    },

    nextPage : function (twoUp, pageSetEventContext) {

        var newPageNums;
        if (!this.onLastPage()) {

            newPageNums = this.fixedPagination.getNextPageNumbers(this.get("currentPages"), twoUp, this.get("pageProgressionDirection"));
            this.resetCurrentPages(newPageNums);

            // Trigger events
            pageSetEventContext.trigger("atNextPage");
            pageSetEventContext.trigger("displayedContentChanged");
            this.onLastPage() ? pageSetEventContext.trigger("atLastPage") : undefined;
        }
        else {
            pageSetEventContext.trigger("atLastPage");
        }
    },

    previousPage : function (twoUp, pageSetEventContext) {

        var newPageNums;
        if (!this.onFirstPage()) {

            newPageNums = this.fixedPagination.getPreviousPageNumbers(this.get("currentPages"), twoUp, this.get("pageProgressionDirection"));
            this.resetCurrentPages(newPageNums);
            
            // Trigger events
            pageSetEventContext.trigger("atPreviousPage");
            pageSetEventContext.trigger("displayedContentChanged");
            this.onFirstPage() ? pageSetEventContext.trigger("atFirstPage") : undefined;
        }
        else {
            pageSetEventContext.trigger("atFirstPage");
        }
    },

    onFirstPage : function () {

        if (this.get("currentPages")[0] <= 1) {
            return true;
        }

        return false;
    },

    onLastPage : function () {

        if (this.get("currentPages")[0]) {
            if (this.get("currentPages")[0] >= this.numberOfPages()) {
                return true;
            }
        }

        if (this.get("currentPages")[1]) {
            if (this.get("currentPages")[1] >= this.numberOfPages()) {
                return true;
            }
        }

        return false;
    },

    showPageNumber : function (pageNumber, syntheticLayout) {

        var pageIndexToShow;
        var fixedPageView;
        var pageNumsToShow = this.fixedPagination.getPageNumbers(pageNumber, syntheticLayout, this.get("pageProgressionDirection"));
        this.resetCurrentPages(pageNumsToShow);
    },

    setSyntheticLayout : function (isSynthetic) {

        var newPageNumbers;
        if (isSynthetic) {

            _.each(this.get("fixedPages"), function (fixedPageInfo) {
                fixedPageInfo.fixedPageView.setSyntheticPageSpreadStyle();
            });
        }
        else {

            _.each(this.get("fixedPages"), function (fixedPageInfo) {
                fixedPageInfo.fixedPageView.setSinglePageSpreadStyle();
            });
        }

        // Rationale: This method toggles the page numbers
        newPageNumbers = this.fixedPagination.getPageNumbersForTwoUp(this.get("currentPages"), undefined, this.get("pageProgressionDirection"));
        this.resetCurrentPages(newPageNumbers);
    },

    // -------------------------------------------- PRIVATE HELPERS ---------------------------------

    hidePageViews : function () {

        _.each(this.get("fixedPages"), function (fixedPageInfo) {
            fixedPageInfo.fixedPageView.hidePage();
        });      
    },

    numberOfPages : function () {

        return this.get("fixedPages").length;
    },

    loadPageViews : function (viewerSettings) {

        var that = this;
        _.each(this.get("spineObjects"), function (spineObject) {

            var fixedPageView;
            var fixedPageViewInfo;
            if (spineObject.fixedLayoutType === "image") {
                fixedPageView = that.initializeImagePage(spineObject.pageSpread, spineObject.contentDocumentURI, viewerSettings);
            }
            // SVG and all others
            else {
                fixedPageView = that.initializeFixedPage(spineObject.pageSpread, spineObject.contentDocumentURI, viewerSettings);
            }

            // Create info object
            fixedPageViewInfo = {
                fixedPageView : fixedPageView,
                pageType : spineObject.fixedLayoutType,
                isRendered : false,
                spineIndex : spineObject.spineIndex
            };

            that.get("fixedPages").push(fixedPageViewInfo);
        });
    },

    // REFACTORING CANDIDATE: the pageSetEventContext can be used to trigger the epubLoaded event; also, epubLoaded 
    //   should be renamed to something like pageSetLoaded.
    renderAll : function (bindingElement, linkClickHandler, handlerContext) {

        var that = this;
        var numFixedPages = this.get("fixedPages").length;
        
        _.each(this.get("fixedPages"), function (fixedPageViewInfo) {

            fixedPageViewInfo.fixedPageView.on("contentDocumentLoaded", function (viewElement) { 

                fixedPageViewInfo.isRendered = true;
                fixedPageViewInfo.fixedPageView.hidePage();

                numFixedPages = numFixedPages - 1; 
                if (numFixedPages === 0) {
                    that.trigger("epubLoaded");
                }
            });
            
            that.addPageViewToDom(bindingElement, fixedPageViewInfo.fixedPageView.render(false, undefined, linkClickHandler, handlerContext));
        });

        setTimeout(function () { 
            
            if (numFixedPages != 0) {
                // throw an exception
            }

        }, 1000);
    },

    addPageViewToDom : function (bindingElement, pageViewElement) {

        $(bindingElement).append(pageViewElement);
    },

    resetCurrentPages : function (currentPages) {

        this.set("currentPages", currentPages);
        this.hidePageViews();

        if (currentPages[0] !== undefined && currentPages[0] !== null) {
            this.getPageViewInfo(currentPages[0]).fixedPageView.showPage();
        }

        if (currentPages[1] !== undefined && currentPages[1] !== null) {
            this.getPageViewInfo(currentPages[1]).fixedPageView.showPage();
        }
    },

    getPageViewInfo : function (pageNumber) {

        var pageIndex = pageNumber - 1;
        return this.get("fixedPages")[pageIndex];
    },

    initializeImagePage : function (pageSpread, imageSrc, viewerSettings) {

        return new EpubFixed.ImagePageView({
                        pageSpread : pageSpread,
                        imageSrc : imageSrc,
                        viewerSettings : viewerSettings
                    });
    },

    initializeFixedPage : function (pageSpread, iframeSrc, viewerSettings) {

        return new EpubFixed.FixedPageView({
                        pageSpread : pageSpread,
                        iframeSrc : iframeSrc,
                        viewerSettings : viewerSettings
                    });
    },

    resizePageViews : function () {

        _.each(this.get("fixedPages"), function (fixedPageViewInfo) {
            fixedPageViewInfo.fixedPageView.setPageSize();
        });
    }
});