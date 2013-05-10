EpubFixed.FixedPageView = Backbone.View.extend({

    el : "<div class='fixed-page-wrapper'> \
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
        this.styles = new EpubFixed.FixedLayoutStyle();
        this.pageSpread = options.pageSpread;
        this.iframeSrc = options.iframeSrc;
        this.setSyntheticPageSpreadStyle();
    },

    render : function () {

        var that = this;
        this.get$iframe().attr("src", this.iframeSrc);
        this.get$iframe().on("load", function () {

            that.sizing = new EpubFixed.FixedSizing({ contentDocument : that.get$iframe()[0].contentDocument });
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
        this.$el.css(this.styles.getSinglePageSpreadCSS());
        this.setPageSize();
    },

    setSyntheticPageSpreadStyle : function () {

        var pageSpread = this.pageSpread;
        var transformCss;
        if (pageSpread === "left") {
            this.$el.css(this.styles.getPageSpreadLeftCSS());
        }
        else if (pageSpread === "right") {
            this.$el.css(this.styles.getPageSpreadRightCSS());
        }
        else if (pageSpread === "center") {
            this.$el.css(this.styles.getPageSpreadCenterCSS());
        }
        this.setPageSize();
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