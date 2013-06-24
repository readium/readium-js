EpubReflowable.ReflowableCustomizer = Backbone.Model.extend({

    initialize : function (attributes, options) {

        this.$parentEl = $(this.get("parentElement"));
        this.set("customBorder", new EpubReflowable.ReflowableCustomBorder({ targetElement : this.get("readiumFlowingContent") }));
        this.set("customTheme", new EpubReflowable.ReflowableCustomTheme({ iframeElement : this.get("readiumFlowingContent") }));
    },

    // ----- PUBLIC INTERFACE -------------------------------------------------------------------

    setCustomStyle : function (customProperty, styleNameOrCSS) {

        if (customProperty === "border") {
            this.get("customBorder").setCurrentStyle(styleNameOrCSS);
        }
        else if (customProperty === "spine-divider") {
            this.get("spineDividerStyleView").setCurrentStyle(styleNameOrCSS);
        }
        else if (customProperty === "page-border") {
            this.get("customBorder").setCurrentStyle(styleNameOrCSS);
            this.get("spineDividerStyleView").setCurrentStyle(styleNameOrCSS);
        }
        else if (customProperty === "page-theme") {
            this.get("customTheme").setCurrentStyle(styleNameOrCSS);
        }
    }

    // ----- PRIVATE HELPERS -------------------------------------------------------------------
});