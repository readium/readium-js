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

	initialize : function (attributes, options) {

		// capture context for use in callback functions
		var that = this;

        // this.set("media_overlay_controller", 
        //     new Epub.MediaOverlayController({epubController : this}));
				
		this.set("has_toc", ( !!that.packageDocument.getTocItem() ) );
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

    // toJSON: function() {

    //     // only save attrs that should be persisted:
    //     return {
    //         "apple_fixed": this.get("apple_fixed"),
    //         "author": this.get("author"),
    //         "cover_href": this.get("cover_href"),
    //         "created_at": this.get("created_at"),
    //         "description": this.get("description"),
    //         "epub_version": this.get("epub_version"),
    //         "fixed_layout": this.get("fixed_layout"),
    //         "id": this.get("id"),
    //         "key": this.get("key"),
    //         "language": this.get("language"),
    //         "layout": this.get("layout"),
    //         "modified_date": this.get("modified_date"),
    //         "ncx": this.get("ncx"),
    //         "open_to_spread": this.get("open_to_spread"),
    //         "orientation": this.get("orientation"),
    //         "package_doc_path": this.get("package_doc_path"),
    //         "page_prog_dir": this.get("page_prog_dir"),
    //         "paginate_backwards": this.get("paginate_backwards"),
    //         "pubdate": this.get("pubdate"),
    //         "publisher": this.get("publisher"),
    //         "rights": this.get("rights"),
    //         "spread": this.get("spread"),
    //         "src_url": this.get("src_url"),
    //         "title": this.get("title")
    //     };
    // },

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	resolvePath: function(path) {
		return this.packageDocument.resolvePath(path);
	},

	// REFACTORING CANDIDATE: I think this should get moved up to the epub controller
    resolveUri : function(rel_uri) {
        uri = new URI(rel_uri);
        return uri.resolve(this.uri_obj).toString();
    },

    // REFACTORING CANDIDATE: I think this should get moved up to the epub controller
    // reslove a relative file path to relative to this the
    // the path of this pack docs file path
    resolvePath : function(path) {
        var suffix;
        var pack_doc_path = this.file_path;
        if (path.indexOf("../") === 0) {
            suffix = path.substr(3);
        }
        else {
            suffix = path;
        }
        var ind = pack_doc_path.lastIndexOf("/")
        return pack_doc_path.substr(0, ind) + "/" + suffix;
    },

    // Hmmmmmmmmm..... maybe move this one up to the epub controller 
    spineIndexFromHref : function (href) {

        var spine = this.get("res_spine");
        href = this.resolveUri(href).replace(/#.*$/, "");
        for (var i = 0; i < spine.length; i++) {
            var path = spine.at(i).get("href");
            path = this.resolveUri(path).replace(/#.*$/, "");
            if(path === href) {
                return i;
            }
        }
        return -1;
    }
});
