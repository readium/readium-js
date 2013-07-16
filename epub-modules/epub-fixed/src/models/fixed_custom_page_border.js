define(['require', 'module', 'jquery', 'underscore', 'backbone'], function (require, module, $, _, Backbone) {

    var FixedCustomPageBorder = Backbone.Model.extend({

        initialize: function (attributes, options) {

            this.lastSetStyle = {};
        },

        setCurrentStyle: function (styleNameOrCSSObject, pageViews, pageSpread) {

            var that = this;
            var borderStyle;

            // Rationale: If it's a string, we assume that the user specified one of the default names
            if (typeof styleNameOrCSSObject === "string") {

                // Iterate through each page view and set it's style
                _.each(pageViews, function (pageViewInfo) {

                    if (pageSpread && pageViewInfo.pageSpread !== pageSpread) {
                        return;
                    }

                    var $element = pageViewInfo.fixedPageView.$el;
                    if (pageSpread === "left") {
                        borderStyle = that.getPageSpreadDefaultBorderStyle(styleNameOrCSSObject, "left");
                    } else if (pageSpread === "right") {
                        borderStyle = that.getPageSpreadDefaultBorderStyle(styleNameOrCSSObject, "right");
                    } else {
                        borderStyle = that.getDefaultBorderStyle(styleNameOrCSSObject);
                    }

                    borderStyle = that.keepRequiredCSS(borderStyle);

                    if (borderStyle !== undefined) {
                        that.removeLastSetStyle($element);
                        that.renderCurrentStyle($element, borderStyle);
                    }
                });
                this.setAllCurrentStyles(borderStyle);
            }
            // Rationale: At this point, we're just assuming that the CSS provided is correct. Validation of some sort might be desirable
            //   at some point; hard to say.
            else if (typeof styleNameOrCSSObject === "object") {

                borderStyle = that.keepRequiredCSS(styleNameOrCSSObject);
                _.each(pageViews, function (pageViewInfo) {
                    that.removeLastSetStyle($element);
                    that.renderCurrentStyle($element, borderStyle);
                });
                this.setAllCurrentStyles(borderStyle);
            }
        },

        // ------ PRIVATE HELPERS --------------------------------------------------------------

        renderCurrentStyle: function ($element, currentStyle) {

            $element.css(currentStyle);
        },

        getPageSpreadDefaultBorderStyle: function (defaultName, pageSpread) {

            var defaultCSS;
            if (defaultName === "box-shadow") {

                if (pageSpread === "left") {
                    return { "box-shadow": "0px 0px 5px 5px rgba(80, 80, 80, 0.5)" };
                } else if (pageSpread === "right") {
                    return { "box-shadow": "0px 0px 5px 5px rgba(80, 80, 80, 0.5)" };
                } else {
                    return undefined;
                }
            } else if (defaultName == "none") {
                return {};
            } else {
                return undefined;
            }
        },

        getDefaultBorderStyle: function (defaultName) {

            var defaultCSS;
            if (defaultName === "box-shadow") {
                return { "box-shadow": "0 0 5px 5px rgba(80, 80, 80, 0.5)" };
            } else if (defaultName == "none") {
                return {};
            } else {
                return undefined;
            }
        },

        setAllCurrentStyles: function (styles) {
            this.lastSetStyle = _.extend(this.lastSetStyle, styles);
        },

        keepRequiredCSS: function (customCSS) {

            var requiredCSS = [
                "position", "z-index", "top", "left", "width", "height"
            ];

            // Remove properties that can't be changed
            _.each(requiredCSS, function (propertyName) {
                if (!customCSS.hasOwnProperty(propertyName)) {
                    delete customCSS[propertyName];
                }
            });

            // Rationale: The underscore.js extend method will combine two (or more) objects. However, any properties in the second
            //   object will overwrite the same properties in the first object. This is desired, as the position properties must be
            //   specified as defined in this view.
            return customCSS;
        },

        // REFACTORING CANDIDATE: Get modernizr in here
        removeLastSetStyle: function ($element) {

            _.each(this.lastSetStyle, function (styleValue, style) {
                $element.css(style, "");
            });
        }
    });
    return FixedCustomPageBorder;
});