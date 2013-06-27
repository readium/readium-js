EpubFixed.FixedCustomizer = Backbone.Model.extend({

    initialize : function (attributes, options) {

        // The list of page views
        this.set("customPageBorder", new EpubFixed.FixedCustomPageBorder());
        this.set("customEpubBorder", new EpubFixed.FixedCustomEpubBorder());  
        this.set("customSpineDivider", new EpubFixed.FixedCustomSpineDivider());
    },

    // ----- PUBLIC INTERFACE -------------------------------------------------------------------

    setCustomStyle : function (customProperty, styleNameOrCSS, pageViews, epubBorderElement, spineElement, isSynthetic) {

        var that = this;
        if (customProperty === "fixed-epub-border" || customProperty === "epub-border") {
            that.get("customEpubBorder").setCurrentStyle(styleNameOrCSS, epubBorderElement);
        }
        else if (customProperty === "fixed-spine-divider" || customProperty === "spine-divider") {
            this.get("customSpineDivider").setCurrentStyle(styleNameOrCSS, spineElement);
        }
        else if (customProperty === "fixed-page-border" || customProperty === "page-border") {
            that.get("customPageBorder").setCurrentStyle(styleNameOrCSS, pageViews);
        }
        else if (customProperty === "fixed-page-border-left") {
            that.get("customPageBorder").setCurrentStyle(styleNameOrCSS, pageViews, "left");
        }
        else if (customProperty === "fixed-page-border-right") {
            that.get("customPageBorder").setCurrentStyle(styleNameOrCSS, pageViews, "right");
        }
    }

    // ----- PRIVATE HELPERS -------------------------------------------------------------------

    // 

});