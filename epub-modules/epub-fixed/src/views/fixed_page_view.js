define(
    ['require', 'module', 'jquery', 'underscore', 'backbone', '../models/fixed_layout_style', '../models/fixed_sizing'
    ], function (require, module, $, _, Backbone, FixedLayoutStyle, FixedSizing) {

        var FixedPageView = Backbone.View.extend({

            el: "<div class='fixed-page-wrapper'> \
            <iframe scrolling='no' \
                    frameborder='0' \
                    marginwidth='0' \
                    marginheight='0' \
                    style='height:100%;width:100%;' \
                    class='fixed-content'> \
            </iframe> \
          </div>",

            initialize: function (options) {

                this.sizing;
                this.epubFetch = options.epubFetch;
                this.styles = new FixedLayoutStyle();
                this.pageSpread = options.pageSpread;
                this.iframeSrc = options.iframeSrc;
                this.fixedLayoutType = options.fixedLayoutType;

                // REFACTORING CANDIDATE: See if this can be done in the render method
                if (options.viewerSettings.syntheticLayout) {
                    this.setSyntheticPageSpreadStyle();
                } else {
                    this.setSinglePageSpreadStyle();
                }
            },

            // REFACTORING CANDIDATE: Use page set event context to trigger the content document loaded event
            render: function (goToLast, elementIdToShow, linkClickHandler, handlerContext, isSynthetic) {

                var that = this;
                this.get$iframe().attr("src", this.iframeSrc);
                this.get$iframe().on("load", function () {

                    // "Forward" the epubReadingSystem object to the iframe's own window context.
                    // Note: the epubReadingSystem object may not be ready when directly using the
                    // window.onload callback function (from within an (X)HTML5 EPUB3 content document's Javascript code)
                    // To address this issue, the recommended code is:
                    // -----
                    // function doSomething() { console.log(navigator.epubReadingSystem); };
                    //
                    // // With jQuery:
                    // $(document).ready(function () { setTimeout(doSomething, 200); });
                    //
                    // // With the window "load" event:
                    // window.addEventListener("load", function () { setTimeout(doSomething, 200); }, false);
                    //
                    // // With the modern document "DOMContentLoaded" event:
                    // document.addEventListener("DOMContentLoaded", function(e) { setTimeout(doSomething, 200); }, false);
                    // -----
                    if (typeof navigator.epubReadingSystem != 'undefined') {
                        var iFrame = that.get$iframe()[0];
                        var iFrameWindow = iFrame.contentWindow || iFrame.contentDocument.parentWindow;
                        var ers = navigator.epubReadingSystem; //iFrameWindow.parent.navigator.epubReadingSystem
                        iFrameWindow.navigator.epubReadingSystem = ers;
                    }

                    that.sizing = new FixedSizing({ contentDocument: that.get$iframe()[0].contentDocument });
                    that.injectLinkHandler(that.get$iframe(), linkClickHandler, handlerContext);
                    // that.applyKeydownHandler($(view.iframe()));
                    if (that.fixedLayoutType !== "svg") {
                        that.setPageSize(isSynthetic);
                    }
                    that.trigger("contentDocumentLoaded");
                });

                return this.el;
            },

            get$iframe: function () {
                return $("iframe", this.$el);
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

                var singlePageCss;
                if (this.fixedLayoutType === "svg") {
                    singlePageCss = this.styles.getSvgSinglePageSpreadCSS();
                    this.$el.css(singlePageCss);
                } else {
                    singlePageCss = this.styles.getSinglePageSpreadCSS();
                    this.$el.css(singlePageCss);
                    this.setPageSize(false);
                }
            },

            setSyntheticPageSpreadStyle: function () {

                var pageSpread = this.pageSpread;
                var syntheticPageCss;

                if (this.fixedLayoutType === "svg") {
                    if (pageSpread === "left") {
                        syntheticPageCss = this.styles.getSvgPageSpreadLeftCSS();
                    } else if (pageSpread === "right") {
                        syntheticPageCss = this.styles.getSvgPageSpreadRightCSS();
                    } else if (pageSpread === "center") {
                        syntheticPageCss = this.styles.getSvgPageSpreadCenterCSS();
                    }
                    this.$el.css(syntheticPageCss);
                } else {
                    if (pageSpread === "left") {
                        syntheticPageCss = this.styles.getPageSpreadLeftCSS();
                    } else if (pageSpread === "right") {
                        syntheticPageCss = this.styles.getPageSpreadRightCSS();
                    } else if (pageSpread === "center") {
                        syntheticPageCss = this.styles.getPageSpreadCenterCSS();
                    }
                    this.$el.css(syntheticPageCss);
                    this.setPageSize(true);
                }
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
            },

            injectLinkHandler: function ($iframe, linkClickHandler, handlerContext) {

                var that = this;
                $('a', $iframe).on("click", function (e) {
                    linkClickHandler.call(handlerContext, e);
                });
            }
        });
        return FixedPageView;
    });