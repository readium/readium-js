
Epub.ManifestItem = Backbone.Model.extend({
	
	parseMetaTags: function() {
		 var pageSize;
		// only need to go through this one time, so only parse it
		// if it is not already known
		if(typeof this.get("meta_width") !== "undefined") {
			return;
		}

		if(this.isSvg()) {
			pageSize = this.parseViewboxTag();
		}
		else if(!this.isImage()) {
			pageSize = this.parseViewportTag();
		}

		if(pageSize) {
			this.set({"meta_width": pageSize.width, "meta_height": pageSize.height});
		}
	},

	getContentDom: function() {
		var content = this.get('content');
		if(content) {
			var parser = new window.DOMParser();
			return parser.parseFromString(content, 'text/xml');
		}
	},

	// for fixed layout xhtml we need to parse the meta viewport
	// tag to determine the size of the pages. more info in the 
	// [fixed layout spec](http://idpf.org/epub/fxl/#dimensions-xhtml-svg)
	parseViewportTag: function() {
		var dom = this.getContentDom();
		if(!dom) {
			return;
		}
		var viewportTag = $("[name='viewport']", dom)[0];
		if(!viewportTag) {
			return null;
		}
		// this is going to be ugly
		var str = viewportTag.getAttribute('content');
		str = str.replace(/\s/g, '');
		var valuePairs = str.split(',');
		var values = {};
		var pair;
		for(var i = 0; i < valuePairs.length; i++) {
			pair = valuePairs[i].split('=');
			if(pair.length === 2) {
				values[ pair[0] ] = pair[1];
			}
		}
		values['width'] = parseFloat(values['width'], 10);
		values['height'] = parseFloat(values['height'], 10);
		return values;
	},

	// for fixed layout svg we need to parse the viewbox on the svg
	// root tag to determine the size of the pages. more info in the 
	// [fixed layout spec](http://idpf.org/epub/fxl/#dimensions-xhtml-svg)
	parseViewboxTag: function() {

		// The value of the ‘viewBox’ attribute is a list of four numbers 
		// `<min-x>`, `<min-y>`, `<width>` and `<height>`, separated by 
		// whitespace and/or a comma
		var dom = this.getContentDom();
		if(!dom) {
			return;
		}
		var viewboxString = dom.documentElement.getAttribute("viewBox");
		// split on whitespace and/or comma
		var valuesArray = viewboxString.split(/,?\s+|,/);
		var values = {};
		values['width'] = parseFloat(valuesArray[2], 10);
		values['height'] = parseFloat(valuesArray[3], 10);
		return values;

	},

	resolvePath: function(path) {
		return this.collection.packageDocument.resolvePath(path)
	},

	resolveUri: function(path) {
		return this.collection.packageDocument.resolveUri(path)	
	},

	isSvg: function() {
		return this.get("media_type") === "image/svg+xml";
	},

	isImage: function() {
		var media_type = this.get("media_type");

		if(media_type && media_type.indexOf("image/") > -1) {
			// we want to treat svg as a special case, so they
			// are not images
			return media_type !== "image/svg+xml";
		}
		return false;
	},

	// Load this content from the filesystem
	loadContent: function() {
		var that = this;
		var path = this.resolvePath(this.get("href"));
		
		Readium.FileSystemApi(function(api) {
			api.readTextFile(path, function(result) {
				that.set( {content: result} );
			}, function() {
				console.log("Failed to load file: " + path);
			})
		});
	}
	
});







