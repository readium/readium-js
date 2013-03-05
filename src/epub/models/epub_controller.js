// Description: This model is a sort of "controller" for an ePUB, managing the interaction between calling code
//   and the saved epub. This model also exposes and persists properties that determine how an epub is displayed in 
//   Readium. Some of these properties are determined by the user, such as whether two pages are being displayed, the font size etc.
//   Other properties are determined by the user's interaction with the reader and the structure of the book. These include
//   the current spine item rendered in the viewer, as well the logic that governs changing the current spine item.  
//
// Rationale: This model is designed to expose a useful concept of an "epub" to the rest of Readium. This includes the contents
//   of the epub itself, as well as view properties (mentioned above) and the logic governing interaction with epub properties and 
//   contents. It is the intention for this model that it have little to no knowledge of how an epub is rendered. It is intended 
//   that Backbone attributes (getting/setting) and the backbone attribute event model (events fired on attribute changes) should 
//   the primary ways of interacting with this model.

// REFACTORING CANDIDATE: Need to think about the purpose and implementation of the hash_fragment attribute

Epub.EPUBController = Backbone.Model.extend({

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize: function() {

		// capture context for use in callback functions
		var that = this;

		this.epub = this.get("epub");
        
        this.set("media_overlay_controller", 
            new Epub.MediaOverlayController({epubController : this}));

		if (this.get("two_up") != null) {
			console.log("Legacy record with two_up: " + this.get("two_up"));
			// older item, definitely non-scrolling
			this.set("pagination_mode", !!this.get("two_up") ? "facing" : "single");
		} else {
			this.updatePaginationSettings();
		}

		// create a [`Paginator`](/docs/paginator.html) object used to initialize
		// pagination strategies for the spine items of this book
		this.paginator = new Epub.PaginationStrategySelector({book: this});

		// Get the epub package document
		this.packageDocument = this.epub.getPackageDocument();

		// TODO: this might have to change: Should this model load the package document or epub_state??
		// load the `packageDocument` from the HTML5 filesystem asynchroniously
		this.packageDocument.fetch({

			// success callback is executed once the filesSystem contents have 
			// been read and parsed
			success: function() {

				// restore the position the reader left off at from cookie storage
				var pos = that.restorePosition();
				that.set("spine_position", pos);

				// tell the paginator to start rendering spine items from the 
				// freshly restored position
				var items = that.paginator.renderSpineItems(false);
				that.set("rendered_spine_items", items);
				
				// check if a TOC is specified in the `packageDocument`
				that.set("has_toc", ( !!that.packageDocument.getTocItem() ) );
			}
		});

        // To maintain convenience for existing code, pagination_mode
        // changes automagically set two_up attribute 
		this.on("change:pagination_mode", this.updatePaginationSettings, this);

        // `change:spine_position` is triggered whenver the reader turns pages
		// accross a `spine_item` boundary. We need to cache thier new position
		// and 
		this.on("change:spine_position", this.savePosition, this);

		// If we encounter a new fixed layout section, we need to parse the 
		// `<meta name="viewport">` to determine the size of the iframe
		this.on("change:spine_position", this.setMetaSize, this);
	},

	// Description: Persists the attributes of this model
	// Arguments (
	//   attrs: doesn't appear to be used
	//   options: 
	//	)
	// Rationale: Each epub unpacked and saved to the filesystem in Readium has a unique
	//   key. "_epubViewProperties" is appended to this unique key to persist the read/write
	//   attributes separately from the read-only attributes of the epub.
	save: function(attrs, options) {
		// TODO: this should be done properly with a backbone sync
		var ops = {
			success: function() {
			}
		}
		_.extend(ops,options);
		var that = this;

		// Set attributes required to persist the epub-specific viewer properties
		this.set("updated_at", new Date());
		this.set("key", this.epub.get("key") + "_epubViewProperties");

		// Persist viewer properties
		Lawnchair(function() {
			this.save(that.toJSON(), ops.success);
		});
	},

	defaults: {
		"font_size": 10,
		"pagination_mode": "single",
    	"full_screen": false,
    	"toolbar_visible": true,
    	"toc_visible": false,
    	"rendered_spine_items": [],
    	"current_theme": "default-theme",
    	"current_margin": 3,
    	"epubCFIs" : {}
  	},

  	// Description: serialize this models state to `JSON` so that it can
  	//   be persisted and restored
  	toJSON: function() {

  		// only save attrs that should be persisted:
  		return {
			"updated_at": this.get("updated_at"),
			"current_theme": this.get("current_theme"),
			"current_margin": this.get("current_margin"),
			"pagination_mode": this.get("pagination_mode"),
			"font_size": this.get("font_size"),
			"key": this.get("key"),
			"epubCFIs" : this.get("epubCFIs")
		};
	},

	updatePaginationSettings: function() {
		if (this.get("pagination_mode") == "facing") {
			this.set("two_up", true);
		} else {
			this.set("two_up", false);
		}
	},

	toggleFullScreen: function() {
		var fullScreen = this.get("full_screen");
		this.set({full_screen: !fullScreen});
	},

	increaseFont: function() {
		var size = this.get("font_size");
		this.set({font_size: size + 1})
	},

	decreaseFont: function() {
		var size = this.get("font_size");
		this.set({font_size: size - 1})
	},

	toggleToc: function() {
		var vis = this.get("toc_visible");
		this.set("toc_visible", !vis);
	},

	// Description: Obtains the href and hash (if it exists) to set as the current "position"
	//    of the epub. Any views and models listening to epub attributes are informed through
	//    the backbone event broadcast.
	// Arguments (
	//   href (URL): The url and hash fragment that indicates the position in the epub to set as
	//   the epub's current position. This argument either has to be the absolute path of the resource in 
	//   the filesystem, or the path of the resource RELATIVE to the package document.
	//   When a URI is resolved by the package document model, it assumes that any relative path for a resource is
	//   relative to the package document.
	// )
	goToHref: function(href) {
		// URL's with hash fragments require special treatment, so
		// first thing is to split off the hash frag from the rest
		// of the url:
		var splitUrl = href.match(/([^#]*)(?:#(.*))?/);

		// Check if the hash contained a CFI reference
		if (splitUrl[2] && splitUrl[2].match(/epubcfi/)) {

			this.handleCFIReference(splitUrl[2]);
		}
		// The href is a standard hash fragment
		else {

			// REFACTORING CANDIDATE: Move this into its own "private" method
			if(splitUrl[1]) {
				var spine_pos = this.packageDocument.spineIndexFromHref(splitUrl[1]);

				if (this.get("media_overlay_controller").mo &&
					this.get("media_overlay_controller").mo.get("has_started_playback")) {
					
					this.setSpinePos(spine_pos, false, false, splitUrl[2]);
				}
				else {
					this.setSpinePos(spine_pos, false, true, splitUrl[2]);	
				}	

				this.set("hash_fragment", splitUrl[2]);
			}
		}
	},

	getToc: function() {
		var item = this.packageDocument.getTocItem();
		if(!item) {
			return null;
		}
		else {
			var that = this;
			return Epub.Toc.getToc(item, {
				file_path: that.resolvePath(item.get("href")),
				book: that
			});
		}
	},

	// Note: "Section" actually refers to a spine item
	getCurrentSection: function(offset) {
		if(!offset) {
			offset = 0;
		}
		var spine_pos = this.get("spine_position") + offset;
		return this.packageDocument.getSpineItem(spine_pos);
	},

	// REFACTORING CANDIDATE: this should be renamed to indicate it applies to the entire epub.
	//   This is only passing through this data to avoid breaking code in viewer.js. Eventually
	//   this should probably be removed. 
	isFixedLayout: function() {
		return this.epub.isFixedLayout();
	},

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	// Description: Returns a text version of the EPUBs package document.
	// Rationale: The AJAX call is implemented as a synchronous request 
	getPackageDocumentDOM : function () {

		var packageDocument;
		var packageDocumentUrl;

		// Rationale: The root_url attribute is set if the persistence is client-side, using the Filesystem API. Otherwise
		//   this attribute is undefined, which means the url specified with package_doc_path should be used to obtain the 
		//   package document.
		if (this.epub.get("root_url")) {
			packageDocumentUrl = this.epub.get("root_url");
		}
		else {
			packageDocumentUrl = this.epub.get("package_doc_path");
		}

		$.ajax({
			type: "GET",
			url: packageDocumentUrl,
			dataType: "xml",
			async: false,
			success: function (response) {

				packageDocument = response;
			}
		});

		return packageDocument;
	},


	handleCFIReference : function (CFI) {

		var packageDocument;
		var hrefOfFirstContentDoc;
		var spinePos;
		var elementId;

		packageDocument = this.getPackageDocumentDOM();

		// get the href of the first content document
		hrefOfFirstContentDoc = EPUBcfi.Interpreter.getContentDocHref(CFI, packageDocument);

		// get the spine position of the content document and add the cfi to the current list, set the spine position
		spinePos = this.packageDocument.spineIndexFromHref(hrefOfFirstContentDoc);

		// Generate an element id from the CFI
		// REFACTORING CANDIDATE: There is no need for this to be a cryptographic hash function. It was chosen 
		//   because the Crypto library was already part of Readium. All that is required here is a unique id
		//   for injected elements. 
		var elementId = Crypto.SHA1(CFI);

		this.addCFIwithPayload(CFI, spinePos, "<span id='" + elementId + "' class='cfi_marker' data-cfi='" + CFI + "'></span>");
		this.setSpinePos(spinePos, false, true, elementId);
		this.set("hash_fragment", elementId);
	},

	restorePosition: function() {
		var pos = Readium.Utils.getCookie(this.epub.get("key"));
		return parseInt(pos, 10) || this.packageDocument.getNextLinearSpinePostition();
	},

	savePosition: function() {
		Readium.Utils.setCookie(this.epub.get("key"), this.get("spine_position"), 365);
	},

	resolvePath: function(path) {
		return this.packageDocument.resolvePath(path);
	},

	hasNextSection: function() {
		var start = this.get("spine_position");
		return this.packageDocument.getNextLinearSpinePostition(start) > -1;
	},

	hasPrevSection: function() {
		var start = this.get("spine_position");
		return this.packageDocument.getPrevLinearSpinePostition(start) > -1;
	},
	
	// goes the next linear section in the spine. Non-linear sections should be
	// skipped as per [the spec](http://idpf.org/epub/30/spec/epub30-publications.html#sec-itemref-elem)
	// REFACTORING CANDIDATE: I think this is a public method and should be moved to the public section
	goToNextSection: function() {

		var cp = this.get("spine_position");
		var pos = this.packageDocument.getNextLinearSpinePostition(cp);
		if(pos > -1) {
			this.setSpinePos(pos, false, false);
		}
	},
	
	// goes the previous linear section in the spine. Non-linear sections should be
	// skipped as per [the spec](http://idpf.org/epub/30/spec/epub30-publications.html#sec-itemref-elem)
	// REFACTORING CANDIDATE: I think this is a public method and should be moved to the public section
	goToPrevSection: function() {
		var cp = this.get("spine_position");
		var pos = this.packageDocument.getPrevLinearSpinePostition(cp);
		if(pos > -1) {
			this.setSpinePos(pos, true, false);
		}
	},

	// Description: Sets the current spine position for the epub, checking if the spine
	//   item is already rendered. 
	// Arguments (
	//	 pos (integer): The index of the spine element to set as the current spine position
	//   goToLastPageOfSection (boolean): Set the viewer to the last page of the spine item (content document/svg)
	//     that will be loaded.
	//   reRenderSpinePos (boolean): Force the spine item to be re-rendered, regardless of whether it is the 
	//     currently set spine item.
	//   goToHashFragmentId: Set the view position to the element with the specified id. This parameter 
	//     overrides the behaviour of "goToLastPageOfSection"
	//	)
	// REFACTORING CANDIDATE: The abstraction here is getting sloppy, as goToHashFragmentId overrides goToLastPageOfSection
	//   and generally, the behaviour of this method is not entirely clear from its name. Perhaps a simple renaming of the
	//   method would suffice? Additionally, the internal impementation could be reviewed to tightened up (comments below).
	setSpinePos: function(pos, goToLastPageOfSection, reRenderSpinePos, goToHashFragmentId) {

		// check for invalid spine position
		if (pos < 0 || pos >= this.packageDocument.spineLength()) {
			
			return;
		}

		var spineItems = this.get("rendered_spine_items");
		var spinePosIsRendered = spineItems.indexOf(pos) >=0 ? true : false;
		var renderedItems;

		// REFACTORING CANDIDATE: There is a somewhat hidden dependency here between the paginator
		//   and the setting of the spine_position. The pagination strategy selector re-renders based on the currently
		//   set spine_position on this model. The pagination strategy selector has a reference to this model, which is 
		//   how it accesses the new spine_position, through the "getCurrentSection" method. 
		//   This would be clearer if the spine_position to set were passed explicitly to the paginator. 
		this.set("spine_position", pos);

		// REFACTORING CANDIDATE: This event should only be triggered for fixed layout sections
		this.trigger("FXL_goToPage");

		// Render the new spine position if it is not already rendered. Otherwise, check if a re-render should
		// be forced (in case a new CFI has to be injected, for example). 
		if (!spinePosIsRendered) {

			renderedItems = this.paginator.renderSpineItems(goToLastPageOfSection, goToHashFragmentId);
			this.set("rendered_spine_items", renderedItems);
		}
		else {

			if (reRenderSpinePos) {

				this.removeLastPageCFI();
				renderedItems = this.paginator.renderSpineItems(goToLastPageOfSection, goToHashFragmentId);
				this.set("rendered_spine_items", renderedItems);				
			}
			else {

				if (!this.isFixedLayout() && goToHashFragmentId) {
					this.paginator.v.goToHashFragment(goToHashFragmentId);
				}
			}
		}
	},

	setMetaSize: function() {

		if(this.meta_section) {
			this.meta_section.off("change:meta_height", this.setMetaSize);
		}
		this.meta_section = this.getCurrentSection();
		if(this.meta_section.get("meta_height")) {
			this.set("meta_size", {
				width: this.meta_section.get("meta_width"),
				height: this.meta_section.get("meta_height")
			});
		}
		this.meta_section.on("change:meta_height", this.setMetaSize, this);
	},

	// REFACTORING CANDIDATE: The methods related to maintaining a hash of cfi information and payloads
	//   will likely be refactored into its own backbone object.
	addCFIwithPayload : function (CFI, spinePosition, htmlPayload, bodyType) {

		var cfiPayload = { contentDocSpinePos : spinePosition, payload : htmlPayload, type : bodyType };
		this.get("epubCFIs")[CFI] = cfiPayload;
	},

	addLastPageCFI : function (CFI, spinePosition) {

		// Create last page marker
		var elementId = Crypto.SHA1(CFI);
		var marker = "<span id='" + elementId + "' data-last-page-cfi='" + CFI + "' class='cfi-marker last-page'></span>";

		// Create payload
		var cfiPayload = { contentDocSpinePos : spinePosition, payload : marker, type : "last-page" };

		// Check if a last page marker already exists
		var CFIPayloads = this.get("epubCFIs");

		// Check every CFI payload for a "last-page" type, in case more than one exists
		$.each(CFIPayloads, function (currCFI, payloadObject) {

			if (this.type === "last-page") {
				delete CFIPayloads[currCFI]
			}
		});

		// Add the new last page marker
		this.get("epubCFIs")[CFI] = cfiPayload;	
		this.save();
	},

	removeLastPageCFI : function () {

		var activeCFIs = this.get("epubCFIs");
		$.each(activeCFIs, function (currCFI, payloadObject) {

			if (this.type === "last-page") {
				delete activeCFIs[currCFI];
			}
		});
	}
});
