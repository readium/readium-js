

Readium.Views.FixedPaginationView = Readium.Views.PaginationViewBase.extend({

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize: function(options) {

		// call the super ctor
		Readium.Views.PaginationViewBase.prototype.initialize.call(this, options);

		var spinePos = this.model.get("spine_position");
		this.model.on("FXL_goToPage", this.spinePositionChangeHandler, this);
		this.model.on("change:two_up", this.setUpMode, this);
		this.model.on("change:meta_size", this.setContainerSize, this);
	},

	render: function() {

		$('body').addClass('apple-fixed-layout');

		// wipe the html
		this.$('#container').html("");
		this.setContainerSize();
		this.setUpMode();

		var that = this;
		var pageNum = 1; // start from page 1
		var offset = this.findPrerenderStart();
		var rendered_spine_positions = [];
		var spine_position = this.model.get("spine_position");

		// Gets each page of the current pub and injects it into the page 
		// keeping track of what has been pre-rendered
		while ( this.shouldPreRender( this.model.getCurrentSection(offset) ) ) {

			this.addPage(this.model.getCurrentSection(offset), pageNum);
			rendered_spine_positions.push(spine_position + offset);
			pageNum += 1;
			offset += 1;
		}

		// set the page we should be on
		var page = rendered_spine_positions.indexOf(spine_position) + 1;
		this.pages.set("num_pages", pageNum - 1);
		this.pages.goToPage(page);

		setTimeout(function() {
			that.setContainerSize();
		}, 15);

		this.showCurrentPages();

		return rendered_spine_positions;
	},

	// get the body element for a page number
    getPageBody: function(pageNum) {
        var pageElm = $("#page-" + pageNum.toString() +" iframe");
        if (pageElm.length > 0) {
            pageElm = pageElm.contents()[0].documentElement;
            return $(pageElm).find("body")
        }
        else {
            return null;
        }
    },
    
    // override
	indicateMoIsPlaying: function () {
		var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
		moHelper.renderFixedMoPlaying(
			this.pages.get("current_page"),
			this.mediaOverlayController.get("active_mo"),
			this
        );
	},
    
    // override
	highlightText: function () {
		var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
		moHelper.renderFixedLayoutMoFragHighlight(
			this.pages.get("current_page"),
			this.mediaOverlayController.get("mo_text_id"),
			this
        );
	},
    
    // override
    // Description: return the set of all elements for this spine item that have an @id attribute.
    // Used by MO.
    getAllPageElementsWithId: function() {
        return $('body').find("[id]");
    },
    
    
	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	// sometimes these views hang around in memory before
	// the GC's get them. we need to remove all of the handlers
	// that were registered on the model
	destruct: function() {

		// call the super constructor
		Readium.Views.PaginationViewBase.prototype.destruct.call(this);

		// remove any listeners registered on the model
		this.model.off("change:two_up", this.setUpMode);
		this.model.off("change:meta_size", this.setUpMode);		
	},

	// Description: Handles clicks of anchor tags by navigating to
	// the proper location in the epub spine, or opening
	// a new window for external links
	linkClickHandler: function(e) {
		e.preventDefault();

		var href;

		// Check for both href and xlink:href attribute and get value
		if (e.currentTarget.attributes["xlink:href"]) {

			href = e.currentTarget.attributes["xlink:href"].value;
		}
		else {

			href = e.currentTarget.attributes["href"].value;
		}

		// Resolve the relative path for the resource
		href = this.resolveRelativeURI(href);

		if (href.match(/^http(s)?:/)) {
			window.open(href);
		} 
		else {
			this.model.goToHref(href);
		}
	},

	// Rationale: For the purpose of looking up EPUB resources in the package document manifest, Readium expects that 
	//   all relative links be specified as relative to the package document URI (or absolute references). However, it is 
	//   valid XHTML for a link to another resource in the EPUB to be specfied relative to the current document's
	//   path, rather than to the package document. As such, URIs passed to Readium must be either absolute references or 
	//   relative to the package document. This method resolves URIs to conform to this condition. 
	resolveRelativeURI: function (rel_uri) {

		var sourceDocManifestHref;
		var sourceDocName;
		var pageSrc;

		// Get the name of the click source document
		sourceDocManifestHref = this.model.getCurrentSection().get("href");
		indexOfFilenameStart = sourceDocManifestHref.lastIndexOf('/') + 1;
		sourceDocName = sourceDocManifestHref.substr(indexOfFilenameStart, rel_uri.length);

		// Iterate through list of FXL pages. Look for the one that is visible and has the name
		$(".fixed-page-wrap").each(function () {

			var $currPage = $('.content-sandbox', this);

			// Get the name of the content document in the page iframe
			var currPageSrc = $currPage.attr("src");
			var pageDocNameStart = currPageSrc.lastIndexOf('/') + 1;
			var pageDocName = currPageSrc.substr(pageDocNameStart, currPageSrc.length);

			if (pageDocName === sourceDocName) {
				pageSrc = currPageSrc;
				return false;
			}
		});

		var relativeURI = new URI(rel_uri);

		// Get URI for resource currently loaded in the view's iframe
		var iframeDocURI = new URI(pageSrc);

		return relativeURI.resolve(iframeDocURI).toString();
	},

	spinePositionChangeHandler: function () {

		var pageNumber = this.model.get("spine_position") + 1;
		this.pages.goToPage(pageNumber);
	},

	// Description: Creates/gets an iFrame which contains a page view to represent a spine item and appends it to an 
	//   element that contains the content of the current ePub. Each of these spine item iframes is not necessarily displayed
	//   immediately. 
	addPage: function(spineItem, pageNum) {

		var that = this;
		var view = spineItem.getPageView();

		view.on("iframe_loaded", function() {
			this.iframeLoadCallback({srcElement: view.iframe()});
			that.applyKeydownHandler($(view.iframe()));
		}, this);

		var content = spineItem.getPageView().render().el;
		$(content).attr("id", "page-" + pageNum.toString());
		this.$('#container').append(content);

		this.showCurrentPages();

		return this;
	},

	setContainerSize: function() {
		
		var meta = this.model.get("meta_size");

		if (meta) {

			this.$el.width(meta.width * 2);
			this.$el.height(meta.height);
			this.zoomer.fitToBest();

			if (!this.zoomed) {

				this.zoomed = true;
				// setTimeout(function() {
				// 	$('#page-wrap').zoomAndScale(); //<= this was a little buggy last I checked but it is a super cool feature
				// }, 1)	
			}
		}
	},	

	findPrerenderStart: function() {
		
		var i = 0;
		while ( this.shouldPreRender( this.model.getCurrentSection(i) ) ) {
			i -= 1;
		}

		return i + 1; // sloppy fix for an off by one error
	},

	// Description: A spine item should pre-render if it is not undefined and should render as a fixed item
	shouldPreRender: function(spineItem) {
		return spineItem && spineItem.isFixedLayout(); 
	},

	// Description: For each fixed-page-wrap(per), if it is one of the current pages, toggle it as visible. If it is not
	//   toggle it as invisible.
	// Note: current_page is an array containing the page numbers (as of 25June2012, a maximum of two pages) of the 
	//   currently visible pages
	showCurrentPages: function() {
		var that = this;
		var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});

		this.$(".fixed-page-wrap").each(function(index) {
			$(this).toggle(that.pages.isPageVisible(index + 1));
		});

		// remove any artifact of MO highlighting from the current page(s)
        $.each(this.pages.get("current_page"), function(idx) {
            moHelper.removeActiveClass(that.getPageBody(this.toString()));
        });
	},

	setFontSize: function() {
		var size = this.model.get("font_size") / 10;
		$('#readium-content-container').css("font-size", size + "em");
		this.showCurrentPages();
	},

	applyKeydownHandler : function ($pageViewContainer) {

		var that = this;

		$pageViewContainer.contents().keydown(function (e) {

			if (e.which == 39) {
				that.model.paginator.v.pages.goRight();
			}
							
			if (e.which == 37) {
				that.model.paginator.v.pages.goLeft();
			}
		});
	}
});


