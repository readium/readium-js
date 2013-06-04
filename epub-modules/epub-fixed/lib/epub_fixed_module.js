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
		if (spineObject !== undefined && spineObject.pageSpread === "right") {
			return true;
		}
		else {
			return false;
		}
	},

	pageIsLeft : function (pageNumber) {

		var pageIndex = pageNumber - 1;
		var spineObject = this.get("spineObjects")[pageIndex];
		if (spineObject !== undefined && spineObject.pageSpread === "left") {
			return true;
		}
		else {
			return false;
		}
	},

	pageIsCenter : function (pageNumber) {

		var pageIndex = pageNumber - 1;
		var spineObject = this.get("spineObjects")[pageIndex];
		if (spineObject !== undefined && spineObject.pageSpread === "center") {
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

    loadFixedPages : function (bindingElement, viewerSettings) {

        // Reset the default for a synthetic layout
        if (viewerSettings.syntheticLayout) {
            this.set("currentPages", [1, 2]);
        }

        this.loadPageViews(viewerSettings);
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
    }
});
    EpubFixed.FixedSizing = Backbone.Model.extend({

    metaSize : {
        width : undefined,
        height : undefined
    },

    initialize : function (attributes) {},

    // ------------------ PUBLIC INTERFACE ---------------------------------

    updateMetaSize : function () {

        var $img;
        var contentDocument = this.get("contentDocument");

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

            if ($(contentDocument).is("IMG")) {
                $img = $(contentDocument);
            }
            else {
                $img = $(contentDocument).find('img');
            }
            var width = $img.width();
            var height = $img.height();

            if (width > 0) {
                this.metaSize.width = width;
                this.metaSize.height = height;
            }
        }
    },

    fitToScreen : function (containerWidth, containerHeight) {

        var bookSize = this.metaSize;
        if (bookSize.width == 0) {
            return;
        }

        var horScale = containerWidth / bookSize.width;
        var verScale = containerHeight / bookSize.height;

        var scale = Math.min(horScale, verScale);

        var css = this.generateTransformCSS(scale);
        css["width"] = bookSize.width;
        css["height"] = bookSize.height;

        return css;
    },

    // --------------------------- PRIVATE HELPERS -------------------------------------

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

    // Have to modernizer this
    generateTransformCSS : function (scale) {

        var transformString = "scale(" + scale + ")";

        //modernizer library can be used to get browser independent transform attributes names (implemented in readium-web fixed_layout_book_zoomer.js)
        var css = {};
        css[this.modernizrCssPrefix("transform")] = transformString;
        return css;
    },

    modernizrCssPrefix : function (attr) {
        var str = Modernizr.prefixed(attr);
        return str.replace(/([A-Z])/g, function(str, m1){ 
            return '-' + m1.toLowerCase(); 
        }).replace(/^ms-/,'-ms-');
    },
});
    EpubFixed.FixedLayoutStyle = Backbone.Model.extend({

    initialize : function () {},

    getSinglePageSpreadCSS : function () {

        // @include box-shadow(0 0 5px 5px rgba(80,80,80,0.5));
        return {
            "position" : "absolute",
            "overflow" : "hidden",
            "height" : "100%",
            "width" : "50%",
            "-webkit-transform-origin" : "top left",
            "-moz-transform-origin" : "top left",
            "-o-transform-origin" : "top left",
            "-ms-transform-origin" : "top left",
            "left" : "25%"
        };
    },

    getPageSpreadLeftCSS : function () {

        return { 
            "position" : "absolute",
            "overflow" : "hidden",
            "height" : "100%",
            "width" : "50%", 
            "right" : "50%",
            "left" : "", // Have to clear the left if it was set for this page on a single page spread
            "-webkit-transform-origin" : "top right",
            "-moz-transform-origin" : "top right",
            "-o-transform-origin" : "top right",
            "-ms-transform-origin" : "top right",
            "background-color" : "#FFF"
        };
    },

    getPageSpreadRightCSS : function () {

        return { 
            "position" : "absolute",
            "overflow" : "hidden",
            "height" : "100%",
            "width" : "50%", 
            "left" : "50%",
            "-webkit-transform-origin" : "top left",
            "-moz-transform-origin" : "top left",
            "-o-transform-origin" : "top left",
            "-ms-transform-origin" : "top left",
            "background-color" : "#FFF" 
        };
    },

    getPageSpreadCenterCSS : function () {

        return {
            "position" : "absolute",
            "overflow" : "hidden", 
            "height" : "100%",
            "width" : "100%",
            "left" : "50%",
            "z-index" : "11",
            "background-color" : "#FFF" 
        };
    }
});
    EpubFixed.FixedPageView = Backbone.View.extend({

    el : "<div class='fixed-page-wrapper'> \
            <iframe scrolling='no' \
                    frameborder='0' \
                    marginwidth='0' \
                    marginheight='0' \
                    style='height:100%;width:100%;' \
                    class='fixed-content'> \
            </iframe> \
          </div>",

    initialize : function (options) {

        this.sizing;
        this.styles = new EpubFixed.FixedLayoutStyle();
        this.pageSpread = options.pageSpread;
        this.iframeSrc = options.iframeSrc;
        if (options.viewerSettings.syntheticLayout) {
            this.setSyntheticPageSpreadStyle();       
        }
        else {
            this.setSinglePageSpreadStyle();
        }
    },

    render : function () {

        var that = this;
        this.get$iframe().attr("src", this.iframeSrc);
        this.get$iframe().on("load", function () {

            // "Forward" the epubReadingSystem object to the iframe's own window context.
            // Note: the epubReadingSystem object may not be ready when directly using the
            // window.onload callback function (from within an (X)HTML5 EPUB3 content document's Javascript code)
            // To address this issue, the recommended code is:
            // -----
            // function doSomething() { console.log(navigator.epubReadingSystem); };
            // 
            // // With jQuery:
            // $(document).ready(function () { setTimeout(doSomething, 200); });
            // 
            // // With the window "load" event:
            // window.addEventListener("load", function () { setTimeout(doSomething, 200); }, false);
            // 
            // // With the modern document "DOMContentLoaded" event:
            // document.addEventListener("DOMContentLoaded", function(e) { setTimeout(doSomething, 200); }, false);
            // -----
            if (typeof navigator.epubReadingSystem != 'undefined')
            {
               var iFrame = that.get$iframe()[0];
               var iFrameWindow = iFrame.contentWindow || iFrame.contentDocument.parentWindow;
               var ers = navigator.epubReadingSystem; //iFrameWindow.parent.navigator.epubReadingSystem
               iFrameWindow.navigator.epubReadingSystem = ers;
            }

            that.sizing = new EpubFixed.FixedSizing({ contentDocument : that.get$iframe()[0].contentDocument });
            // this.injectLinkHandler(e.srcElement);
            // that.applyKeydownHandler($(view.iframe()));
            that.setPageSize();
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

        var transformCss;
        this.$el.css(this.styles.getSinglePageSpreadCSS());
        this.setPageSize();
    },

    setSyntheticPageSpreadStyle : function () {

        var pageSpread = this.pageSpread;
        var transformCss;
        if (pageSpread === "left") {
            this.$el.css(this.styles.getPageSpreadLeftCSS());
        }
        else if (pageSpread === "right") {
            this.$el.css(this.styles.getPageSpreadRightCSS());
        }
        else if (pageSpread === "center") {
            this.$el.css(this.styles.getPageSpreadCenterCSS());
        }
        this.setPageSize();
    },

    setPageSize : function () {

        var $readerElement = this.$el.parent().parent();
        if (this.sizing !== undefined) {

            var transformCss;
            this.sizing.updateMetaSize();
            transformCss = this.sizing.fitToScreen($readerElement.width(), $readerElement.height());
            this.$el.css(transformCss);
        }
    }
});
    EpubFixed.ImagePageView = Backbone.View.extend({

    el : "<div class='fixed-page-wrapper' style='height:100%;'> \
            <img src='#'' alt=''/> \
          </div>",

    initialize : function (options) {

        this.sizing;
        this.styles = new EpubFixed.FixedLayoutStyle();
        this.pageSpread = options.pageSpread;
        this.imageSrc = options.imageSrc;
        if (options.viewerSettings.syntheticLayout) {
            this.setSyntheticPageSpreadStyle();       
        }
        else {
            this.setSinglePageSpreadStyle();
        }
    },

    render : function () {

        var that = this;
        $("img", this.$el).attr("src", this.imageSrc);
        this.$("img").on("load", function() { 

            that.sizing = new EpubFixed.FixedSizing({ contentDocument : $("img", this.el)[0] });
            // that.injectLinkHandler();
            // that.applyKeydownHandler($(view.iframe()));
            // that.mediaOverlayController.pagesLoaded();
            that.setPageSize();
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

    setSinglePageSpreadStyle : function () {

        var transformCss;
        this.$el.css(this.styles.getSinglePageSpreadCSS());
        this.setPageSize();
    },

    setSyntheticPageSpreadStyle : function () {

        var pageSpread = this.pageSpread;
        var transformCss;
        if (pageSpread === "left") {
            this.$el.css(this.styles.getPageSpreadLeftCSS());
        }
        else if (pageSpread === "right") {
            this.$el.css(this.styles.getPageSpreadRightCSS());
        }
        else if (pageSpread === "center") {
            this.$el.css(this.styles.getPageSpreadCenterCSS());
        }
        this.setPageSize();
    },

    setPageSize : function () {

        var $readerElement = this.$el.parent().parent();
        if (this.sizing !== undefined) {

            var transformCss;
            this.sizing.updateMetaSize();
            transformCss = this.sizing.fitToScreen($readerElement.width(), $readerElement.height());
            this.$el.css(transformCss);
        }
    }
});
    EpubFixed.FixedPaginationView = Backbone.View.extend({

	el : "<div class='fixed-pages-view' style='position:relative;'> \
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
            that.trigger("contentDocumentLoaded");
            that.$el.css("opacity", "1");
        }, this);

		// this.mediaOverlayController = this.model.get("media_overlay_controller");
        // this.mediaOverlayController.setPages(this.pages);
        // this.mediaOverlayController.setView(this);

        // this.mediaOverlayController.on("change:mo_text_id", this.highlightText, this);
        // this.mediaOverlayController.on("change:active_mo", this.indicateMoIsPlaying, this);
	},

	render : function (goToLastPage, hashFragmentId) {

		var that = this;
		this.fixedPageViews.loadFixedPages(this.$el[0], this.viewerSettings);
		return this.el;
	},

    // REFACTORING CANDIDATE: Might want these methods to be the goLeft and goRight methods
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

    showPagesView : function () {

        var currentPageNumber = this.fixedPageViews.get("currentPages")[0];
        this.$el.show();
        this.fixedPageViews.showPageNumber(currentPageNumber, this.viewerSettings.syntheticLayout);
    },

    hidePagesView : function () {

        this.$el.hide();
        this.fixedPageViews.hidePageViews();
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

	destruct : function () {

        // this.mediaOverlayController.off("change:mo_text_id", this.highlightText);
        // this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying);
		// this.resetEl();
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
        showPageByHashFragment : function (hashFragmentId) { return; },
        showPageByNumber : function (pageNumber) { return fixedView.showPageNumber.call(fixedView, pageNumber); },
        showPageByCFI : function (CFI) { return; }, 
        onFirstPage : function () { return fixedView.fixedPageViews.onFirstPage.call(fixedView.fixedPageViews); },
        onLastPage : function () { return fixedView.fixedPageViews.onLastPage.call(fixedView.fixedPageViews); },
        showPagesView : function () { return fixedView.showPagesView.call(fixedView); },
        hidePagesView : function () { return fixedView.hidePagesView.call(fixedView); },
        numberOfPages : function () { return fixedView.fixedPageViews.get("fixedPages").length; },
        currentPage : function () { return fixedView.fixedPageViews.get("currentPages"); },
        setFontSize : function (fontSize) { return; },
        setMargin : function (margin) { return; },
        setTheme : function (theme) { return; },
        setSyntheticLayout : function (isSynthetic) { return fixedView.setSyntheticLayout.call(fixedView, isSynthetic); },
        on : function (eventName, callback, callbackContext) { return fixedView.on.call(fixedView, eventName, callback, callbackContext); },
        off : function (eventName, callback) { return fixedView.off.call(fixedView, eventName, callback); }
    };
};
