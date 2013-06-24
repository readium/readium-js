EpubReflowable.ReflowableCustomizer = Backbone.Model.extend({

    // Expects 1) the reflowableView element, 2) the borderStyleView, 3) the spineDividerView, 4) the epubTheme
    initialize : function (attributes, options) {

        this.$parentEl = $(this.get("parentElement"));
        this.set("borderStyleView", new EpubReflowable.BorderStyleView());
    },

    // ----- PUBLIC INTERFACE -------------------------------------------------------------------

    renderCustomStyles : function () {

        // Do something with the loaded epub

        var borderStyleView = this.get("borderStyleView");    

        this.$parentEl.append(
            borderStyleView.render(
                this.$parentEl.offset().top, 
                this.$parentEl.offset().left, 
                this.$parentEl.width(), 
                this.$parentEl.height()
            )
        );
    },

    setCustomStyle : function (customProperty, styleNameOrCSS) {

        if (customProperty === "border") {

            // border
            this.get("borderStyleView").setCurrentStyle(styleNameOrCSS);
        }
        else if (customProperty === "spine-divider") {

            // spine
            // this.get("spineDividerView").setCurrentStyle(styleNameOrCSS);
        }
        else if (customProperty === "page-border") {

            // spine & border 
            this.get("borderStyleView").setCurrentStyle(styleNameOrCSS);
            // this.get("spineDividerView").setCurrentStyle(styleNameOrCSS);
        }
        else if (customProperty === "theme") {

            // set internal theme
            // this.get("epubThemeView").setCurrentStyle(styleNameOrCSS);
        }
    },

    resizeCustomStyles : function () {

        this.get("borderStyleView").resizeBorderElement(
            this.$parentEl.offset().top, 
            this.$parentEl.offset().left, 
            this.$parentEl.width(), 
            this.$parentEl.height()
        );
        // this.spineDividerView.resizeSpineDivider(top, left, width, height);
    },

    // ----- PRIVATE HELPERS -------------------------------------------------------------------
});