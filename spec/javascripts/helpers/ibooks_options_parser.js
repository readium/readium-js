// an object for parsing apples proprietary `com.apple.ibooks.display-options.xml`
Readium.Models.IbooksOptionsParser = function() {
	// constructor doesn't actually do anything
};

// convert a string boolean into an actual bool type
Readium.Models.IbooksOptionsParser.prototype.parseBool = function(str) {
	return str.toLowerCase().trim() === 'true';
};

// parse the xml content and return a json object
Readium.Models.IbooksOptionsParser.prototype.parse = function(content) {
	
	var parser, xmlDoc, fixedLayout, openToSpread, res;

	// parse the xml content
	parser = new window.DOMParser();
	xmlDoc = parser.parseFromString(content, "text/xml");

	// grab the attributes that we actually use
	fixedLayout = xmlDoc.getElementsByName("fixed-layout")[0];
	openToSpread = xmlDoc.getElementsByName("open-to-spread")[0];

	res = {};
	res.open_to_spread = !!openToSpread && this.parseBool(openToSpread.textContent);
	// we set both these properties based on the same thing:
	// (an `apple_fixed` IS A `fixedLayout`)
	res.fixedLayout = !!fixedLayout && this.parseBool(fixedLayout.textContent);
	res.apple_fixed = !!fixedLayout && this.parseBool(fixedLayout.textContent);
	return res;
};