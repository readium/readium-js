EpubFixed.FixedLayoutStyle = Backbone.Model.extend({

    initialize : function () {},

    getSinglePageSpreadCSS : function () {

        // @include box-shadow(0 0 5px 5px rgba(80,80,80,0.5));
        return {
            "position" : "absolute",
            "overflow" : "hidden",
            "height" : "100%",
            "width" : "50%",
            "-webkit-transform-origin" : "top left",
            "left" : "25%"
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