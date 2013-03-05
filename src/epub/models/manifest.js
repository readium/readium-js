Epub.Manifest = Backbone.Collection.extend({
    model: Epub.ManifestItem,

    initialize: function(models, options) {
        this.packageDocument = options.packageDocument;   
    }
});