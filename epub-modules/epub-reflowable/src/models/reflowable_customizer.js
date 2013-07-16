define(
    ['require', 'module', 'jquery', 'underscore', 'backbone', './reflowable_custom_border', './reflowable_custom_theme'
    ], function (require, module, $, _, Backbone, ReflowableCustomBorder, ReflowableCustomTheme) {

        var ReflowableCustomizer = Backbone.Model.extend({

            initialize: function (attributes, options) {

                this.$parentEl = $(this.get("parentElement"));
                this.set("customBorder",
                    new ReflowableCustomBorder({ targetElement: this.get("readiumFlowingContent") }));
                this.set("customTheme",
                    new ReflowableCustomTheme({ iframeElement: this.get("readiumFlowingContent") }));
            },

            // ----- PUBLIC INTERFACE -------------------------------------------------------------------

            setCustomStyle: function (customProperty, styleNameOrCSS) {

                if (customProperty === "reflowable-epub-border" || customProperty === "epub-border") {
                    this.get("customBorder").setCurrentStyle(styleNameOrCSS);
                } else if (customProperty === "reflowable-spine-divider" || customProperty === "spine-divider") {
                    this.get("spineDividerStyleView").setCurrentStyle(styleNameOrCSS);
                } else if (customProperty === "reflowable-page-border" || customProperty === "page-border") {
                    this.get("customBorder").setCurrentStyle(styleNameOrCSS);
                    this.get("spineDividerStyleView").setCurrentStyle(styleNameOrCSS);
                } else if (customProperty === "reflowable-page-theme") {
                    this.get("customTheme").setCurrentStyle(styleNameOrCSS);
                } else if (customProperty === "alt-style-tag") {
                    this.get("customTheme").setAlternateStyleTag(styleNameOrCSS, this.get("epubContentDocument"));
                }
            }

            // ----- PRIVATE HELPERS -------------------------------------------------------------------
        });
        return ReflowableCustomizer;
    });