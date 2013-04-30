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
		this.mediaOverlayController = this.model.get("media_overlay_controller");
        this.mediaOverlayController.setPages(this.pages);
        this.mediaOverlayController.setView(this);

		this.pages.on("change:current_page", this.showCurrentPages, this);

		this.model.on("change:font_size", this.setFontSize, this);
		this.model.on("change:two_up", this.pages.toggleTwoUp, this.pages);
        
        this.mediaOverlayController.on("change:mo_text_id", this.highlightText, this);
        this.mediaOverlayController.on("change:active_mo", this.indicateMoIsPlaying, this);
        
		this.bindingTemplate = Handlebars.templates.binding_template;
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
	
    // Description: Activates a style set for the ePub, based on the currently selected theme. At present, 
    //   only the day-night alternate tags are available as an option.  
    // Used: Reflowable
	activateEPubStyle: function(bookDom) {

	    var selector;
		
		// Apply night theme for the book; nothing will be applied if the ePub's style sheets do not contain a style
		// set with the 'night' tag
	    if (this.model.get("current_theme") === "night-theme") {

	    	selector = new Readium.Models.AlternateStyleTagSelector;
	    	bookDom = selector.activateAlternateStyleSet(["night"], bookDom);

	    }
	    else {

			selector = new Readium.Models.AlternateStyleTagSelector;
	    	bookDom = selector.activateAlternateStyleSet(["day"], bookDom);
	    }
	},

	// REFACTORING CANDIDATE: This method could use a better name. The purpose of this method is to make one or two 
	//   pages of an epub visible. "setUpMode" seems non-specific. 
	// Description: Changes the html to make either 1 or 2 pages visible in their iframes
	// Used: fixed, reflowable
	setUpMode: function() {
		var two_up = this.model.get("two_up");
		this.$el.toggleClass("two-up", two_up);
		this.$('#spine-divider').toggle(two_up);
	},

	// Description: Iterates through the list of rendered pages and displays those that 
	//   should be visible in the viewer.
	// Used: this, fixed
	showCurrentPages: function() {
		var that = this;
		var two_up = this.model.get("two_up");
		this.$(".page-wrap").each(function(index) {
			if(!two_up) { 
				index += 1;
			}
			$(this).toggleClass("hidden-page", !that.pages.isPageVisible(index));
		});
	},

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	// Description: Sometimes views hang around in memory before
	//   the GC gets them. we need to remove all of the handlers
	//   that were registered on the model
	destruct: function() {
		this.pages.off("change:current_page", this.showCurrentPages);
		this.model.off("change:font_size", this.setFontSize);
        this.mediaOverlayController.off("change:mo_text_id", this.highlightText);
        this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying);
		this.resetEl();
	},

	// Used: this
	getBindings: function() {
		var packDoc = this.model.epub.getPackageDocument();
		var bindings = packDoc.get('bindings');
		return bindings.map(function(binding) {
			binding.selector = 'object[type="' + binding.media_type + '"]';
			binding.url = packDoc.getManifestItemById(binding.handler).get('href');
			binding.url = packDoc.resolveUri(binding.url);
			return binding;
		})
	},

	// Used: this
	applyBindings: function(dom) {
		var that = this;
		var bindings = this.getBindings();
		var i = 0;
		for(var i = 0; i < bindings.length; i++) {
			$(bindings[i].selector, dom).each(function() {
				var params = [];
				var $el = $(this);
				var data = $el.attr('data');
				var url;
				params.push("src=" + that.model.packageDocument.resolveUri(data));
				params.push('type=' + bindings[i].media_type);
				url = bindings[i].url + "?" + params.join('&');
				var content = $(that.bindingTemplate({}));
				// must set src attr separately
				content.attr('src', url);
				$el.html(content);
			});
		}
	},

	// Used: this
	applyTriggers: function(dom, triggers) {
		for(var i = 0 ; i < triggers.length; i++) {
			triggers[i].subscribe(dom);
		}
	},

	// Description: For reflowable content we only add what is in the body tag.
	// Lots of times the triggers are in the head of the dom
	// Used: this
	parseTriggers: function(dom) {
		var triggers = [];
		$('trigger', dom).each(function() {
			

			triggers.push(new Readium.Models.Trigger(this) );
		});
		
		return triggers;
	},	

	// Description: Parse the epub "switch" tags and hide
	// cases that are not supported
	// Used: this
	applySwitches: function(dom) {

		// helper method, returns true if a given case node
		// is supported, false otherwise
		var isSupported = function(caseNode) {

			var ns = caseNode.attributes["required-namespace"];
			if(!ns) {
				// the namespace was not specified, that should
				// never happen, we don't support it then
				console.log("Encountered a case statement with no required-namespace");
				return false;
			}
			// all the xmlns's that readium is known to support
			// TODO this is going to require maintanence
			var supportedNamespaces = ["http://www.w3.org/1998/Math/MathML"];
			return _.include(supportedNamespaces, ns);
		};

		$('switch', dom).each(function(ind) {
			
			// keep track of whether or now we found one
			var found = false;

			$('case', this).each(function() {

				if( !found && isSupported(this) ) {
					found = true; // we found the node, don't remove it
				}
				else {
					$(this).remove(); // remove the node from the dom
				}
			});

			if(found) {
				// if we found a supported case, remove the default
				$('default', this).remove();
			}
		})
	},

	// Used: this
	addSwipeHandlers: function(dom) {
		var that = this;
		$(dom).on("swipeleft", function(e) {
			e.preventDefault();
			that.pages.goRight();
			
		});

		$(dom).on("swiperight", function(e) {
			e.preventDefault();
			that.pages.goLeft();
		});
	},

	// inject mathML parsing code into an iframe
	// Used: this
    injectMathJax: function (iframe) {
    	var doc, script, head;
		doc = iframe.contentDocument;
		head = doc.getElementsByTagName("head")[0];
		// if the content doc is SVG there is no head, and thus
		// mathjax will not be required
		if(head) {
			script = doc.createElement("script");
			script.type = "text/javascript";
			script.src = MathJax.Hub.config.root+"/MathJax.js?config=readium-iframe";
			head.appendChild(script);
		}
    },

    // Used: this
    injectLinkHandler: function(iframe) {
    	var that = this;
    	$('a', iframe.contentDocument).click(function(e) {
    		that.linkClickHandler(e)
    	});
    },

	// Rationale: For the purpose of looking up EPUB resources in the package document manifest, Readium expects that 
	//   all relative links be specified as relative to the package document URI (or absolute references). However, it is 
	//   valid XHTML for a link to another resource in the EPUB to be specfied relative to the current document's
	//   path, rather than to the package document. As such, URIs passed to Readium must be either absolute references or 
	//   relative to the package document. This method resolves URIs to conform to this condition. 
	resolveRelativeURI: function (rel_uri) {
		var relativeURI = new URI(rel_uri);

		// Get URI for resource currently loaded in the view's iframe
		var iframeDocURI = new URI($(this.iframeId).attr("src"));

		return relativeURI.resolve(iframeDocURI).toString();
	},

	// Description: Handles clicks of anchor tags by navigating to
	//   the proper location in the epub spine, or opening
	//   a new window for external links
	linkClickHandler: function (e) {
		e.preventDefault();

		var href;

		// Check for both href and xlink:href attribute and get value
		if (e.currentTarget.attributes["xlink:href"]) {
			href = e.currentTarget.attributes["xlink:href"].value;
		}
		else {
			href = e.currentTarget.attributes["href"].value;
		}

		if (href.match(/^http(s)?:/)) {
			window.open(href);
		} 
		else {
			// Resolve the relative path for the requested resource.
			href = this.resolveRelativeURI(href);
			this.model.goToHref(href);
		}
	},

	// Rationale: sadly this is just a reprint of what is already in the
	//   themes stylesheet. It isn't very DRY but the implementation is
	//   cleaner this way
	themes: {
		"default-theme": {
			"background-color": "white",
			"color": "black",
			"mo-color": "#777"
		},

		"vancouver-theme": {
			"background-color": "#DDD",
			"color": "#576b96",
			"mo-color": "#777"
		},

		"ballard-theme": {
			"background-color": "#576b96",
			"color": "#DDD",
			"mo-color": "#888"
		},

		"parchment-theme": {
			"background-color": "#f7f1cf",
			"color": "#774c27",
			"mo-color": "#eebb22"
		},

		"night-theme": {
			"background-color": "#141414",
			"color": "white",
			"mo-color": "#666"
		}
	},

    resetEl: function() {
    	$('body').removeClass("apple-fixed-layout");
    	$("#readium-book-view-el").attr("style", "");
		this.$el.toggleClass("two-up", false);
		this.$('#spine-divider').toggle(false);
		this.zoomer.reset();

    	$('#page-wrap').css({
    		"position": "relative",
    		"right": "0px", 
    		"top": "0px",
    		"-webkit-transform": "scale(1.0) translate(0px, 0px)"
    	});
    }
});