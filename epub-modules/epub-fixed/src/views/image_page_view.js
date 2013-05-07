EpubFixed.ImagePageView = Backbone.View.extend({

    el : "<div class='fixed-page-wrapper' style='height:100%;'> \
            <img src='#'' alt=''/> \
          </div>",

    initialize : function (options) {

        this.pageSpread = options.pageSpread;
        this.imageSrc = options.imageSrc;
        this.setPageSpreadStyle(this.pageSpread);
    },

    render : function () {

        var that = this;
        $("img", this.$el).attr("src", this.imageSrc);
        this.$("img").on("load", function() { 

            // that.setSize(); 
            // that.injectLinkHandler();
            // that.applyKeydownHandler($(view.iframe()));
            // that.mediaOverlayController.pagesLoaded();
            that.trigger("contentDocumentLoaded");
        });

        return this.el;
    },

    // setSize: function() {
        
    //     var $img = this.$("img");
        
    //     var width = $img.width();
    //     var height = $img.height();

    //     // NOTE: Not entirely sure what to do with this meta width thing
    //     // temp this is a mess but it will do for now...
    //     // if (width > 0) {
    //     //     this.model.set({meta_width: width, meta_height: height})
    //     // }
    // },

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
                "height" : "100%",
                "left" : "0%",
                "background-color" : "#FFF" 
            });
        }
        else if (pageSpread === "right") {
            this.$el.css({ 
                "position" : "absolute",
                "overflow" : "hidden",
                "width" : "50%",
                "height" : "100%", 
                "left" : "50%",
                "background-color" : "#FFF" 
            });
        }
        else if (pageSpread === "center") {
            this.$el.css({
                "position" : "absolute",
                "overflow" : "hidden", 
                "height" : "100%",
                "left" : "25%",
                "z-index" : "11",
                "background-color" : "#FFF" 
            });
        }

    // left: 25%;
    // @include box-shadow(0 0 5px 5px rgba(80,80,80,0.5));
    }
});