Readium.Views.FixedPageView = Backbone.View.extend({

	className: "fixed-page-wrap",

	initialize: function() {
		this.template = Handlebars.templates.fixed_page_template;
		this.model.on("change", this.render, this);
	},

	destruct: function() {
		this.model.off("change", this.render);
	},

	render: function() {
		var that = this;
		var json = this.model.toJSON();
		this.$el.html( this.template( json ) );
		this.$el.addClass( this.model.getPageSpreadClass() );
		this.$('.content-sandbox').on("load", function() {
			that.trigger("iframe_loaded");
		});
		return this;
	},

	iframe: function() {
		return this.$('.content-sandbox')[0];
	}
});


Readium.Views.ImagePageView = Backbone.View.extend({

	className: "fixed-page-wrap",

	initialize: function() {
		this.template = Handlebars.templates.image_page_template;
		this.model.on("change", this.render, this);
	},

	render: function() {
		var that = this;
		var json = this.model.toJSON();
		this.$el.html( this.template( json ) );
		this.$el.addClass( this.model.getPageSpreadClass() );

		this.$('img').on("load", function() { that.setSize(); });
		

		return this;
	},

	setSize: function() {
		var $img = this.$('img');
		var width = $img.width();
		var height = $img.height();
		// temp this is a mess but it will do for now...
		if( width > 0) {
			this.model.set({meta_width: width, meta_height: height})
		}
		
	}

});