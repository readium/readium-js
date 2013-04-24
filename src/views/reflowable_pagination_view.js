// API: 
//  Methods that can be called when viewer settings change
//  Methods that can be called to do things, such as move to the next page, go to a hash fragment, etc.
//  Will probably also need to pass in a link click handler

EpubReflowable.ReflowablePaginationView = Backbone.View.extend({

    el : "<div class='flowing-wrapper clearfix' style='display:block;margin-left:auto;margin-right:auto'> \
            <iframe scrolling='no' \
                    frameborder='0' \
                    height='100%' \
                    class='readium-flowing-content'> \
            </iframe> \
            <div class='reflowing-spine-divider'></div> \
          </div>",

    // The spine json
    // Save annotation callback, context
    // EpubCFIs
    // Bindings
    // Viewer settings? 

	initialize : function (options) {

        var ViewerModel = Backbone.Model.extend({});
        var SpineItemModel = Backbone.Model.extend({});

        this.viewerModel = new ViewerModel(options.viewerSettings);
        this.viewerModel.set({ twoUp : options.viewerSettings.syntheticLayout });
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
		this.viewerModel.on("change:fontSize", this.rePaginationHandler, this);
		this.viewerModel.on("change:twoUp", this.rePaginationHandler, this);
		this.viewerModel.on("change:currentMargin", this.rePaginationHandler, this);
		this.pages.on("change:current_page", this.pageChangeHandler, this);
		this.viewerModel.on("change:tocVisible", this.windowSizeChangeHandler, this);
		this.viewerModel.on("change:currentTheme", this.themeChangeHandler, this);
	},
	
	destruct : function() {
	
		// Remove all handlers so they don't hang around in memory	
		// this.mediaOverlayController.off("change:mo_text_id", this.highlightText, this);
  		// this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying, this);
		this.viewerModel.off("change:fontSize", this.rePaginationHandler, this);
		this.viewerModel.off("change:twoUp", this.rePaginationHandler, this);
		this.viewerModel.off("change:currentMargin", this.rePaginationHandler, this);
		this.pages.off("change:current_page", this.pageChangeHandler, this);
		this.viewerModel.off("change:tocVisible", this.windowSizeChangeHandler, this);
		this.viewerModel.off("change:currentTheme", this.themeChangeHandler, this);

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
                    that.pages.goToLastPage(that.viewerModel.get("twoUp"), that.spineItemModel.get("firstPageIsOffset"));
                }
                else {
                    that.pages.goToPage(1, that.viewerModel.get("twoUp"), that.spineItemModel.get("firstPageIsOffset"));
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

    showPageByCFI : function (CFI) {

        // Errors have to be handled from the library
        try {
            var $targetElement = this.cfi.injectElement(CFI, $(this.getEpubContentDocument()).parent()[0], "<span class='show-page'></span>");
        }
        catch (error) {
            // Maybe check error type
            throw error;
        }

        // Find the page number for the first element that the CFI refers to
        var page = this.reflowableElementsInfo.getElemPageNumber(
            $targetElement[0], 
            this.offsetDirection(), 
            this.reflowablePaginator.page_width, 
            this.reflowablePaginator.gap_width,
            this.getEpubContentDocument());

        if (page > 0) {
            this.pages.goToPage(page, this.viewerModel.get("twoUp"), this.spineItemModel.get("firstPageIsOffset")); 
        }
        else {
            throw new Error("The page specified by the CFI could not be found");
        }
    },

    // The package document needs to get passed into the view, or the API needs to change. This is not critical at the moment.
    //
    // // Description: Generates a CFI for an element is that is currently visible on the page. This CFI and a last-page payload
    // //   is then saved for the current EPUB.
    // savePosition : function () {

    //     var $visibleTextNode;
    //     var CFI;

    //     // Get first visible element with a text node 
    //     $visibleTextNode = this.reflowableElementsInfo.findVisibleTextNode(
    //         this.getEpubContentDocument(), 
    //         this.viewerModel.get("two_up"),
    //         // REFACTORING CANDIDATE: These two properties should be stored another way. This should be 
    //         //   temporary.
    //         this.reflowablePaginator.gap_width,
    //         this.reflowablePaginator.page_width
    //         );

    //     CFI = this.annotations.findExistingLastPageMarker($visibleTextNode);
    //     if (!CFI) {

    //     	CFI = this.annotations.generateCharacterOffsetCFI(
    //     		this.reflowableElementsInfo.findVisibleCharacterOffset($visibleTextNode, this.getEpubContentDocument()),
				// $visibleTextNode[0],
				// this.spineItemModel.get("idref"),
				// this.epubController.getPackageDocumentDOM()
	   //      	);
    //     }
    //     this.annotations.saveAnnotation(CFI, this.spineItemModel.get("spine_index"));
    // },

    showView : function () {
        this.$el.show();
    },

    hideView : function () {
        this.$el.hide();
    },

	// Description: Find an element with this specified id and show the page that contains the element.
	goToHashFragment : function(hashFragmentId) {

		// this method is triggered in response to 
		var fragment = hashFragmentId;
		if(fragment) {
			var el = $("#" + fragment, this.getEpubContentDocument())[0];

			if(!el) {
				// couldn't find the el. just give up
                return;
			}

			// we get more precise results if we look at the first children
			while (el.children.length > 0) {
				el = el.children[0];
			}

			var page = this.reflowableElementsInfo.getElemPageNumber(
				el, 
				this.offsetDirection(), 
				this.reflowablePaginator.page_width, 
				this.reflowablePaginator.gap_width,
				this.getEpubContentDocument());

            if (page > 0) {
                //console.log(fragment + " is on page " + page);
                this.pages.goToPage(page, this.viewerModel.get("twoUp"), this.spineItemModel.get("firstPageIsOffset"));	
			}
            else {
                // Throw an exception here 
            }
		}
		// else false alarm no work to do
	},

    onFirstPage : function () {

        // Rationale: Need to check for both single and synthetic page spread
        var oneOfCurrentPagesIsFirstPage = this.pages.get("current_page")[0] === 1 ? true :
                                           this.pages.get("current_page")[1] === 1 ? true : false;

        if (oneOfCurrentPagesIsFirstPage) {
            return true;
        }
        else {
            return false;
        }
    },

    onLastPage : function () {

        // Rationale: Need to check for both single and synthetic page spread
        var oneOfCurrentPagesIsLastPage = this.pages.get("current_page")[0] === this.pages.get("num_pages") ? true :
                                          this.pages.get("current_page")[1] === this.pages.get("num_pages") ? true : false;

        if (oneOfCurrentPagesIsLastPage) {
            return true;
        }
        else {
            return false;
        }
    },

    showPage : function(page) {

        var offset = this.calcPageOffset(page).toString() + "px";
        $(this.getEpubContentDocument()).css(this.offsetDirection(), "-" + offset);
        this.showContent();
        
        // if (this.viewerModel.get("twoUp") == false || 
        //     (this.viewerModel.get("twoUp") && page % 2 === 1)) {
        //         // when we change the page, we have to tell MO to update its position
        //         // this.mediaOverlayController.reflowPageChanged();
        // }
    },

    setFontSize : function (fontSize) {
        this.viewerModel.set({ fontSize : fontSize });
    },

    setMargin : function (margin) {
        this.viewerModel.set({ currentMargin : margin });
    },

    setTheme : function (theme) {
        this.viewerModel.set({ currentTheme : theme });
    },

    setSyntheticLayout : function (isSynthetic) {
    
        // Rationale: Only toggle the layout if a change is required        
        if (isSynthetic !== this.viewerModel.get("twoUp")) {
            this.viewerModel.set({ twoUp : isSynthetic });
            this.pages.toggleTwoUp(isSynthetic, this.spineItemModel.get("firstPageIsOffset"));
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
	// PRIVATE EVENT HANDLERS                               								//
	// ------------------------------------------------------------------------------------ //

	keydownHandler : function (e) {

        if (e.which == 39) {

            this.trigger("keydown-right");
            // this.pages.goRight();
        }
                        
        if (e.which == 37) {

            this.trigger("keydown-left");
            // this.pages.goRight();
        }
    },

	pageChangeHandler: function() {

        var that = this;
		this.hideContent();
		setTimeout(function () {

			that.showPage(that.pages.get("current_page")[0]);
			// that.savePosition();
			that.showContent();

		}, 150);
	},

	windowSizeChangeHandler: function() {

		this.paginateContentDocument();
		
		// Make sure we return to the correct position in the epub (This also requires clearing the hash fragment) on resize.
		// this.goToHashFragment(this.epubController.get("hash_fragment"));
	},
    
	rePaginationHandler: function() {

		this.paginateContentDocument();
	},

	themeChangeHandler : function () {

		this.reflowableLayout.injectTheme(
			this.viewerModel.get("currentTheme"), 
			this.getEpubContentDocument(), 
			this.getFlowingWrapper());
	},

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS AND UTILITY METHODS                                               //
	// ------------------------------------------------------------------------------------ //

	// Rationale: This method delegates the pagination of a content document to the reflowable layout model
	paginateContentDocument : function () {

		var pageInfo = this.reflowablePaginator.paginateContentDocument(
			this.getSpineDivider(),
			this.viewerModel.get("twoUp"),
			this.offsetDirection(),
			this.getEpubContentDocument(),
			this.getReadiumFlowingContent(),
			this.getFlowingWrapper(),
			this.spineItemModel.get("firstPageIsOffset"),
			this.pages.get("current_page"),
			this.spineItemModel.get("pageProgressionDirection"),
			this.viewerModel.get("currentMargin"),
			this.viewerModel.get("fontSize")
			);

		this.pages.set("num_pages", pageInfo[0]);
		this.showPage(pageInfo[1]);
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

	// Rationale: For the purpose of looking up EPUB resources in the package document manifest, Readium expects that 
	//   all relative links be specified as relative to the package document URI (or absolute references). However, it is 
	//   valid XHTML for a link to another resource in the EPUB to be specfied relative to the current document's
	//   path, rathƒer than to the package document. As such, URIs passed to Readium must be either absolute references or 
	//   relative to the package document. This method resolves URIs to conform to this condition. 
	resolveRelativeURI : function (rel_uri) {
		var relativeURI = new URI(rel_uri);

		// Get URI for resource currently loaded in the view's iframe
		var iframeDocURI = new URI($(this.getReadiumFlowingContent()).attr("src"));
		return relativeURI.resolve(iframeDocURI).toString();
	},

	hideContent : function() {
		$(this.getFlowingWrapper()).css("opacity", "0");
	},

	showContent : function() {
		$(this.getFlowingWrapper()).css("opacity", "1");
	},

	calcPageOffset : function(page_num) {
		return (page_num - 1) * (this.reflowablePaginator.page_width + this.reflowablePaginator.gap_width);
	},

	offsetDirection : function () {

		// if this book does right to left pagination we need to set the
		// offset on the right
		if (this.spineItemModel.get("pageProgressionDirection") === "rtl") {
			return "right";
		}
		else {
			return "left";
		}
	}
});