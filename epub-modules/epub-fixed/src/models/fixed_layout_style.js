EpubFixed.FixedLayoutStyle = Backbone.Model.extend({

    initialize : function () {},

    getSinglePageSpreadCSS : function () {

        return {
            "position" : "absolute",
            "overflow" : "hidden",
            "height" : "100%",
            "width" : "50%",
            "-webkit-transform-origin" : "top left",
            "-moz-transform-origin" : "top left",
            "-o-transform-origin" : "top left",
            "-ms-transform-origin" : "top left",
            "left" : "0%" // Expects that the parent element is resized to wrap it perfectly; this is done with
            //   javascript in the fixed pagination view
        };
    },

    getPageSpreadLeftCSS : function () {

        return { 
            "position" : "absolute",
            "overflow" : "hidden",
            "height" : "100%",
            "width" : "50%", 
            "right" : "50%",
            "left" : "", // Have to clear the left if it was set for this page on a single page spread
            "-webkit-transform-origin" : "top right",
            "-moz-transform-origin" : "top right",
            "-o-transform-origin" : "top right",
            "-ms-transform-origin" : "top right",
            "background-color" : "#FFF"
        };
    },

    getPageSpreadRightCSS : function () {

        return { 
            "position" : "absolute",
            "overflow" : "hidden",
            "height" : "100%",
            "width" : "50%", 
            "left" : "50%",
            "-webkit-transform-origin" : "top left",
            "-moz-transform-origin" : "top left",
            "-o-transform-origin" : "top left",
            "-ms-transform-origin" : "top left",
            "background-color" : "#FFF" 
        };
    },

    getPageSpreadCenterCSS : function () {

        return {
            "position" : "absolute",
            "overflow" : "hidden", 
            "height" : "100%",
            "width" : "100%",
            "left" : "50%",
            "z-index" : "11",
            "background-color" : "#FFF" 
        };
    }
});