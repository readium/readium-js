Epub.XhtmlToc = Epub.Toc.extend({

    parse: function(xmlDom) {
        var json = {};
        if(typeof(xmlDom) === "string" ) {
            var parser = new window.DOMParser;
            xmlDom = parser.parseFromString(xmlDom, 'text/xml');
        }
        json.title = $('title', xmlDom).text();
        json.body = $('body', xmlDom);
        return json;
    },

    TocView: function() {
        return new Readium.Views.XhtmlTocView({model: this});
    }
});