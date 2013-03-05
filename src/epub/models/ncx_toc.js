Epub.NcxToc = Epub.Toc.extend({

    jath_template: {

        title: "//ncx:docTitle/ncx:text",

        navs: [ "//ncx:navMap/ncx:navPoint", { 
            text: "ncx:navLabel/ncx:text",
            href: "ncx:content/@src"
        } ]
    },

    // Rationale: This method does not use JATH to parse an NCX document, as JATH doesn't really support elements nested 
    //   recursively, as is possibly the case for navPoint elements in an NCX document. 
    parse: function (xmlDom) {
        var ncxJson = {};

        var $navMap;
        var that = this;

        if (typeof(xmlDom) === "string") {
            var parser = new window.DOMParser;
            xmlDom = parser.parseFromString(xmlDom, 'text/xml');
        }

        // Get NCX TOC text title
        ncxJson.title = $($("text", $("docTitle", xmlDom)[0])[0]).text();
        
        // For each navpoint, create navPoint objects recursively
        ncxJson.navs = [];
        $navMap = $("navMap", xmlDom);
        $.each($navMap.children(), function() {

            if ($(this).is("navPoint")) {

                ncxJson.navs.push(that.createNavPointObject($(this)));
            }
        });

        return ncxJson;
    },

    // Description: Creates an object that represents a NCX navPoint.   
    // Rationale: Since navPoints can be nested within each other, this method creates each navPoint object recursively.
    createNavPointObject : function ($navPoint) {

        var jsonNavPoint = {};
        var that = this;

        // Each navPoint object has a content src, a label and 0 or more child navPoints
        jsonNavPoint.navs = [];
        $.each($navPoint.children(), function () {

            $currElement = $(this);
            if ($currElement.is("content")) {

                jsonNavPoint.href = $currElement.attr("src");
            }
            else if ($currElement.is("navLabel")) {

                jsonNavPoint.text = $($("text", $currElement)[0]).text();
            }
            else if ($currElement.is("navPoint")) {

                jsonNavPoint.navs.push(that.createNavPointObject($currElement));
            }
        });

        return jsonNavPoint;
    },

    TocView: function() {
        return new Readium.Views.NcxTocView({model: this});
    }
});