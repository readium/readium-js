Readium.Views.FixedPageView = Backbone.View.extend({

    className: "fixed-page-wrap",

    initialize: function() {
        this.template = Handlebars.templates.fixed_page_template;
        this.model.on("change", this.render, this);
    },

    destruct: function() {
        this.model.off("change", this.render);
    },

    render: function() {
        var that = this;
        var json = this.model.toJSON();
        this.$el.html( this.template( json ) );
        this.$el.addClass( this.model.getPageSpreadClass() );
        this.$('.content-sandbox').on("load", function() {
            that.trigger("iframe_loaded");
        });
        return this;
    },

    iframe: function() {
        return this.$('.content-sandbox')[0];
    }
});