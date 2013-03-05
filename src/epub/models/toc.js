Epub.Toc = Backbone.Model.extend({

	sync: BBFileSystemSync,

	initialize: function(options) {
		this.file_path = options.file_path;
		this.book = options.book;
		this.book.on("change:toc_visible", this.setVisibility, this);
		this.book.on("change:toolbar_visible", this.setTocVis, this);
	},

	// Rationale: Readium expects that any hrefs to EPUB content are either absolute references or references to the content relative
	//   to the EPUBs package document. Since any href passed to this method is specified as either absolute (in which case we 
	//   don't need to worry) or as relative to the nav document (where the click was generated, as this is the toc), we need
	//   to construct an absolute path from that.
	handleLink: function(href) {

		var TOCHref = this.book.packageDocument.getTocItem().get("href");

		// If toc is in the same folder as the package document, use the href straight
		if (TOCHref.indexOf("/") === -1) {

			this.book.goToHref(href);	
		}
		// If the href target is in a child folder of the toc folder, create the relative URI
		// If the href target is in a parent folder of the toc folder, this will fail, for now.
		else {

			var TOC_URI = new URI(TOCHref);
			var targetHrefURI = new URI(href);

			// Use the TOC path, relative to the package document to create an href for the target resource which will also be relative
			//   to the package document (or absolute, if the href for the TOC was absolute).
			href = targetHrefURI.resolve(TOC_URI).toString();
			this.book.goToHref(href);
		}
	},

	setVisibility: function() {
		this.set("visible", this.book.get("toc_visible"));
	},

	hide: function() {
		this.book.set("toc_visible", false)
	},

	setTocVis: function() {
		if(!this.book.get("toolbar_visible")) {
			this.book.set("toc_visible", false);
		}
	},

	defaults: {
		visible: false
	}

}, {
	// Class Level Attributes!
	XHTML_MIME: "application/xhtml+xml",
	XML_MIME: "text/xml",	
	NCX_MIME: "application/x-dtbncx+xml",
	getToc: function(manItem, options) {
		var media_type = manItem.get("media_type");
		if(media_type === Epub.Toc.XHTML_MIME || 
				media_type === Epub.Toc.XML_MIME) {
			return new Epub.XhtmlToc(options);
		}
		else if (media_type ===  Epub.Toc.NCX_MIME) {
			return new Epub.NcxToc(options);
		}
	}
});




