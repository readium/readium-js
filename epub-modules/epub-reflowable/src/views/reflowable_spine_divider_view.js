define(['require', 'module', 'jquery', 'underscore', 'backbone'], function (require, module, $, _, Backbone) {

    var ReflowableSpineDividerView = Backbone.View.extend({

        el: "<div class='reflowing-spine-divider'></div>",

        // ------ PUBLIC INTERFACE --------------------------------------------------------------

        initialize: function (options) {

            this.currentStyle = {};

            if (options && options.customStyle) {
                this.setCurrentStyle(options.customStyle);
            } else {
                this.setCurrentStyle("none");
            }
        },

        render: function () {

            this.renderCurrentStyle();
            return this.el;
        },

        setCurrentStyle: function (styleNameOrCSSObject) {

            var spineStyle;
            // Rationale: If it's a string, we assume that the user specified one of the default names
            if (typeof styleNameOrCSSObject === "string") {

                spineStyle = this.getDefaultSpineStyle(styleNameOrCSSObject);

                if (spineStyle !== undefined) {
                    this.currentStyle = spineStyle;
                    this.renderCurrentStyle();
                }
            }
            // Rationale: At this point, we're just assuming that the CSS provided is correct. Validation of some sort might be desirable
            //   at some point; hard to say.
            else if (typeof styleNameOrCSSObject === "object") {

                spineStyle = this.addRequiredPositionCSS(styleNameOrCSSObject);
                this.currentStyle = spineStyle;
                this.renderCurrentStyle();
            }
        },

        hide: function () {
            this.$el.hide();
        },

        show: function () {
            this.$el.show();
        },

        // ------ PRIVATE HELPERS --------------------------------------------------------------

        renderCurrentStyle: function () {

            this.$el.attr("style", "");
            this.$el.css(this.currentStyle);
        },

        getDefaultSpineStyle: function (defaultName) {

            var defaultCSS;
            if (defaultName === "box-shadow") {
                return this.addRequiredPositionCSS({
                    "width": "1px",
                    "height": "93%",
                    "top": "3%",
                    "box-shadow": "0 0 5px 5px rgba(80, 80, 80, 0.5)"
                });
            } else if (defaultName === "none") {
                return this.addRequiredPositionCSS({});
            } else {
                return undefined;
            }
        },

        addRequiredPositionCSS: function (customCSS) {

            var top = customCSS.top ? customCSS.top : "0px";
            var positionCSS = {
                "position": "absolute",
                "z-index": "2",
                "left": "50%",
                "top": top
            };

            // Rationale: The underscore.js extend method will combine two (or more) objects. However, any properties in the second
            //   object will overwrite the same properties in the first object. This is desired, as the position properties must be
            //   specified as defined in this view.
            var customCSSWithPositionCSS = _.extend(customCSS, positionCSS);
            return customCSSWithPositionCSS;
        }
    });
    return ReflowableSpineDividerView;
});