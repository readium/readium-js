define(['require', 'module', 'jquery', 'underscore', 'backbone', './alternate_style_tag_selector'],
    function (require, module, $, _, Backbone, AlternateStyleTagSelector) {

        // TODO: Need to check that if alternate styles are defined for night, they are respected
        var ReflowableCustomTheme = Backbone.Model.extend({

            // ------ PUBLIC INTERFACE --------------------------------------------------------------

            initialize: function (attributes, options) {

                this.currentStyle = {};
            },

            setCurrentStyle: function (styleNameOrCSSObject) {

                var themeStyle;
                // Rationale: If it's a string, we assume that the user specified one of the default names
                if (typeof styleNameOrCSSObject === "string") {

                    themeStyle = this.getDefaultThemeStyle(styleNameOrCSSObject);

                    if (themeStyle !== undefined) {

                        this.currentStyle = themeStyle;
                        this.renderCurrentStyle();
                    }
                }
                // Rationale: At this point, we're just assuming that the CSS provided is correct. Validation of some sort might be desirable
                //   at some point; hard to say.
                else if (typeof styleNameOrCSSObject === "object") {

                    themeStyle = styleNameOrCSSObject;
                    this.currentStyle = themeStyle;
                    this.renderCurrentStyle();
                }
            },

            // Description: Activates a style set for the ePub, based on the currently selected theme. At present,
            //   only the day-night alternate tags are available as an option.
            setAlternateStyleTag: function (themeName, epubContentDocument) {

                var selector = new AlternateStyleTagSelector();
                if (themeName === "night") {
                    selector.activateAlternateStyleSet(["night"], epubContentDocument);
                } else if (themeName === "day" || themeName === "none") {
                    selector.activateAlternateStyleSet(["day"], epubContentDocument);
                }
            },

            // ------ PRIVATE HELPERS --------------------------------------------------------------

            renderCurrentStyle: function () {

                $(this.getContentDocumentHTML()).attr("style", "");
                $(this.getContentDocumentHTML()).css(this.currentStyle);
            },

            getDefaultThemeStyle: function (defaultName) {

                if (defaultName === "none") {
                    return {
                        "background-color": "white",
                        "color": "black",
                        "mo-color": "#777"
                    };
                } else if (defaultName === "vancouver") {
                    return {
                        "background-color": "#DDD",
                        "color": "#576b96",
                        "mo-color": "#777"
                    };
                } else if (defaultName === "night") {
                    return {
                        "background-color": "#141414",
                        "color": "white",
                        "mo-color": "#666"
                    };
                } else if (defaultName === "ballard") {
                    return {
                        "background-color": "#576b96",
                        "color": "#DDD",
                        "mo-color": "#888"
                    };
                } else {
                    return undefined;
                }
            },

            getContentDocumentHTML: function () {

                return $("body", this.get("iframeElement").contentDocument)[0];
            }
        });
        return ReflowableCustomTheme;
    });