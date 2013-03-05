Epub.Spine = Backbone.Collection.extend({
    model: Epub.SpineItem,

    initialize: function(models, options) {
        this.packageDocument = options.packageDocument;
    },

    isBookFixedLayout: function() {
        return this.packageDocument.get("book").isFixedLayout();
    },

    getMediaOverlay: function(id) {
        return this.packageDocument.getMediaOverlayItem(id);
    }
});