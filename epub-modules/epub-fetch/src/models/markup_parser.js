define(
    function () {

        var MarkupParser = function (){

            var self = this;

            this.parseXml = function(xmlString) {
                return self.parseMarkup(xmlString, 'text/xml');
            };

            this.parseMarkup = function(markupString, contentType) {
                var parser = new window.DOMParser;
                return parser.parseFromString(markupString, contentType);
            };

        };

        return MarkupParser;
});
