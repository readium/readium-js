EpubFixed.FixedPageView = Backbone.View.extend({

    el : "<div class='fixed-page-wrapper' style='height:100%;'> \
            <iframe scrolling='no' \
                    frameborder='0' \
                    marginwidth='0' \
                    marginheight='0' \
                    style='height:100%;width:100%;' \
                    class='fixed-content'> \
            </iframe> \
          </div>",

    metaSize : {

        height : undefined,
        width : undefined
    },

    initialize : function (options) {

        this.zoomer; // Gotta put a zoomer in here to figure some shit out
        this.pageSpread = options.pageSpread;
        this.iframeSrc = options.iframeSrc;
        this.setSyntheticPageSpreadStyle();
    },

    render : function () {

        var that = this;
        this.get$iframe().attr("src", this.iframeSrc);
        this.get$iframe().on("load", function () {

            // this.injectLinkHandler(e.srcElement);
            // that.applyKeydownHandler($(view.iframe()));
            that.updateMetaSize();
            that.fitToScreen();
            that.trigger("contentDocumentLoaded");
        });
        
        return this.el;
    },

    get$iframe : function () {
        return $("iframe", this.$el);
    },

    hidePage : function () {
        this.$el.hide();
    },

    showPage : function () {
        this.$el.show();
    },

    setSinglePageSpreadStyle : function () {

        this.$el.css({
            "position" : "absolute",
            "overflow" : "hidden",
            "height" : "100%",
            "width" : "50%",
            "left" : "25%"
        });
        this.updateMetaSize();
        this.fitToScreen();
    },

    setSyntheticPageSpreadStyle : function () {

        var pageSpread = this.pageSpread;
        if (pageSpread === "left") {
            this.$el.css({ 
                "position" : "absolute",
                "overflow" : "hidden",
                "height" : "100%",
                "width" : "50%", 
                "left" : "0%",
                "background-color" : "#FFF"
            });
        }
        else if (pageSpread === "right") {
            this.$el.css({ 
                "position" : "absolute",
                "overflow" : "hidden",
                "height" : "100%",
                "width" : "50%", 
                "left" : "50%",
                "background-color" : "#FFF" 
            });
        }
        else if (pageSpread === "center") {
            this.$el.css({
                "position" : "absolute",
                "overflow" : "hidden", 
                "height" : "100%",
                "width" : "100%",
                "left" : "50%",
                "z-index" : "11",
                "background-color" : "#FFF" 
            });
        }

        this.updateMetaSize();
        this.fitToScreen();

    // left: 25%;
    // @include box-shadow(0 0 5px 5px rgba(80,80,80,0.5));
    },

    updateMetaSize : function () {

        var contentDocument = $("iframe", this.el)[0].contentDocument;
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

            var $img = $(contentDocument).find('img');
            var width = $img.width();
            var height = $img.height();

            if (width > 0) {
                this.metaSize.width = width;
                this.metaSize.height = height;
            }
        }
    },

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

    fitToScreen : function () {

        var bookSize = this.metaSize;
        if (bookSize.width == 0) {
            return;
        }

        var containerWidth = this.$el.width();
        var containerHeight = this.$el.height();

        var horScale = containerWidth / bookSize.width;
        var verScale = containerHeight / bookSize.height;

        var scale = Math.min(horScale, verScale);

        var newWidth = bookSize.width * scale;
        var newHeight = bookSize.height * scale;

        var left = Math.floor((containerWidth - newWidth) / 2);
        var top = Math.floor((containerHeight - newHeight) / 2);

        var css = this.generateTransformCSS(left, top, scale);
        css["width"] = bookSize.width;
        css["height"] = bookSize.height;

        this.$el.css(css);
    },

    // Have to modernizer this
    generateTransformCSS : function (left, top, scale) {

        var transformString = "translate(" + left + "px, " + top + "px) scale(" + scale + ")";

        //modernizer library can be used to get browser independent transform attributes names (implemented in readium-web fixed_layout_book_zoomer.js)
        var css = {};
        css["-webkit-transform"] = transformString;
        css["-webkit-transform-origin"] = "0 0";

        return css;
    }


    // setContainerSize : function () {
        
    //     // var meta = this.model.get("meta_size");

    //     // if (meta) {

    //     //     this.$el.width(meta.width * 2);
    //     //     this.$el.height(meta.height);
    //         this.zoomer.fitToBest();

    //         // if (!this.zoomed) {

    //         //     this.zoomed = true;
    //         //     // setTimeout(function() {
    //         //     //  $('#page-wrap').zoomAndScale(); //<= this was a little buggy last I checked but it is a super cool feature
    //         //     // }, 1)    
    //         // }
    //     // }
    // }
});