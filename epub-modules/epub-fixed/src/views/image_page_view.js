define(
    ['require', 'module', 'jquery', 'underscore', 'backbone', '../models/fixed_layout_style', '../models/fixed_sizing'
    ], function (require, module, $, _, Backbone, FixedLayoutStyle, FixedSizing) {


        var ImagePageView = Backbone.View.extend({

            el: "<div class='fixed-page-wrapper' style='height:100%;'> \
            <img src='#'' alt=''/> \
          </div>",

            initialize: function (options) {

                this.sizing;
                this.styles = new FixedLayoutStyle();
                this.pageSpread = options.pageSpread;
                this.imageSrc = options.imageSrc;
                if (options.viewerSettings.syntheticLayout) {
                    this.setSyntheticPageSpreadStyle();
                } else {
                    this.setSinglePageSpreadStyle();
                }
            },

            // REFACTORING CANDIDATE: Use page set event context to trigger the contentDocumentLoaded event
            render: function (goToLast, elementIdToShow, linkClickHandler, handlerContext, isSynthetic) {

                var that = this;
                $("img", this.$el).attr("src", this.imageSrc);
                this.$("img").on("load", function () {

                    that.sizing = new FixedSizing({ contentDocument: $("img", that.el)[0] });
                    // that.applyKeydownHandler($(view.iframe()));
                    // that.mediaOverlayController.pagesLoaded();
                    that.setPageSize(isSynthetic);
                    that.trigger("contentDocumentLoaded");
                });

                return this.el;
            },

            hidePage: function () {
                this.$el.hide();
            },

            showPage: function () {
                this.$el.show();
            },

            getTransformedWidth: function () {
                return this.sizing.transformedPageSize.width;
            },

            getTransformedHeight: function () {
                return this.sizing.transformedPageSize.height;
            },

            setSinglePageSpreadStyle: function () {

                var transformCss;
                this.$el.css(this.styles.getSinglePageSpreadCSS());
                this.setPageSize(false);
            },

            setSyntheticPageSpreadStyle: function () {

                var pageSpread = this.pageSpread;
                var transformCss;
                if (pageSpread === "left") {
                    this.$el.css(this.styles.getPageSpreadLeftCSS());
                } else if (pageSpread === "right") {
                    this.$el.css(this.styles.getPageSpreadRightCSS());
                } else if (pageSpread === "center") {
                    this.$el.css(this.styles.getPageSpreadCenterCSS());
                }
                this.setPageSize(true);
            },

            setPageSize: function (isSynthetic) {

                var $readerElement = this.$el.parent().parent();
                if (this.sizing !== undefined) {

                    var transformCss;
                    this.sizing.updateMetaSize();
                    transformCss =
                        this.sizing.fitToScreen($readerElement.width(), $readerElement.height(), isSynthetic);
                    this.$el.css(transformCss);
                }
            }
        });
        return ImagePageView;
    });