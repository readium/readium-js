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

        this.zoomer; // Gotta put a zoomer in here to figure some shit out
        this.pageSpread = options.pageSpread;
        this.iframeSrc = options.iframeSrc;
        this.setPageSpreadStyle(this.pageSpread);
    },

    render : function () {

        var that = this;
        this.get$iframe().attr("src", this.iframeSrc);
        this.get$iframe().on("load", function () {

            // this.injectLinkHandler(e.srcElement);
            // that.applyKeydownHandler($(view.iframe()));
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

    setPageSpreadStyle : function (pageSpread) {

        if (pageSpread === "left") {
            this.$el.css({ 
                "position" : "absolute",
                "overflow" : "hidden",
                "width" : "50%", 
                "left" : "0%",
                "background-color" : "#FFF" 
            });
        }
        else if (pageSpread === "right") {
            this.$el.css({ 
                "position" : "absolute",
                "overflow" : "hidden",
                "width" : "50%", 
                "left" : "50%",
                "background-color" : "#FFF" 
            });
        }
        else if (pageSpread === "center") {
            this.$el.css({
                "position" : "absolute",
                "overflow" : "hidden", 
                "z-index" : "11",
                "background-color" : "#FFF" 
            });
        }

    // left: 25%;
    // @include box-shadow(0 0 5px 5px rgba(80,80,80,0.5));
    },

    setContainerSize : function () {
        
        // var meta = this.model.get("meta_size");

        // if (meta) {

        //     this.$el.width(meta.width * 2);
        //     this.$el.height(meta.height);
            this.zoomer.fitToBest();

            // if (!this.zoomed) {

            //     this.zoomed = true;
            //     // setTimeout(function() {
            //     //  $('#page-wrap').zoomAndScale(); //<= this was a little buggy last I checked but it is a super cool feature
            //     // }, 1)    
            // }
        // }
    }
});