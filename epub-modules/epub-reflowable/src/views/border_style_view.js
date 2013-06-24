EpubReflowable.BorderStyleView = Backbone.View.extend({

    el : "<div class='reflowing-border-styles'></div>",

    // ------ PUBLIC INTERFACE --------------------------------------------------------------

    initialize : function (options) {

        this.borderSize = {
            "top" : 0,
            "left" : 0,
            "width" : 0,
            "height" : 0
        };
        this.currentStyle = {};

        if (options && options.customStyle) {
            this.setCurrentStyle(options.customStyle);
        }
        else {
            this.setCurrentStyle("no-border");
        }
    },

    destruct : function () {},

    render : function (contentTop, contentLeft, contentWidth, contentHeight) {

        this.resizeBorderElement(contentTop, contentLeft, contentWidth, contentHeight);
        return this.el;
    },

    resizeBorderElement : function (contentTop, contentLeft, contentWidth, contentHeight) {

        this.setBorderSize(contentTop, contentLeft, contentWidth, contentHeight);
        this.renderCurrentStyle();
    },

    setCurrentStyle : function (styleNameOrCSSObject) {

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

    renderCurrentStyle : function () {
        this.$el.attr('style', '');
        this.$el.css(this.currentStyle);
    },

    getDefaultBorderStyle : function (defaultName) {

        var defaultCSS;
        if (defaultName === "box-shadow") {
            return this.addRequiredPositionCSS({ "-webkit-box-shadow" : "0 0 5px 5px rgba(80, 80, 80, 0.5)" });
        }
        else if (defaultName == "no-border") {
            return this.addRequiredPositionCSS({});
        }
        else {
            return undefined;
        }
    },

    setBorderSize : function (contentTop, contentLeft, contentWidth, contentHeight) {

        this.borderSize.top = contentTop;
        this.borderSize.left = contentLeft;
        this.borderSize.width = contentWidth;
        this.borderSize.height = contentHeight;

        // Rationale: Update the current style with the new position information
        this.currentStyle = this.addRequiredPositionCSS(this.currentStyle);
    },

    addRequiredPositionCSS : function (customCSS) {

        var positionCSS = {
            "position" : "absolute",
            "z-index" : "0",
            "top" : this.borderSize.top + "px",
            "left" : this.borderSize.left + "px",
            "width" : this.borderSize.width + "px",
            "height" : this.borderSize.height + "px"
        };

        // Rationale: The underscore.js extend method will combine two (or more) objects. However, any properties in the second
        //   object will overwrite the same properties in the first object. This is desired, as the position properties must be 
        //   specified as defined in this view. 
        var customCSSWithPositionCSS = _.extend(customCSS, positionCSS);
        return customCSSWithPositionCSS;
    }
});