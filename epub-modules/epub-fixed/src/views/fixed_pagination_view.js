define(
    ['require', 'module', 'jquery', 'underscore', 'backbone', '../models/fixed_page_views', '../models/fixed_customizer'
    ], function (require, module, $, _, Backbone, FixedPageViews, FixedCustomizer) {


        var FixedPaginationView = Backbone.View.extend({

            el: "<div class='fixed-pages-view' style='position:relative; height:100%'> \
            <div class='fixed-spine-divider' style='position:absolute;z-index:2;width:1px;left:50%;top:3%;height:93%;'></div> \
          </div>",

            // ------------------------------------------------------------------------------------ //
            //  "PUBLIC" METHODS (THE API)                                                          //
            // ------------------------------------------------------------------------------------ //

            initialize: function (options) {

                var that = this;
                this.epubFetch = options.epubFetch;
                this.fixedPageViews = new FixedPageViews({
                    epubFetch: options.epubFetch,
                    spineObjects: options.spineObjects
                });
                this.viewerSettings = options.viewerSettings;

                // Rationale: Propagate the loaded event after all the content documents are loaded
                this.fixedPageViews.on("epubLoaded", function () {
                    that.trigger("contentDocumentLoaded");
                    that.createEpubBorder();
                    that.$el.css("opacity", "1");
                }, this);

                this.customizer = new FixedCustomizer();

                // this.mediaOverlayController = this.model.get("media_overlay_controller");
                // this.mediaOverlayController.setPages(this.pages);
                // this.mediaOverlayController.setView(this);

                // this.mediaOverlayController.on("change:mo_text_id", this.highlightText, this);
                // this.mediaOverlayController.on("change:active_mo", this.indicateMoIsPlaying, this);
            },

            render: function (goToLastPage, hashFragmentId) {

                this.fixedPageViews.renderFixedPages(this.$el[0], this.viewerSettings, this.linkClickHandler, this);
                return this.el;
            },

            // REFACTORING CANDIDATE:
            //   At the moment, the page-turn events are triggered from the delegate, as well as
            //   checking of page boundry conditions. Not sure if this makes sense, or if it would be clearer
            //   if that stuff was in these two methods instead.
            nextPage: function () {

                this.fixedPageViews.nextPage(this.viewerSettings.syntheticLayout, this);
            },

            previousPage: function () {

                this.fixedPageViews.previousPage(this.viewerSettings.syntheticLayout, this);
            },

            setSyntheticLayout: function (isSynthetic) {

                if (isSynthetic && this.viewerSettings.syntheticLayout === false) {
                    this.viewerSettings.syntheticLayout = true;
                    this.fixedPageViews.setSyntheticLayout(true);
                    $(".fixed-spine-divider", this.$el).show();
                    this.createEpubBorder();
                    this.trigger("layoutChanged", true);
                } else if (!isSynthetic && this.viewerSettings.syntheticLayout === true) {
                    this.viewerSettings.syntheticLayout = false;
                    this.fixedPageViews.setSyntheticLayout(false);
                    $(".fixed-spine-divider", this.$el).hide();
                    this.createEpubBorder();
                    this.trigger("layoutChanged", false);
                }
            },

            showPageNumber: function (pageNumber) {

                var startPageNumbers = this.fixedPageViews.get("currentPages");
                this.fixedPageViews.showPageNumber(pageNumber, this.viewerSettings.syntheticLayout);

                if (startPageNumbers != this.fixedPageViews.get("currentPages")) {
                    this.trigger("displayedContentChanged");
                }
            },

            showPagesView: function () {

                var currentPageNumber = this.fixedPageViews.get("currentPages")[0];
                this.$el.show();
                this.fixedPageViews.showPageNumber(currentPageNumber, this.viewerSettings.syntheticLayout);
            },

            hidePagesView: function () {

                this.$el.hide();
                this.fixedPageViews.hidePageViews();
            },

            resizePageViews: function () {

                this.fixedPageViews.resizePageViews(this.viewerSettings.syntheticLayout);
                this.createEpubBorder();
                this.trigger("displayedContentChanged");
            },

            customize: function (customProperty, styleNameOrCSS) {

                // Font size, margin and theme are not included

                this.customizer.setCustomStyle(customProperty, styleNameOrCSS, this.fixedPageViews.get("fixedPages"),
                    this.el, $(".fixed-spine-divider", this.$el)[0], this.viewerSettings.syntheticLayout);
            },

            //    // override
            // indicateMoIsPlaying: function () {
            // 	var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
            // 	moHelper.renderFixedMoPlaying(
            // 		this.pages.get("current_page"),
            // 		this.mediaOverlayController.get("active_mo"),
            // 		this
            //        );
            // },

            //    // override
            // highlightText: function () {
            // 	var moHelper = new Readium.Models.MediaOverlayViewHelper({epubController : this.model});
            // 	moHelper.renderFixedLayoutMoFragHighlight(
            // 		this.pages.get("current_page"),
            // 		this.mediaOverlayController.get("mo_text_id"),
            // 		this
            //        );
            // },

            //    // override
            //    // Description: return the set of all elements for this spine item that have an @id attribute.
            //    // Used by MO.
            //    getAllPageElementsWithId: function() {
            //        return $('body').find("[id]");
            //    },


            // ------------------------------------------------------------------------------------ //
            //  "PRIVATE" HELPERS                                                                   //
            // ------------------------------------------------------------------------------------ //

            destruct: function () {

                this.off("epubLoaded");
                // this.mediaOverlayController.off("change:mo_text_id", this.highlightText);
                // this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying);
            },

            linkClickHandler: function (e) {

                this.trigger("epubLinkClicked", e);
            },

            // Rationale: Wraps a border around the absolutely position pages on the screen. This is used for both layout (in the case
            //   of a single page spread, and for having a border around the pages that can be styled.
            createEpubBorder: function () {

                var currentPages = this.fixedPageViews.get("currentPages");
                var currPageViewInfo;
                var epubBorderSize;
                var originalWidth;
                var originalHeight;

                if (this.viewerSettings.syntheticLayout) {
                    epubBorderSize = this.getSyntheticBorderSize();
                } else {
                    epubBorderSize = this.getSinglePageBorderSize();
                }

                originalWidth = this.$el.outerWidth(true);
                originalHeight = this.$el.outerHeight(true);

                if (epubBorderSize.width < originalWidth) {
                    this.setHorizontalMarginsForBorder(epubBorderSize.width, originalWidth);
                } else if (epubBorderSize.height < originalHeight) {
                    this.setVerticalMarginsForBorder(epubBorderSize.height, originalHeight);
                }
            },

            setHorizontalMarginsForBorder: function (epubBorderWidth, currentWidth) {

                var HEURISTIC_ADJUSTMENT = 5;
                var difference = currentWidth - epubBorderWidth;
                var margin = Math.ceil(difference / 2) - HEURISTIC_ADJUSTMENT;
                this.$el.css({ "margin-left": margin, "margin-right": margin });
            },

            setVerticalMarginsForBorder: function (epubBorderHeight, currentHeight) {

                var HEURISTIC_ADJUSTMENT = 5;
                var difference = currentHeight - epubBorderHeight;
                var margin = Math.ceil(difference / 2) - HEURISTIC_ADJUSTMENT;
                this.$el.css({ "margin-top": margin, "margin-bottom": margin });
            },

            getSinglePageBorderSize: function () {

                var page;
                var currentPageNumber = this.fixedPageViews.get("currentPages")[0];

                currentPage = this.fixedPageViews.getPageViewInfo(currentPageNumber).fixedPageView;

                return {
                    height: currentPage.getTransformedHeight(),
                    width: currentPage.getTransformedWidth(),
                };
            },

            getSyntheticBorderSize: function () {

                var firstPage;
                var secondPage;
                var maxHeight;
                var maxWidth;
                var firstPageNumber = this.fixedPageViews.get("currentPages")[0];
                var secondPageNumber = this.fixedPageViews.get("currentPages")[1];
                var NUMBER_OF_PAGES_SHOWN = 2;

                firstPage = this.fixedPageViews.getPageViewInfo(firstPageNumber).fixedPageView;

                // Rationale: Might only be showing one page in synthetic mode
                if (secondPageNumber !== undefined) {
                    secondPage = this.fixedPageViews.getPageViewInfo(secondPageNumber).fixedPageView;

                    maxHeight = Math.max(firstPage.getTransformedHeight(), secondPage.getTransformedHeight());
                    maxWidth = Math.max(firstPage.getTransformedWidth(), secondPage.getTransformedWidth()) *
                        NUMBER_OF_PAGES_SHOWN;
                } else {
                    maxHeight = firstPage.getTransformedHeight();
                    maxWidth = firstPage.getTransformedWidth() * NUMBER_OF_PAGES_SHOWN;
                }

                return {
                    height: maxHeight,
                    width: maxWidth,
                };
            }

            // setFontSize: function() {
            // 	var size = this.model.get("font_size") / 10;
            // 	$('#readium-content-container').css("font-size", size + "em");
            // 	this.showCurrentPages();
            // },

            // applyKeydownHandler : function ($pageViewContainer) {

            // 	var that = this;
            // 	$pageViewContainer.contents().keydown(function (e) {

            // 		if (e.which == 39) {
            // 			that.pages.goRight(); // Have to get ppd and two up
            // 		}

            // 		if (e.which == 37) {
            // 			that.pages.goLeft(); // Have to get ppd and two up
            // 		}
            // 	});
            // }
        });
        return FixedPaginationView;
    });