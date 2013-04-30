// Fixed layout books may have pages that are bigger of smaller than allowed 
// by the viewport. Thus we need to scale the book holding `div` in order to
// if the book to the screen.
Readium.Views.FixedLayoutBookZoomer = Backbone.View.extend({

	el: "#readium-right-content",

	// total amount of space to leave around the pages after calling
	// `fitToWidth` / `fitToHeight`
	horizontalPad: 30,
	verticalPad: 30,

	initialize: function() {
		this.zoomingModel = new Readium.Models.FixedLayoutBookZoomingModel();
	},

	/* ------------------------------------------------------------------------------------ */
  	//  "PUBLIC" METHODS (THE API)                                                          //
  	/* ------------------------------------------------------------------------------------ */

	// apply the current transformations held in this views `BookZoomingModel` to
	// the `el`
	render: function() {
		this.$("#page-wrap").css(this.zoomingModel.getCSSProperties());
		return this;
	},

	// remove any tranformations that have been applied to this `el`
	reset: function() {
		this.zoomingModel.setDefaults();
		this.render();
	},

	// apply the minimum scalar transormation to the div wrapping this books pages
	// in order to have all content displayed 
	fitToBest: function() {
		var widthScale = this.fitToWidthScale();
		var heightScale = this.fitToHeightScale();

		if(widthScale < heightScale) {
			this.applyScale(widthScale);
		}
		else {
			this.applyScale(heightScale);
		}
	},

	// apply transformations that fit the books pages as best as possible linearly
	fitToWidth: function() {
		var scale = this.fitToWidthScale();
		this.applyScale(scale);
	},

	// apply transformations that fit the books pages as best as possible veritcally
	fitToHeight: function() {
		var scale = this.fitToHeightScale();
		this.applyScale(scale);
	},

	
	/* ------------------------------------------------------------------------------------ */
	//  "PRIVATE" HELPERS                                                                   //
	/* ------------------------------------------------------------------------------------ */

	fitToWidthScale: function() {
		return (this.containerWidth() - this.horizontalPad) / this.bookWidth();
	},

	fitToHeightScale: function() {
		return (this.containerHeight() - this.verticalPad) / this.bookHeight();
	},

	applyScale: function(scale) {
		this.zoomingModel.set("scale", scale);
		this.zoomingModel.set("leftShift", this.leftShift(scale));
		this.zoomingModel.set("topShift", this.verticalPad / 2);
		this.render();
	},

	// calculate the amount of left shift required to center the book's pages
	// after applying a given scale transormation
	leftShift: function(scale) {
		var width = this.containerWidth();
		return (width - (this.bookWidth() * scale)) / 2;
	},

	containerWidth: function() {
		return this.$el.width();
	},

	containerHeight: function() {
		return this.$el.height() ;
	},

	bookWidth: function() {
		return this.$("#page-wrap").width();
	},

	bookHeight: function() {
		return this.$("#page-wrap").height();
	}

});


Readium.Models.FixedLayoutBookZoomingModel = Backbone.Model.extend({

	initialize: function() {

		// get the browser vendor prefixed attrs one time, rather than
		// every time we render
		this.styleAttrs = this.getModernizedAttrs();

	},

	defaults: {
		scale: 1,
		leftShift: 0,
		topShift: 0
	},

	setDefaults: function() {
		this.set(this.defaults);
	},

	getModernizedAttrs: function() {
		var attrs = {};
		attrs.transform = this.modernizrCssPrefix("transform");
		attrs.transformOrigin = this.modernizrCssPrefix("transformOrigin");
		return attrs;
	},

	modernizrCssPrefix: function(attr) {
		var str = Modernizr.prefixed(attr);
		return str.replace(/([A-Z])/g, function(str, m1){ 
			return '-' + m1.toLowerCase(); 
		}).replace(/^ms-/,'-ms-');
	},


	getCSSProperties: function() {
		var css = {};
		css[this.styleAttrs.transform] = this.getTransformString();
		css[this.styleAttrs.transformOrigin] = "0 0";
		return css;
	},

	getTransformString: function() {

		str  = "";
		str += "translate(" + this.get("leftShift") + "px, " + this.get("topShift") + "px) ";
		str += "scale(" + this.get("scale").toString() + ")";
		return str;
	}

});
