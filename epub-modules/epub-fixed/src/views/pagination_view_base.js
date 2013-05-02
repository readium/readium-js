// Description: The base model for the set of different pagination view strategies: Reflowable, fixed layout and scrolling
// Rationale: The intention behind this model is to provide implementations for behaviour common to all the pagination 
//   strategies. 
// Notes: This model has a reference to the model for the epub currently being rendered, as well as a "pages" object that
//   contains data and behaviour related to the current set of rendered "pages."

Readium.Views.PaginationViewBase = Backbone.View.extend({

	// Description: All strategies are linked to the same dom element
	el: "#readium-book-view-el",

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize: function(options) {
		this.zoomer = options.zoomer;
		this.pages = new Readium.Models.ReadiumPagination({model : this.model});
		// this.mediaOverlayController = this.model.get("media_overlay_controller");
        // this.mediaOverlayController.setPages(this.pages);
        // this.mediaOverlayController.setView(this);

		this.pages.on("change:current_page", this.showCurrentPages, this);

		this.model.on("change:font_size", this.setFontSize, this);
		this.model.on("change:two_up", this.pages.toggleTwoUp, this.pages);
        
        // this.mediaOverlayController.on("change:mo_text_id", this.highlightText, this);
        // this.mediaOverlayController.on("change:active_mo", this.indicateMoIsPlaying, this);
	},

	// Used: reflowable, fixed, scrolling
    iframeLoadCallback: function(e) {
		
		this.applyBindings( $(e.srcElement).contents() );
		this.applySwitches( $(e.srcElement).contents() );
		this.addSwipeHandlers( $(e.srcElement).contents() );
        this.injectMathJax(e.srcElement);
        this.injectLinkHandler(e.srcElement);
        var trigs = this.parseTriggers(e.srcElement.contentDocument);
		this.applyTriggers(e.srcElement.contentDocument, trigs);
		$(e.srcElement).attr('title', Acc.page + ' - ' + Acc.title);
        this.mediaOverlayController.pagesLoaded();
	},

	// REFACTORING CANDIDATE: This method could use a better name. The purpose of this method is to make one or two 
	//   pages of an epub visible. "setUpMode" seems non-specific. 
	// Description: Changes the html to make either 1 or 2 pages visible in their iframes
	// Used: fixed, reflowable
	// setUpMode: function() {
	// 	var two_up = this.model.get("two_up");
	// 	this.$el.toggleClass("two-up", two_up);
	// 	this.$('#spine-divider').toggle(two_up);
	// },

	// Description: Iterates through the list of rendered pages and displays those that 
	//   should be visible in the viewer.
	// Used: this, fixed
	// showCurrentPages: function() {
	// 	var that = this;
	// 	var two_up = this.model.get("two_up");
	// 	this.$(".page-wrap").each(function(index) {
	// 		if(!two_up) { 
	// 			index += 1;
	// 		}
	// 		$(this).toggleClass("hidden-page", !that.pages.isPageVisible(index));
	// 	});
	// },

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	// Description: Sometimes views hang around in memory before
	//   the GC gets them. we need to remove all of the handlers
	//   that were registered on the model
	destruct: function() {
		this.pages.off("change:current_page", this.showCurrentPages);
		this.model.off("change:font_size", this.setFontSize);
        // this.mediaOverlayController.off("change:mo_text_id", this.highlightText);
        // this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying);
		// this.resetEl();
	},

    // Used: this
    injectLinkHandler: function(iframe) {
    	var that = this;
    	$('a', iframe.contentDocument).click(function(e) {
    		that.linkClickHandler(e)
    	});
    },

  //   resetEl: function() {
  //   	$('body').removeClass("apple-fixed-layout");
  //   	$("#readium-book-view-el").attr("style", "");
		// this.$el.toggleClass("two-up", false);
		// this.$('#spine-divider').toggle(false);
		// this.zoomer.reset();

  //   	$('#page-wrap').css({
  //   		"position": "relative",
  //   		"right": "0px", 
  //   		"top": "0px",
  //   		"-webkit-transform": "scale(1.0) translate(0px, 0px)"
  //   	});
  //   }
});