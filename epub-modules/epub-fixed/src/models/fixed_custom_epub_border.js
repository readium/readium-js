define(['require', 'module', 'jquery', 'underscore', 'backbone'], function (require, module, $, _, Backbone) {

    var FixedCustomEpubBorder = Backbone.Model.extend({

        initialize: function (attributes, options) {

            this.lastSetStyle = {};
        },

        setCurrentStyle: function (styleNameOrCSSObject, epubBorderElement) {

            var that = this;
            var borderStyle;
            var $element = $(epubBorderElement);

            // Rationale: If it's a string, we assume that the user specified one of the default names
            if (typeof styleNameOrCSSObject === "string") {

                borderStyle = that.getDefaultBorderStyle(styleNameOrCSSObject);
                borderStyle = that.keepRequiredCSS(borderStyle);

                if (borderStyle !== undefined) {
                    that.removeLastSetStyle($element);
                    that.renderCurrentStyle($element, borderStyle);
                }
                this.setAllCurrentStyles(borderStyle);
            }
            // Rationale: At this point, we're just assuming that the CSS provided is correct. Validation of some sort might be desirable
            //   at some point; hard to say.
            else if (typeof styleNameOrCSSObject === "object") {

                borderStyle = that.keepRequiredCSS(styleNameOrCSSObject);
                that.removeLastSetStyle($element);
                that.renderCurrentStyle($element, borderStyle);
                this.setAllCurrentStyles(borderStyle);
            }
        },

        // ------ PRIVATE HELPERS --------------------------------------------------------------

        renderCurrentStyle: function ($element, currentStyle) {

            $element.css(currentStyle);
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
    return FixedCustomEpubBorder;
});