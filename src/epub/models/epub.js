// Description: This model is responsible for the read-only attributes and content of an epub. 
// Rationale: This is designed as a model to represent the state of an epub as it is maintained by the Readium application.
//   As Readium does not have any authoring capabilities (a saved epub is not modified), this model essentially represents the 
//   epub in a read-only fashion (although this is not enforced).

Epub.EPUB = Backbone.Model.extend({

	defaults: {
    	"can_two_up": true
  	},

  	// ------------------------------------------------------------------------------------ //
  	//  "PUBLIC" METHODS (THE API)                                                          //
  	// ------------------------------------------------------------------------------------ //

	initialize: function() {

		// capture context for use in callback functions
		var that = this;

		// intantiate a [`PackageDocument`](/docs/packageDocument.html)
		this.packageDocument = new Epub.PackageDocument({ 
			book : this, 
			file_path : this.get("package_doc_path") 
			});
	},

	getPackageDocument: function () {

		return this.packageDocument;
	},

  	toJSON: function() {

  		// only save attrs that should be persisted:
  		return {
			"apple_fixed": this.get("apple_fixed"),
			"author": this.get("author"),
			"cover_href": this.get("cover_href"),
			"created_at": this.get("created_at"),
			"description": this.get("description"),
			"epub_version": this.get("epub_version"),
			"fixed_layout": this.get("fixed_layout"),
			"id": this.get("id"),
			"key": this.get("key"),
			"language": this.get("language"),
			"layout": this.get("layout"),
			"modified_date": this.get("modified_date"),
			"ncx": this.get("ncx"),
			"open_to_spread": this.get("open_to_spread"),
			"orientation": this.get("orientation"),
			"package_doc_path": this.get("package_doc_path"),
			"page_prog_dir": this.get("page_prog_dir"),
			"paginate_backwards": this.get("paginate_backwards"),
			"pubdate": this.get("pubdate"),
			"publisher": this.get("publisher"),
			"rights": this.get("rights"),
			"spread": this.get("spread"),
			"src_url": this.get("src_url"),
			"title": this.get("title")
		};
	},

	resolvePath: function(path) {
		return this.packageDocument.resolvePath(path);
	},

	// is this book set to fixed layout at the meta-data level
	isFixedLayout: function() {
		return this.get("fixed_layout") || this.get("apple_fixed");
	}
});
