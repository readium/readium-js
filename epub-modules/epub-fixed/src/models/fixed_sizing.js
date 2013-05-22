EpubFixed.FixedSizing = Backbone.Model.extend({

    metaSize : {
        width : undefined,
        height : undefined
    },

    initialize : function (attributes) {},

    // ------------------ PUBLIC INTERFACE ---------------------------------

    updateMetaSize : function () {

        var $img;
        var contentDocument = this.get("contentDocument");

        // first try to read viewport size
        var content = $('meta[name=viewport]', contentDocument).attr("content");

        // if not found try viewbox (used for SVG)
        if (!content) {
            content = $('meta[name=viewbox]', contentDocument).attr("content");
        }

        if (content) {
            var size = this.parseSize(content);
            if (size) {
                this.metaSize.width = size.width;
                this.metaSize.height = size.height;
            }
        }
        else { //try to get direct image size

            if ($(contentDocument).is("IMG")) {
                $img = $(contentDocument);
            }
            else {
                $img = $(contentDocument).find('img');
            }
            var width = $img.width();
            var height = $img.height();

            if (width > 0) {
                this.metaSize.width = width;
                this.metaSize.height = height;
            }
        }
    },

    fitToScreen : function (containerWidth, containerHeight) {

        var bookSize = this.metaSize;
        if (bookSize.width == 0) {
            return;
        }

        var horScale = containerWidth / bookSize.width;
        var verScale = containerHeight / bookSize.height;

        var scale = Math.min(horScale, verScale);

        var css = this.generateTransformCSS(scale);
        css["width"] = bookSize.width;
        css["height"] = bookSize.height;

        return css;
    },

    // --------------------------- PRIVATE HELPERS -------------------------------------

    parseSize : function (content) {

        var pairs = content.replace(/\s/g, '').split(",");
        var dict = {};
        var width;
        var height;

        for (var i = 0; i < pairs.length; i++) {

            var nameVal = pairs[i].split("=");
            if (nameVal.length === 2) {
                dict[nameVal[0]] = nameVal[1];
            }
        }

        width = Number.NaN;
        height = Number.NaN;

        if (dict["width"]) {
            width = parseInt(dict["width"]);
        }

        if (dict["height"]) {
            height = parseInt(dict["height"]);
        }

        if (!isNaN(width) && !isNaN(height)) {
            return { 
                width : width, 
                height : height
            };
        }

        return undefined;
    },

    // Have to modernizer this
    generateTransformCSS : function (scale) {

        var transformString = "scale(" + scale + ")";

        //modernizer library can be used to get browser independent transform attributes names (implemented in readium-web fixed_layout_book_zoomer.js)
        var css = {};
        css["-webkit-transform"] = transformString;
        return css;
    }
});