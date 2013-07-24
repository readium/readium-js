define(['require', 'module', 'jquery', 'underscore', 'backbone', './fixed_custom_epub_border',
    './fixed_custom_page_border', './fixed_custom_spine_divider'],
    function (require, module, $, _, Backbone, FixedCustomEpubBorder, FixedCustomPageBorder, FixedCustomSpineDivider) {

        var FixedCustomizer = Backbone.Model.extend({

            initialize: function (attributes, options) {

                // The list of page views
                this.set("customPageBorder", new FixedCustomPageBorder());
                this.set("customEpubBorder", new FixedCustomEpubBorder());
                this.set("customSpineDivider", new FixedCustomSpineDivider());
            },

            // ----- PUBLIC INTERFACE -------------------------------------------------------------------

            setCustomStyle: function (customProperty, styleNameOrCSS, pageViews, epubBorderElement, spineElement,
                                      isSynthetic) {

                var that = this;
                if (customProperty === "fixed-epub-border" || customProperty === "epub-border") {
                    that.get("customEpubBorder").setCurrentStyle(styleNameOrCSS, epubBorderElement);
                } else if (customProperty === "fixed-spine-divider" || customProperty === "spine-divider") {
                    this.get("customSpineDivider").setCurrentStyle(styleNameOrCSS, spineElement);
                } else if (customProperty === "fixed-page-border" || customProperty === "page-border") {
                    that.get("customPageBorder").setCurrentStyle(styleNameOrCSS, pageViews);
                } else if (customProperty === "fixed-page-border-left") {
                    that.get("customPageBorder").setCurrentStyle(styleNameOrCSS, pageViews, "left");
                } else if (customProperty === "fixed-page-border-right") {
                    that.get("customPageBorder").setCurrentStyle(styleNameOrCSS, pageViews, "right");
                }
            }

            // ----- PRIVATE HELPERS -------------------------------------------------------------------

            //

        });
        return FixedCustomizer;
    });