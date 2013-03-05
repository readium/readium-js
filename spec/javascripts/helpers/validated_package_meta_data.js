// Used to validate a freshly unzipped package doc. Once we have 
// validated it one time, we don't care if it is valid any more, we
// just want to do our best to display it without failing
Readium.Models.ValidatedPackageMetaData = Backbone.Model.extend({

	initialize: function(attributes) {
		this.file_path = attributes.file_path;		
		this.uri_obj = new URI(attributes.root_url);
		this.set("package_doc_path", this.file_path);
    },

	validate: function(attrs) {

	},

	// for ease of use call parse before we set the attrs
	reset: function(data) {
		var attrs = this.parse(data);
		this.set(attrs);
	},

	defaults: {
		fixed_layout: false, // default to fixed layout or reflowable format
		apple_fixed: false, // is this file Apple's spec
		open_to_spread: false, // specific to Apple, should two up be allowed?
		cover_href: '/images/library/missing-cover-image.png', // default to no cover image
		created_at: new Date(), // right now
		updated_at: new Date(), // right now
		paginate_backwards: false
	},

	// Apple created its own fixed layout spec for ibooks.
	// this function parses the metadata used by this spec
	parseIbooksDisplayOptions: function(content) {
		var parser, result;
		parser = new Readium.Models.IbooksOptionsParser();
		result = parser.parse(content);
		this.set(result);
	},

	parse: function(xmlDom) {
		// parse the xml
		var parser = new Readium.Models.PackageDocumentParser(this.uri_obj);
		var json = parser.parse(xmlDom);
		// capture the manifest separately
		this.manifest = json.manifest;
		return json.metadata;
	},

	save: function(attrs, options) {
		// TODO: this should be done properly with a backbone sync
		var that = this;
		this.set("updated_at", new Date());
		Lawnchair(function() {
			this.save(that.toJSON(), options.success);
		});
	},

	// TODO: confirm this needs to be here
	resolveUri: function(rel_uri) {
		uri = new URI(rel_uri);
		return uri.resolve(this.uri_obj).toString();
	},

	// TODO: confirm this needs to be here
	// reslove a relative file path to relative to this the
	// the path of this pack docs file path
	resolvePath: function(path) {
		var suffix;
		var pack_doc_path = this.file_path;
		if(path.indexOf("../") === 0) {
			suffix = path.substr(3);
		}
		else {
			suffix = path;
		}
		var ind = pack_doc_path.lastIndexOf("/")
		return pack_doc_path.substr(0, ind) + "/" + suffix;
	}
});