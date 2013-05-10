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

    initialize : function (options) {

        this.sizing; 
        this.pageSpread = options.pageSpread;
        this.iframeSrc = options.iframeSrc;
        this.setSyntheticPageSpreadStyle();
    },

    render : function () {

        var that = this;
        this.get$iframe().attr("src", this.iframeSrc);
        this.get$iframe().on("load", function () {

            that.sizing = new EpubFixed.FixedSizing({ contentDocument : $("iframe", that.el)[0].contentDocument });
            // this.injectLinkHandler(e.srcElement);
            // that.applyKeydownHandler($(view.iframe()));
            that.setPageSize();
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

        var transformCss;
        this.$el.css({
            "position" : "absolute",
            "overflow" : "hidden",
            "height" : "100%",
            "width" : "50%",
            "left" : "25%"
        });

        this.setPageSize();
    },

    setSyntheticPageSpreadStyle : function () {

        var pageSpread = this.pageSpread;
        var transformCss;
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
        
        this.setPageSize();
    // @include box-shadow(0 0 5px 5px rgba(80,80,80,0.5));
    },

    setPageSize : function () {

        if (this.sizing !== undefined) {

            var transformCss;
            this.sizing.updateMetaSize();
            transformCss = this.sizing.fitToScreen(this.$el.width(), this.$el.height());
            this.$el.css(transformCss);
        }
    }
});