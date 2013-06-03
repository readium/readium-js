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
        if (options.viewerSettings.syntheticLayout) {
            this.setSyntheticPageSpreadStyle();       
        }
        else {
            this.setSinglePageSpreadStyle();
        }
    },

    render : function () {

        var that = this;
        this.get$iframe().attr("src", this.iframeSrc);
        this.get$iframe().on("load", function () {

            // "Forward" the epubReadingSystem object to the iframe's own window context.
            // Note: the epubReadingSystem object may not be ready when directly using the
            // window.onload callback function (from within an (X)HTML5 EPUB3 content document's Javascript code)
            // To address this issue, the recommended code is:
            // -----
            // function doSomething() { console.log(navigator.epubReadingSystem); };
            // 
            // // With jQuery:
            // $(document).ready(function () { setTimeout(doSomething, 200); });
            // 
            // // With the window "load" event:
            // window.addEventListener("load", function () { setTimeout(doSomething, 200); }, false);
            // 
            // // With the modern document "DOMContentLoaded" event:
            // document.addEventListener("DOMContentLoaded", function(e) { setTimeout(doSomething, 200); }, false);
            // -----
            if (typeof navigator.epubReadingSystem != 'undefined')
            {
               var iFrame = that.get$iframe()[0];
               var iFrameWindow = iFrame.contentWindow || iFrame.contentDocument.parentWindow;
               var ers = navigator.epubReadingSystem; //iFrameWindow.parent.navigator.epubReadingSystem
               iFrameWindow.navigator.epubReadingSystem = ers;
            }

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

        var $readerElement = this.$el.parent().parent();
        if (this.sizing !== undefined) {

            var transformCss;
            this.sizing.updateMetaSize();
            transformCss = this.sizing.fitToScreen($readerElement.width(), $readerElement.height());
            this.$el.css(transformCss);
        }
    }
});