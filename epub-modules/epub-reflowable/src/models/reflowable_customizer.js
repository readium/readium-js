EpubReflowable.ReflowableCustomizer = Backbone.Model.extend({

    initialize : function (attributes, options) {

        this.$parentEl = $(this.get("parentElement"));
        this.set("customBorder", new EpubReflowable.ReflowableCustomBorder({ targetElement : this.get("readiumFlowingContent") }));
        this.set("spineDividerStyleView", new EpubReflowable.ReflowableSpineDividerView());
        this.set("customTheme", new EpubReflowable.ReflowableCustomTheme({ iframeElement : this.get("readiumFlowingContent") }));
    },

    // ----- PUBLIC INTERFACE -------------------------------------------------------------------

    renderCustomStyles : function () {

        // Do something with the loaded epub

        var spineDividerStyleView = this.get("spineDividerStyleView");
        this.$parentEl.append(spineDividerStyleView.render());
    },

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