define(['require', 'module', 'jquery', 'underscore', 'backbone'], function (require, module, $, _, Backbone) {

    var ReflowableCustomBorder = Backbone.Model.extend({

        // ------ PUBLIC INTERFACE --------------------------------------------------------------

        initialize: function (attributes, options) {

            this.$element = $(this.get("targetElement"));
            this.currentStyle = {};

            if (this.get("customStyle")) {
                this.setCurrentStyle(this.get("customStyle"));
            } else {
                this.setCurrentStyle("none");
            }
        },

        setCurrentStyle: function (styleNameOrCSSObject) {

            var borderStyle;
            // Rationale: If it's a string, we assume that the user specified one of the default names
            if (typeof styleNameOrCSSObject === "string") {

                borderStyle = this.getDefaultBorderStyle(styleNameOrCSSObject);

                if (borderStyle !== undefined) {
                    this.currentStyle = borderStyle;
                    this.renderCurrentStyle();
                }
            }
            // Rationale: At this point, we're just assuming that the CSS provided is correct. Validation of some sort might be desirable
            //   at some point; hard to say.
            else if (typeof styleNameOrCSSObject === "object") {

                borderStyle = this.addRequiredPositionCSS(styleNameOrCSSObject);
                this.currentStyle = borderStyle;
                this.renderCurrentStyle();
            }
        },

        // ------ PRIVATE HELPERS --------------------------------------------------------------

        renderCurrentStyle: function () {

            this.$element.attr("style", "");
            this.$element.css(this.currentStyle);
        },

        getDefaultBorderStyle: function (defaultName) {

            var defaultCSS;
            if (defaultName === "box-shadow") {
                return this.addRequiredPositionCSS({ "box-shadow": "0 0 5px 5px rgba(80, 80, 80, 0.5)" });
            } else if (defaultName == "none") {
                return this.addRequiredPositionCSS({});
            } else {
                return undefined;
            }
        },

        addRequiredPositionCSS: function (customCSS) {

            var positionCSS = {
                "position": "relative",
                "z-index": "0",
                "top": "0px",
                "left": "0px",
                "width": "100%",
                "height": "100%"
            };

            // Rationale: The underscore.js extend method will combine two (or more) objects. However, any properties in the second
            //   object will overwrite the same properties in the first object. This is desired, as the position properties must be
            //   specified as defined in this view.
            var customCSSWithPositionCSS = _.extend(customCSS, positionCSS);
            return customCSSWithPositionCSS;
        }
    });
    return ReflowableCustomBorder;
});