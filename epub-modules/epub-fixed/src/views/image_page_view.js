Readium.Views.ImagePageView = Backbone.View.extend({

    className: "fixed-page-wrap",

    initialize: function() {
        this.template = Handlebars.templates.image_page_template;
        this.model.on("change", this.render, this);
    },

    render: function() {
        var that = this;
        var json = this.model.toJSON();
        this.$el.html( this.template( json ) );
        this.$el.addClass( this.model.getPageSpreadClass() );

        this.$('img').on("load", function() { that.setSize(); });
        

        return this;
    },

    setSize: function() {
        var $img = this.$('img');
        var width = $img.width();
        var height = $img.height();
        // temp this is a mess but it will do for now...
        if( width > 0) {
            this.model.set({meta_width: width, meta_height: height})
        }
        
    }
});