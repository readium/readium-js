var EpubFixedModule = function (spineObjects, viewerSettingsObject) {
    
    var EpubFixed = {};

    // Rationale: The order of these matters
    // Description: This model is responsible determining page numbers to display for fixed layout EPUBs.
// Rationale: This model exists to abstract and encapsulate the logic for determining which pages numbers should be
//   dispalyed in the viewer. The logic for this is reasonably complex, as there a number of different factors that must be
//   taken into account in various cases. These include: The page progression direction, 
//   the reading order of pages, the number of pages displayed on the screen, and author preferences 
//   for the location of pages (left/right/center). 

EpubFixed.PageNumberDisplayLogic = Backbone.Model.extend({

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize : function () {},

    // Description: This method determines the page numbers to display, given a single page number to "go to"
    // Arguments (
    //   gotoPageNumber (integer): The page number to "go to"
    //   twoUp (boolean): Are two pages currently displayed in the reader?
    //   pageProgressionDirection ("rtl" or "ltr): The page progression direction
    //	)
	getPageNumbers : function (gotoPageNumber, twoUp, pageProgressionDirection) {

		if (twoUp) {
			
			if (pageProgressionDirection === "rtl") {

				if (this.pageIsLeft(gotoPageNumber)) {

					if (this.pageIsRight(gotoPageNumber - 1)) {
						return [gotoPageNumber - 1, gotoPageNumber];
					}
					else {
						return [gotoPageNumber];
					}
				}
				else if (this.pageIsRight(gotoPageNumber)) {

					if (this.pageIsLeft(gotoPageNumber + 1)) {
						return [gotoPageNumber, gotoPageNumber + 1];	
					}
					else {
						return [gotoPageNumber];
					}
				}
				// A center page
				else {
					return [gotoPageNumber];
				}
			}
			// Left-to-right page progression
			else {

				if (this.pageIsLeft(gotoPageNumber)) {

					if (this.pageIsRight(gotoPageNumber + 1)) {
						return [gotoPageNumber, gotoPageNumber + 1];
					}
					else {
						return [gotoPageNumber];
					}
				}
				else if (this.pageIsRight(gotoPageNumber)) {

					if (this.pageIsLeft(gotoPageNumber - 1)) {
						return [gotoPageNumber - 1, gotoPageNumber];
					}
					else {
						return [gotoPageNumber];
					}
				}
				// A center page
				else {
					return [gotoPageNumber];
				}
			}
		}
		else {	
			return [gotoPageNumber];
		}
	},

    // Description: Get the pages numbers to display when moving in reverse reading order
    // Arguments (
	//   currentPages (array of integers): An array of page numbers that are currently displayed	
	//   twoUp (boolean): Are two pages currently displayed in the reader?
	//   pageProgressionDirection ("rtl" or "ltr): The page progression direction
	//	)
	getPreviousPageNumbers : function (currentPages, twoUp, pageProgressionDirection) {

		var curr_pg = currentPages;
		var lastPage = curr_pg[0] - 1;

		// Single page navigation
		if (!twoUp){
			return [lastPage];
		}
		else if (pageProgressionDirection === "rtl") {

			// If the first page is a left page in rtl progression, only one page 
			// can be displayed, even in two-up mode
			if (this.pageIsLeft(lastPage) && 
				this.pageIsRight(lastPage - 1)) {

				return [lastPage - 1, lastPage];
			}
			else {

				return [lastPage];
			}
		}
		// Left-to-right progresion
		else {

			if (this.pageIsRight(lastPage) &&
				this.pageIsLeft(lastPage - 1)) {

				return [lastPage - 1, lastPage];
			}
			else {

				return [lastPage];
			}
		}
	},

	// Description: Get the pages to display when moving in reading order
    // Arguments (
	//   currentPages (array of integers): An array of page numbers that are currently displayed	
	//   twoUp (boolean): Are two pages currently displayed in the reader?
	//   pageProgressionDirection ("rtl" or "ltr): The page progression direction
	//	)
	getNextPageNumbers : function (currentPages, twoUp, pageProgressionDirection) {

		var curr_pg = currentPages;
		var firstPage = curr_pg[curr_pg.length - 1] + 1;

		if (!twoUp) {
			return [firstPage];
		}
		else if (pageProgressionDirection === "rtl") {

			// If the first page is a left page in rtl progression, only one page 
			// can be displayed, even in two-up mode
			if (this.pageIsRight(firstPage) &&
				this.pageIsLeft(firstPage + 1)) {

				return [firstPage, firstPage + 1];
			}
			else {

				return [firstPage];
			}
		}
		else {

			if (this.pageIsLeft(firstPage) && 
				this.pageIsRight(firstPage + 1)) {

				return [firstPage, firstPage + 1];
			}
			else {

				return [firstPage];
			}
		}
	},

	// Description: This method determines which page numbers to display when switching
	//   between a single page and side-by-side page views and vice versa.
	// Arguments (
	//   currentPages (array of integers): An array of page numbers that are currently displayed	
	//   twoUp (boolean): Are two pages currently displayed in the reader?
	//   pageProgressionDirection ("rtl" or "ltr): The page progression direction
	//	)
	// Notes: Authors can specify a fixed layout page as a "center" page, which prevents more than one page
	//   being displayed. This case is not handled yet.
	getPageNumbersForTwoUp : function (currentPages, twoUp, pageProgressionDirection) {

		var displayed = currentPages;
		var twoPagesDisplayed = displayed.length === 2 ? true : false;
		var newPages = [];

		// Two pages are currently displayed; find the single page number to display
		if (twoPagesDisplayed) {

			// Rationale: I think this check is a bit of a hack, for the case in which a set of pages is [0, 1]. Pages are
			//   1-indexed, so the "0" in the 0 index position of the array is not valid.
			if (displayed[0] === 0) {
				
				newPages[0] = 1;
			} 
			else {
				
				newPages[0] = displayed[0];
			}
		}
		// A single fixed layout page is displayed
		else {

			// page progression is right-to-left
			if (pageProgressionDirection === "rtl") {

				// and the previous one is right, then display both, otherwise, just display one
				if (this.pageIsLeft(displayed[0])) {
					
					if (this.pageIsRight(displayed[0] - 1)) {

						newPages[0] = displayed[0] - 1;
						newPages[1] = displayed[0];
					}
					else {

						newPages[0] = displayed[0];
					}
				}
				// if the next page is left, display both, otherwise, just display one
				else if (this.pageIsRight(displayed[0])) {
					
					if (this.pageIsLeft(displayed[0] + 1)) {
						
						newPages[0] = displayed[0];
						newPages[1] = displayed[0] + 1;
					}
					else {

						newPages[0] = displayed[0];
					}
				}
				// It is a center page
				else {

					newPages[0] = displayed[0];
				}
			}
			// page progression is left-to-right
			else {

				// If next page is a right page, display both, otherwise just display this one
				if (this.pageIsLeft(displayed[0])) {
					
					if (this.pageIsRight(displayed[0] + 1)) {
						
						newPages[0] = displayed[0];
						newPages[1] = displayed[0] + 1;
					}
					else {

						newPages[0] = displayed[0];
					}
				}
				else if (this.pageIsRight(displayed[0])) {
					
					if (this.pageIsLeft(displayed[0] - 1)) {
						
						newPages[0] = displayed[0] - 1;
						newPages[1] = displayed[0];
					}
					else {

						newPages[0] = displayed[0];
					}
				}
				// It is a center page
				else {

					newPages[0] = displayed[0];
				}
			}
		}

		return newPages;
	},

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	// Description: The `displayedPageIs...` methods determine if a fixed layout page is right, left or center.
	pageIsRight : function (pageNumber) {

		var pageIndex = pageNumber - 1;
		var spineObject = this.get("spineObjects")[pageIndex];
		if (spineObject.pageSpread === "right") {
			return true;
		}
		else {
			return false;
		}
	},

	pageIsLeft : function (pageNumber) {

		var pageIndex = pageNumber - 1;
		var spineObject = this.get("spineObjects")[pageIndex];
		if (spineObject.pageSpread === "left") {
			return true;
		}
		else {
			return false;
		}
	},

	pageIsCenter : function (pageNumber) {

		var pageIndex = pageNumber - 1;
		var spineObject = this.get("spineObjects")[pageIndex];
		if (spineObject.pageSpread === "center") {
			return true;
		}
		else {
			return false;
		}
	}
});
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
        if (this.onLastPage()) {
            return;
        }

        newPageNums = this.fixedPagination.getNextPageNumbers(this.get("currentPages"), twoUp, this.get("pageProgressionDirection"));
        this.resetCurrentPages(newPageNums);
    },

    previousPage : function (twoUp) {

        var newPageNums;
        if (this.onFirstPage()) {
            return;
        }

        newPageNums = this.fixedPagination.getPreviousPageNumbers(this.get("currentPages"), twoUp, this.get("pageProgressionDirection"));
        this.resetCurrentPages(newPageNums);
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
    EpubFixed.FixedPageView = Backbone.View.extend({

    el : "<div class='fixed-page-wrapper' style='height:100%;'> \
            <iframe scrolling='no' \
                    frameborder='0' \
                    marginwidth='0' \
                    marginheight='0' \
                    style='height:100%;width:100%;' \
                    class='fixed-content'> \
            </iframe> \
          </div>",

    metaSize : {

        height : undefined,
        width : undefined
    },

    initialize : function (options) {

        this.zoomer; // Gotta put a zoomer in here to figure some shit out
        this.pageSpread = options.pageSpread;
        this.iframeSrc = options.iframeSrc;
        this.setSyntheticPageSpreadStyle();
    },

    render : function () {

        var that = this;
        this.get$iframe().attr("src", this.iframeSrc);
        this.get$iframe().on("load", function () {

            // this.injectLinkHandler(e.srcElement);
            // that.applyKeydownHandler($(view.iframe()));
            that.updateMetaSize();
            that.fitToScreen();
            that.trigger("contentDocumentLoaded");
        });
        
        return this.el;
    },

    get$iframe : function () {
        return $("iframe", this.$el);
    },

    hidePage : function () {
        this.$el.hide();
    },

    showPage : function () {
        this.$el.show();
    },

    setSinglePageSpreadStyle : function () {

        this.$el.css({
            "position" : "absolute",
            "overflow" : "hidden",
            "height" : "100%",
            "width" : "50%",
            "left" : "25%"
        });
        this.updateMetaSize();
        this.fitToScreen();
    },

    setSyntheticPageSpreadStyle : function () {

        var pageSpread = this.pageSpread;
        if (pageSpread === "left") {
            this.$el.css({ 
                "position" : "absolute",
                "overflow" : "hidden",
                "height" : "100%",
                "width" : "50%", 
                "left" : "0%",
                "background-color" : "#FFF"
            });
        }
        else if (pageSpread === "right") {
            this.$el.css({ 
                "position" : "absolute",
                "overflow" : "hidden",
                "height" : "100%",
                "width" : "50%", 
                "left" : "50%",
                "background-color" : "#FFF" 
            });
        }
        else if (pageSpread === "center") {
            this.$el.css({
                "position" : "absolute",
                "overflow" : "hidden", 
                "height" : "100%",
                "width" : "100%",
                "left" : "50%",
                "z-index" : "11",
                "background-color" : "#FFF" 
            });
        }

        this.updateMetaSize();
        this.fitToScreen();

    // left: 25%;
    // @include box-shadow(0 0 5px 5px rgba(80,80,80,0.5));
    },

    updateMetaSize : function () {

        var contentDocument = $("iframe", this.el)[0].contentDocument;
        // first try to read viewport size
        var content = $('meta[name=viewport]', contentDocument).attr("content");

        // if not found try viewbox (used for SVG)
        if (!content) {
            content = $('meta[name=viewbox]', contentDocument).attr("content");
        }

        if (content) {
            var size = this.parseSize(content);
            if (size) {
                this.metaSize.width = size.width;
                this.metaSize.height = size.height;
            }
        }
        else { //try to get direct image size

            var $img = $(contentDocument).find('img');
            var width = $img.width();
            var height = $img.height();

            if (width > 0) {
                this.metaSize.width = width;
                this.metaSize.height = height;
            }
        }
    },

    parseSize : function (content) {

        var pairs = content.replace(/\s/g, '').split(",");
        var dict = {};
        var width;
        var height;

        for (var i = 0; i < pairs.length; i++) {

            var nameVal = pairs[i].split("=");
            if (nameVal.length === 2) {
                dict[nameVal[0]] = nameVal[1];
            }
        }

        width = Number.NaN;
        height = Number.NaN;

        if (dict["width"]) {
            width = parseInt(dict["width"]);
        }

        if (dict["height"]) {
            height = parseInt(dict["height"]);
        }

        if (!isNaN(width) && !isNaN(height)) {
            return { 
                width : width, 
                height : height
            };
        }

        return undefined;
    },

    fitToScreen : function () {

        var bookSize = this.metaSize;
        if (bookSize.width == 0) {
            return;
        }

        var containerWidth = this.$el.width();
        var containerHeight = this.$el.height();

        var horScale = containerWidth / bookSize.width;
        var verScale = containerHeight / bookSize.height;

        var scale = Math.min(horScale, verScale);

        var newWidth = bookSize.width * scale;
        var newHeight = bookSize.height * scale;

        var left = Math.floor((containerWidth - newWidth) / 2);
        var top = Math.floor((containerHeight - newHeight) / 2);

        var css = this.generateTransformCSS(left, top, scale);
        css["width"] = bookSize.width;
        css["height"] = bookSize.height;

        this.$el.css(css);
    },

    // Have to modernizer this
    generateTransformCSS : function (left, top, scale) {

        var transformString = "translate(" + left + "px, " + top + "px) scale(" + scale + ")";

        //modernizer library can be used to get browser independent transform attributes names (implemented in readium-web fixed_layout_book_zoomer.js)
        var css = {};
        css["-webkit-transform"] = transformString;
        css["-webkit-transform-origin"] = "0 0";

        return css;
    }


    // setContainerSize : function () {
        
    //     // var meta = this.model.get("meta_size");

    //     // if (meta) {

    //     //     this.$el.width(meta.width * 2);
    //     //     this.$el.height(meta.height);
    //         this.zoomer.fitToBest();

    //         // if (!this.zoomed) {

    //         //     this.zoomed = true;
    //         //     // setTimeout(function() {
    //         //     //  $('#page-wrap').zoomAndScale(); //<= this was a little buggy last I checked but it is a super cool feature
    //         //     // }, 1)    
    //         // }
    //     // }
    // }
});
    EpubFixed.ImagePageView = Backbone.View.extend({

    el : "<div class='fixed-page-wrapper' style='height:100%;'> \
            <img src='#'' alt=''/> \
          </div>",

    initialize : function (options) {

        this.pageSpread = options.pageSpread;
        this.imageSrc = options.imageSrc;
        this.setPageSpreadStyle(this.pageSpread);
    },

    render : function () {

        var that = this;
        $("img", this.$el).attr("src", this.imageSrc);
        this.$("img").on("load", function() { 

            // that.setSize(); 
            // that.injectLinkHandler();
            // that.applyKeydownHandler($(view.iframe()));
            // that.mediaOverlayController.pagesLoaded();
            that.trigger("contentDocumentLoaded");
        });

        return this.el;
    },

    hidePage : function () {
        this.$el.hide();
    },

    showPage : function () {
        this.$el.show();
    },

    setPageSpreadStyle : function (pageSpread) {

        if (pageSpread === "left") {
            this.$el.css({ 
                "position" : "absolute",
                "overflow" : "hidden",
                "width" : "50%",
                "height" : "100%",
                "left" : "0%",
                "background-color" : "#FFF" 
            });
        }
        else if (pageSpread === "right") {
            this.$el.css({ 
                "position" : "absolute",
                "overflow" : "hidden",
                "width" : "50%",
                "height" : "100%", 
                "left" : "50%",
                "background-color" : "#FFF" 
            });
        }
        else if (pageSpread === "center") {
            this.$el.css({
                "position" : "absolute",
                "overflow" : "hidden", 
                "height" : "100%",
                "left" : "25%",
                "z-index" : "11",
                "background-color" : "#FFF" 
            });
        }

    // left: 25%;
    // @include box-shadow(0 0 5px 5px rgba(80,80,80,0.5));
    }
});
    EpubFixed.FixedPaginationView = Backbone.View.extend({

	el : "<div class='fixed-pages-view' style='width:100%; height:100%;'> \
            <div class='fixed-spine-divider'></div> \
          </div>",

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize : function (options) {

		var that = this;
		this.fixedPageViews = new EpubFixed.FixedPageViews({ spineObjects : options.spineObjects });
		this.viewerSettings = options.viewerSettings;

		// Rationale: Propagate the loaded event after all the content documents are loaded
        this.fixedPageViews.on("epubLoaded", function () {
            that.trigger("epubLoaded");
            that.$el.css("opacity", "1");
        }, this);

		// this.zoomer = options.zoomer; // Can probably just instantiate the delegate here
		// this.mediaOverlayController = this.model.get("media_overlay_controller");
        // this.mediaOverlayController.setPages(this.pages);
        // this.mediaOverlayController.setView(this);

        // this.mediaOverlayController.on("change:mo_text_id", this.highlightText, this);
        // this.mediaOverlayController.on("change:active_mo", this.indicateMoIsPlaying, this);

		// this.model.on("change:meta_size", this.setContainerSize, this);
	},

	render : function (goToLastPage, hashFragmentId) {

		var that = this;
		this.fixedPageViews.loadFixedPages(this.$el[0]);

		// Not sure if this does anything
		// $("body").addClass('apple-fixed-layout');

		// Destroy all the current views and their listeners
		
		// Set the container size; the meta property has to be set 
		// this.setContainerSize(); // Hmmmmm...

		return this.el;
	},

    // REFACTORING CANDIDATE: Might want these methos to be the goLeft and goRight methods
	nextPage : function () {

		this.fixedPageViews.nextPage(this.viewerSettings.syntheticLayout);
	},

	previousPage : function () {

		this.fixedPageViews.previousPage(this.viewerSettings.syntheticLayout);
	},

    setSyntheticLayout : function (isSynthetic) {

        if (isSynthetic && this.viewerSettings.syntheticLayout === false) {
            this.viewerSettings.syntheticLayout = true;
            this.fixedPageViews.setSyntheticLayout(true);
        }
        else if (!isSynthetic && this.viewerSettings.syntheticLayout === true) {
            this.viewerSettings.syntheticLayout = false;
            this.fixedPageViews.setSyntheticLayout(false);
        }
    },

    showPageNumber : function (pageNumber) {

        this.fixedPageViews.showPageNumber(pageNumber, this.viewerSettings.syntheticLayout);
    },

	// Hmm, hmm, maybe this method is redundant?? 
    showPagesView : function () {

        // Get the current pages, first page, last page 

        // Show them
    },

    hidePagesView : function () {

    	// Hide all the pages in this view
    },
    
 //    // override
	// indicateMoIsPlaying: function () {
	// 	var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
	// 	moHelper.renderFixedMoPlaying(
	// 		this.pages.get("current_page"),
	// 		this.mediaOverlayController.get("active_mo"),
	// 		this
 //        );
	// },
    
 //    // override
	// highlightText: function () {
	// 	var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
	// 	moHelper.renderFixedLayoutMoFragHighlight(
	// 		this.pages.get("current_page"),
	// 		this.mediaOverlayController.get("mo_text_id"),
	// 		this
 //        );
	// },
    
 //    // override
 //    // Description: return the set of all elements for this spine item that have an @id attribute.
 //    // Used by MO.
 //    getAllPageElementsWithId: function() {
 //        return $('body').find("[id]");
 //    },
    
    
	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	// sometimes these views hang around in memory before
	// the GC's get them. we need to remove all of the handlers
	// that were registered on the model
	destruct : function () {

		// this.model.off("change:font_size", this.setFontSize);
        // this.mediaOverlayController.off("change:mo_text_id", this.highlightText);
        // this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying);
		// this.resetEl();
	},

	// Description: For each fixed-page-wrap(per), if it is one of the current pages, toggle it as visible. If it is not
	//   toggle it as invisible.
	// Note: current_page is an array containing the page numbers (as of 25June2012, a maximum of two pages) of the 
	//   currently visible pages
	showCurrentPages : function () {

		var that = this;
		// var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});

		this.$(".fixed-page-wrap").each(function(index) {
			$(this).toggle(that.pages.isPageVisible(index + 1));
		});

		// remove any artifact of MO highlighting from the current page(s)
        // $.each(this.pages.get("current_page"), function(idx) {
        //     moHelper.removeActiveClass(that.getPageBody(this.toString()));
        // });
	},

	// setFontSize: function() {
	// 	var size = this.model.get("font_size") / 10;
	// 	$('#readium-content-container').css("font-size", size + "em");
	// 	this.showCurrentPages();
	// },

	applyKeydownHandler : function ($pageViewContainer) {

		var that = this;
		$pageViewContainer.contents().keydown(function (e) {

			if (e.which == 39) {
				that.pages.goRight(); // Have to get ppd and two up
			}
							
			if (e.which == 37) {
				that.pages.goLeft(); // Have to get ppd and two up
			}
		});
	},

	injectLinkHandler : function (iframe) {

    	var that = this;
    	$('a', iframe.contentDocument).click(function(e) {
    		that.linkClickHandler(e)
    	});
    }
}); 

    var fixedView = new EpubFixed.FixedPaginationView({  
        spineObjects : spineObjects, 
        viewerSettings : viewerSettingsObject
    });

    // Description: The public interface
    return {

        render : function (goToLastPage, hashFragmentId) { return fixedView.render.call(fixedView, goToLastPage, hashFragmentId); },
        nextPage : function () { return fixedView.nextPage.call(fixedView); },
        previousPage : function () { return fixedView.previousPage.call(fixedView); },
        // showPageByHashFragment : function (hashFragmentId) { return reflowableView.goToHashFragment.call(reflowableView, hashFragmentId); },
        showPageByNumber : function (pageNumber) { return fixedView.showPageNumber.call(fixedView, pageNumber); },
        // showPageByCFI : function (CFI) { reflowableView.showPageByCFI.call(reflowableView, CFI); }, 
        onFirstPage : function () { return fixedView.fixedPageViews.onFirstPage.call(fixedView.fixedPageViews); },
        onLastPage : function () { return fixedView.fixedPageViews.onLastPage.call(fixedView.fixedPageViews); },
        // showPagesView : function () { return reflowableView.showView.call(reflowableView); },
        // hidePagesView : function () { return reflowableView.hideView.call(reflowableView); },
        numberOfPages : function () { return fixedView.fixedPageViews.get("fixedPages").length; },
        currentPage : function () { return fixedView.fixedPageViews.get("currentPages"); },
        // setFontSize : function (fontSize) { return reflowableView.setFontSize.call(reflowableView, fontSize); },
        // setMargin : function (margin) { return reflowableView.setMargin.call(reflowableView, margin); },
        // setTheme : function (theme) { return reflowableView.setTheme.call(reflowableView, theme); },
        setSyntheticLayout : function (isSynthetic) { return fixedView.setSyntheticLayout.call(fixedView, isSynthetic); },
        on : function (eventName, callback, callbackContext) { return fixedView.on.call(fixedView, eventName, callback, callbackContext); },
        off : function (eventName, callback) { return fixedView.off.call(fixedView, eventName, callback); }//,
        // addSelectionHighlight : function (id) { return reflowableView.annotations.addSelectionHighlight.call(reflowableView.annotations, id); },
        // addSelectionBookmark : function (id) { return reflowableView.annotations.addSelectionBookmark.call(reflowableView.annotations, id); },
        // addHighlight : function (CFI, id) { return reflowableView.annotations.addHighlight.call(reflowableView.annotations, CFI, id); },
        // addBookmark : function (CFI, id) { return reflowableView.annotations.addBookmark.call(reflowableView.annotations, CFI, id); }
    };
};
