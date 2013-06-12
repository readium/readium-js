EpubReflowable.ReflowablePaginationView = Backbone.View.extend({

    el : "<div class='flowing-wrapper clearfix' style='display:block;margin-left:auto;margin-right:auto'> \
            <iframe scrolling='no' \
                    frameborder='0' \
                    height='100%' \
                    class='readium-flowing-content'> \
            </iframe> \
            <div class='reflowing-spine-divider'></div> \
          </div>",

	initialize : function (options) {

        var ViewerModel = Backbone.Model.extend({});
        var SpineItemModel = Backbone.Model.extend({});

        this.viewerModel = new ViewerModel(options.viewerSettings);
        this.viewerModel.set({ syntheticLayout : options.viewerSettings.syntheticLayout });
        this.spineItemModel = new SpineItemModel(options.spineItem);
        this.epubCFIs = options.contentDocumentCFIs;
        this.bindings = options.bindings;

		// Initalize delegates and other models
		this.reflowableLayout = new EpubReflowable.ReflowableLayout();
		this.reflowablePaginator = new EpubReflowable.ReflowablePaginator();
		this.reflowableElementsInfo = new EpubReflowable.ReflowableElementInfo();
		this.pages = new EpubReflowable.ReflowablePagination();

        // So this can be any callback, doesn't have to be the epub controller
		this.annotations;

        this.cfi = new EpubCFIModule();

        // this.mediaOverlayController = this.model.get("media_overlay_controller");
        // this.mediaOverlayController.setPages(this.pages);
        // this.mediaOverlayController.setView(this);

        // Initialize handlers
		// this.mediaOverlayController.on("change:mo_text_id", this.highlightText, this);
        // this.mediaOverlayController.on("change:active_mo", this.indicateMoIsPlaying, this);
	},
	
	destruct : function() {
	
		// Remove all handlers so they don't hang around in memory	
		// this.mediaOverlayController.off("change:mo_text_id", this.highlightText, this);
  		// this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying, this);
        this.reflowableLayout.resetEl(
        	this.getEpubContentDocument(), 
        	this.el, 
        	this.getSpineDivider());
	},

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	render : function (goToLastPage, hashFragmentId) {

		var that = this;
		var json = this.spineItemModel.toJSON();

        $("iframe", this.el).attr("src", json.contentDocumentURI);
        $("iframe", this.el).attr("title", json.title);

		// Wait for iframe to load EPUB content document
		$(this.getReadiumFlowingContent()).on("load", function (e) {

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
               var iFrame = that.getReadiumFlowingContent();
               var iFrameWindow = iFrame.contentWindow || iFrame.contentDocument.parentWindow;
               var ers = navigator.epubReadingSystem;
               iFrameWindow.navigator.epubReadingSystem = ers;
            }

			var lastPageElementId = that.initializeContentDocument();

			// Rationale: The content document must be paginated in order for the subsequent "go to page" methods
			//   to have access to the number of pages in the content document.
			that.paginateContentDocument();
			// that.mediaOverlayController.pagesLoaded();

			// Rationale: The assumption here is that if a hash fragment is specified, it is the result of Readium 
			//   following a clicked linked, either an internal link, or a link from the table of contents. The intention
			//   to follow a link should supersede restoring the last-page position, as this should only be done for the 
			//   case where Readium is re-opening the book, from the library view. 
			if (hashFragmentId) {
                that.goToHashFragment(hashFragmentId);
            }
            else if (lastPageElementId) {
                that.goToHashFragment(lastPageElementId);
            }
            else {

                if (goToLastPage) {
                    that.pages.goToLastPage(that.viewerModel.get("syntheticLayout"), that.spineItemModel.get("firstPageIsOffset"));
                }
                else {
                    that.pages.goToPage(1, that.viewerModel.get("syntheticLayout"), that.spineItemModel.get("firstPageIsOffset"));
                }
            }

            that.annotations = new EpubReflowable.ReflowableAnnotations({
                saveCallback : undefined,
                callbackContext : undefined,
                contentDocumentDOM : that.getEpubContentDocument().parentNode
            });

            that.trigger("contentDocumentLoaded", that.el);
		});
        
		return this.el;
	},
    
	// indicateMoIsPlaying: function () {
	// 	var moHelper = new EpubReflowable.MediaOverlayViewHelper({epubController : this.model});
	// 	moHelper.renderReflowableMoPlaying(
	// 		this.model.get("current_theme"),
	// 		this.mediaOverlayController.get("active_mo"),
	// 		this
	// 	);
	// },

	// highlightText: function () {
	// 	var moHelper = new EpubReflowable.MediaOverlayViewHelper({epubController : this.model});
	// 	moHelper.renderReflowableMoFragHighlight(
	// 		this.model.get("current_theme"),
	// 		this,
	// 		this.mediaOverlayController.get("mo_text_id")
	// 	);
	// },

    showPageByNumber : function (pageNumber) {

        this.pages.goToPage(pageNumber, this.viewerModel.get("syntheticLayout"), this.spineItemModel.get("firstPageIsOffset"));
        this.showCurrentPages();
    },

    showPageByCFI : function (CFI) {

        var $rangeTargetElements;
        var $standardTargetElement;
        var targetElement;
        try {

            // Check if it's a CFI range type
            if (new RegExp(/.+,.+,.+/).test(CFI)) {
                $rangeTargetElements = this.cfi.getRangeTargetElements(CFI, $(this.getEpubContentDocument()).parent()[0]);
                targetElement = $rangeTargetElements[0];
            }
            else {
                $standardTargetElement = this.cfi.getTargetElement(CFI, $(this.getEpubContentDocument()).parent()[0]);
                targetElement = $standardTargetElement[0];
            }
        }
        catch (error) {
            // Maybe check error type
            throw error;
        }

        this.showPageByElement(targetElement);
    },

    showPageByElementId : function (elementId) {

        var targetElement = $("#" + elementId, this.getEpubContentDocument())[0];
        if (!targetElement) {
            // couldn't find the el. just give up
            return;
        }

        // we get more precise results if we look at the first children
        while (targetElement.children.length > 0) {
            targetElement = targetElement.children[0];
        }

        this.showPageByElement(targetElement);
    },

    showView : function () {
        
        this.$el.show();
        this.updatePageNumber();
    },

    hideView : function () {
        
        this.$el.hide();
    },

    setFontSize : function (fontSize) {

        this.viewerModel.set("fontSize", fontSize);
        this.paginateContentDocument();
    },

    setMargin : function (margin) {

        this.viewerModel.set("currentMargin", margin);
        this.paginateContentDocument();
    },

    setTheme : function (theme) {

        this.viewerModel.set("currentTheme", theme);
        this.reflowableLayout.injectTheme(
            this.viewerModel.get("currentTheme"), 
            this.getEpubContentDocument(), 
            this.getFlowingWrapper()
        );
        this.redrawAnnotations();

        this.trigger("displayedContentChanged");
    },

    setSyntheticLayout : function (isSynthetic) {
    
        // Rationale: Only toggle the layout if a change is required        
        if (isSynthetic !== this.viewerModel.get("syntheticLayout")) {

            this.viewerModel.set("syntheticLayout", isSynthetic);
            this.pages.toggleTwoUp(isSynthetic, this.spineItemModel.get("firstPageIsOffset"));
            this.paginateContentDocument();
            this.trigger("layoutChanged", isSynthetic);
        }
    },

    nextPage : function () {

        if (!this.pages.onLastPage()) {

            var isSynthetic = this.viewerModel.get("syntheticLayout");
            this.pages.nextPage(isSynthetic);
            this.showCurrentPages();

            // Trigger events
            this.trigger("atNextPage");
            this.pages.onLastPage() ? this.trigger("atLastPage") : undefined;
        } 
        else {
            this.trigger("atLastPage");
        }
    },

    previousPage : function () {

        if (!this.pages.onFirstPage()) {

            var isSynthetic = this.viewerModel.get("syntheticLayout");
            this.pages.prevPage(isSynthetic);
            this.showCurrentPages();

            // Trigger events
            this.trigger("atPreviousPage");
            this.pages.onFirstPage() ? this.trigger("atFirstPage") : undefined; 
        }
        else {
            this.trigger("atFirstPage");
        }
    },

	// ------------------------------------------------------------------------------------ //
	//  PRIVATE GETTERS FOR VIEW                                                            //
	// ------------------------------------------------------------------------------------ //    

	getFlowingWrapper : function () {
		return this.el;
	},

	getReadiumFlowingContent : function () {
		return $(this.el).children()[0];
	},

    // REFACTORING CANDIDATE: That's a lot of chaining right there. Too much. 
	getEpubContentDocument : function () {
		return $($($(this.el).children()[0]).contents()[0]).children()[0];
	},

	getSpineDivider : function () {
		return $(".reflowing-spine-divider")[0];
	},

	// ------------------------------------------------------------------------------------ //
	//  PRIVATE EVENT HANDLERS                               								//
	// ------------------------------------------------------------------------------------ //

	keydownHandler : function (e) {

        if (e.which == 39) {
            this.trigger("keydown-right");
        }
                        
        if (e.which == 37) {
            this.trigger("keydown-left");
        }
    },

    linkClickHandler : function (e) {

        this.trigger("internalLinkClicked", e);
    },

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS AND UTILITY METHODS                                               //
	// ------------------------------------------------------------------------------------ //

    // Rationale: The "paginator" model uses the scrollWidth of the paginated xhtml content document in order
    //   to calculate it's number of pages (given the current screen size etc.). It appears that 
    //   the scroll width property is either buggy, unreliable, or changes by small amounts between the time the content
    //   document is paginated and when it is used. Regardless of the cause, the scroll width is understated, which causes
    //   the number of pages to be understated. As a result, the last page of a content document is often not shown when 
    //   a user moves to the last page of the content document. This method recalculates the number of pages for the current
    //   scroll width of the content document. 
    updatePageNumber : function () {
        
        var recalculatedNumberOfPages;
        var epubContentDocument = this.getEpubContentDocument();
        var isSyntheticLayout = this.viewerModel.get("syntheticLayout");
        var currScrollWidth = epubContentDocument.scrollWidth;
        var lastScrollWidth = this.reflowablePaginator.get("lastScrollWidth");

        if (lastScrollWidth !== currScrollWidth) {
            recalculatedNumberOfPages = this.reflowablePaginator.calcNumPages(epubContentDocument, isSyntheticLayout);
            this.pages.set("numberOfPages", recalculatedNumberOfPages);
            this.reflowablePaginator.set("lastScrollWidth", currScrollWidth);
        }
    },

	// Rationale: This method delegates the pagination of a content document to the reflowable layout model
	paginateContentDocument : function () {

		var pageInfo = this.reflowablePaginator.paginateContentDocument(
			this.getSpineDivider(),
			this.viewerModel.get("syntheticLayout"),
			this.offsetDirection(),
			this.getEpubContentDocument(),
			this.getReadiumFlowingContent(),
			this.getFlowingWrapper(),
			this.spineItemModel.get("firstPageIsOffset"),
			this.pages.get("currentPages"),
			this.spineItemModel.get("pageProgressionDirection"),
			this.viewerModel.get("currentMargin"),
			this.viewerModel.get("fontSize")
			);

		this.pages.set("numberOfPages", pageInfo[0]);
        this.redrawAnnotations();
        this.pages.resetCurrentPages();
		this.showCurrentPages();
	},

	initializeContentDocument : function () {

		var elementId = this.reflowableLayout.initializeContentDocument(
			this.getEpubContentDocument(), 
			this.epubCFIs, 
			this.spineItemModel.get("spine_index"), 
			this.getReadiumFlowingContent(), 
			this.linkClickHandler, 
			this, 
			this.viewerModel.get("currentTheme"), 
			this.getFlowingWrapper(), 
			this.getReadiumFlowingContent(), 
			this.keydownHandler,
            this.bindings
			);

		return elementId;
	},

    showPageByElement : function (element) {

        var pageNumber = this.reflowableElementsInfo.getElemPageNumber(
            element, 
            this.offsetDirection(), 
            this.reflowablePaginator.page_width, 
            this.reflowablePaginator.gap_width,
            this.getEpubContentDocument());

        if (pageNumber > 0) {

            this.pages.goToPage(pageNumber, this.viewerModel.get("syntheticLayout"), this.spineItemModel.get("firstPageIsOffset"));
            this.showCurrentPages();
        }
        else {
            // Throw an exception here 
        }
    },

    showCurrentPages : function () {

        var that = this;
        this.hideContent();
        that.moveViewportToPage(that.pages.get("currentPages")[0]);
        that.showContent();
        this.trigger("displayedContentChanged");
    },

    moveViewportToPage : function (pageNumber) {

        var offset = this.calcPageOffset(pageNumber).toString() + "px";
        $(this.getEpubContentDocument()).css(this.offsetDirection(), "-" + offset);
        
        // if (this.viewerModel.get("twoUp") == false || 
        //     (this.viewerModel.get("twoUp") && page % 2 === 1)) {
        //         // when we change the page, we have to tell MO to update its position
        //         // this.mediaOverlayController.reflowPageChanged();
        // }
    },

	hideContent : function () {
		$(this.getFlowingWrapper()).css("opacity", "0");
	},

	showContent : function () {
		$(this.getFlowingWrapper()).css("opacity", "1");
	},

	calcPageOffset : function (pageNumber) {
		return (pageNumber - 1) * (this.reflowablePaginator.page_width + this.reflowablePaginator.gap_width);
	},

    redrawAnnotations : function () {

        if (this.annotations) {
            this.annotations.redraw();
        }
    },

	offsetDirection : function () {

		// Rationale: If this book does right to left pagination we need to set the
		//   offset on the right
		if (this.spineItemModel.get("pageProgressionDirection") === "rtl") {
			return "right";
		}
		else {
			return "left";
		}
	}
});