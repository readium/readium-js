EpubReflowable.ReflowableCustomizer = Backbone.Model.extend({

    initialize : function (attributes, options) {

        this.$parentEl = $(this.get("parentElement"));
        this.set("customBorder", 
            new EpubReflowable.ReflowableCustomBorder({ targetElement : this.get("readiumFlowingContent") })
        );
        this.set("spineDividerStyleView", new EpubReflowable.ReflowableSpineDividerView());
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
        else if (customProperty === "theme") {

            // set internal theme
            // this.get("epubThemeView").setCurrentStyle(styleNameOrCSS);
        }
    }

    // ----- PRIVATE HELPERS -------------------------------------------------------------------
});