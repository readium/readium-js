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