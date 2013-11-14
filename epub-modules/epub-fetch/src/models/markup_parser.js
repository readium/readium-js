define(
    function () {

        var MarkupParser = function (){

            this.parseXml = function(xmlString) {
                return this.parseMarkup(xmlString, 'text/xml');
            };

            this.parseMarkup = function(markupString, contentType) {
                var parser = new window.DOMParser;
                return parser.parseFromString(markupString, contentType);
            };

        };

        return MarkupParser;
});
