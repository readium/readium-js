EpubFixed.FixedPageViews = Backbone.Model.extend({

    defaults : function () {

        return {
            "fixedPages" : [],
            "currentPages" : [],
        }
    },

    // -------------------------------------------- PUBLIC INTERFACE ---------------------------------

    initialize : function (attributes, options) {

        this.fixedPagination = new EpubFixed.PageNumberDisplayLogic({ spineObjects : this.get("spineObjects") });

        // Rationale: Get the page progression direction off the first spine object. This assumes that ppd is the 
        //   same for all FXL spine objects in the epub - which it should be. 
        this.set("pageProgressionDirection", this.get("spineObjects")[0].pageProgressionDirection);
    },

    loadFixedPages : function (bindingElement) {

        this.loadPageViews();
        this.renderAll(bindingElement);
    },

    nextPage : function (twoUp) {

        var newPageNums;

        // Validation
        if (this.onLastPage()) {
            return;
        }

        newPageNums = this.fixedPagination.getNextPageNumbers(this.get("currentPages"), twoUp, this.get("pageProgressionDirection"));
        this.set("currentPages", newPageNums);
        this.showPageNumbers(newPageNums);
    },

    previousPage : function (twoUp) {

        var newPageNums;

        // Validation
        if (this.onFirstPage()) {
            return;
        }

        newPageNums = this.fixedPagination.getPreviousPageNumbers(this.get("currentPages"), twoUp, this.get("pageProgressionDirection"));
        this.set("currentPages", newPageNums);
        this.showPageNumbers(newPageNums);
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

    showPageNumbers : function (pageNumbers) {

        var pageIndexToShow;
        var fixedPageView;

        // Show the first page
        if (pageNumbers[0]) {
            pageIndexToShow = pageNumbers[0] - 1;
            fixedPageView = this.get("fixedPages")[pageIndexToShow].fixedPageView;
            this.hidePageViews();
            this.set("currentPages", pageNumbers); // At least one of the page numbers is valid
            fixedPageView.showPage();
        }

        // Show the second page, if it is set 
        if (pageNumbers[1]) {
            pageIndexToShow = pageNumbers[1] - 1;
            fixedPageView = this.get("fixedPages")[pageIndexToShow].fixedPageView; 
            fixedPageView.showPage();
        }
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

    loadPageViews : function (spineObjects) {

        var that = this;
        _.each(this.get("spineObjects"), function (spineObject) {

            var fixedPageView;
            var fixedPageViewInfo;
            if (spineObject.fixedLayoutType === "image") {
                fixedPageView = that.initializeImagePage(spineObject.pageSpread, spineObject.contentDocumentURI);
            }
            // SVG and all others
            else {
                fixedPageView = that.initializeFixedPage(spineObject.pageSpread, spineObject.contentDocumentURI);
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

    renderAll : function (bindingElement) {

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
            
            that.addPageViewToDom(bindingElement, fixedPageViewInfo.fixedPageView.render(false, undefined));
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

    initializeImagePage : function (pageSpread, imageSrc) {

        return new EpubFixed.ImagePageView({
                        pageSpread : pageSpread,
                        imageSrc : imageSrc
                    });
    },

    initializeFixedPage : function (pageSpread, iframeSrc) {

        return new EpubFixed.FixedPageView({
                        pageSpread : pageSpread,
                        iframeSrc : iframeSrc
                    });
    }
});