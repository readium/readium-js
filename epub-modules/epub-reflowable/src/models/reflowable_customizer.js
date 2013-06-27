EpubReflowable.ReflowableCustomizer = Backbone.Model.extend({

    initialize : function (attributes, options) {

        this.$parentEl = $(this.get("parentElement"));
        this.set("customBorder", new EpubReflowable.ReflowableCustomBorder({ targetElement : this.get("readiumFlowingContent") }));
        this.set("customTheme", new EpubReflowable.ReflowableCustomTheme({ iframeElement : this.get("readiumFlowingContent") }));
    },

    // ----- PUBLIC INTERFACE -------------------------------------------------------------------

    setCustomStyle : function (customProperty, styleNameOrCSS) {

        if (customProperty === "reflowable-epub-border" || customProperty === "epub-border") {
            this.get("customBorder").setCurrentStyle(styleNameOrCSS);
        }
        else if (customProperty === "reflowable-spine-divider" || customProperty === "spine-divider") {
            this.get("spineDividerStyleView").setCurrentStyle(styleNameOrCSS);
        }
        else if (customProperty === "reflowable-page-border" || customProperty === "page-border") {
            this.get("customBorder").setCurrentStyle(styleNameOrCSS);
            this.get("spineDividerStyleView").setCurrentStyle(styleNameOrCSS);
        }
        else if (customProperty === "reflowable-page-theme") {
            this.get("customTheme").setCurrentStyle(styleNameOrCSS);
        }
    }

    // ----- PRIVATE HELPERS -------------------------------------------------------------------
});