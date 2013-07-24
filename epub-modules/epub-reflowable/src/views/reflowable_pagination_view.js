define(['require', 'module', 'jquery', 'underscore', 'backbone', 'cfi_module', '../models/reflowable_layout',
    '../models/reflowable_paginator', '../models/reflowable_element_info', '../models/reflowable_pagination',
    '../models/reflowable_annotations', '../models/reflowable_customizer', './reflowable_spine_divider_view'],
    function (require, module, $, _, Backbone, EpubCFIModule, ReflowableLayout, ReflowablePaginator,
              ReflowableElementInfo, ReflowablePagination, ReflowableAnnotations, ReflowableCustomizer,
              ReflowableSpineDividerView) {

        var ReflowablePaginationView = Backbone.View.extend({

            el: "<div class='flowing-wrapper clearfix' style='display:block;margin-left:auto;margin-right:auto;position:relative;overflow:hidden;'> \
            <iframe scrolling='no' \
                    frameborder='0' \
                    height='100%' \
                    class='readium-flowing-content'> \
            </iframe> \
          </div>",

            initialize: function (options) {

                var ViewerModel = Backbone.Model.extend({});
                var SpineItemModel = Backbone.Model.extend({});

                this.epubFetch = options.epubFetch;
                this.viewerModel = new ViewerModel(options.viewerSettings);
                this.viewerModel.set({ syntheticLayout: options.viewerSettings.syntheticLayout });
                this.spineItemModel = new SpineItemModel(options.spineItem);
                this.epubCFIs = options.contentDocumentCFIs;
                this.bindings = options.bindings;

                // Initalize delegates and other models
                this.reflowableLayout = new ReflowableLayout();
                this.reflowablePaginator = new ReflowablePaginator();
                this.reflowableElementsInfo = new ReflowableElementInfo();
                this.pages = new ReflowablePagination();

                // Initialize custom style views
                this.spineDivider = new ReflowableSpineDividerView();
                this.$el.append(this.spineDivider.render());
                this.customizer;

                this.annotations;
                this.cfi = new EpubCFIModule();

                // this.mediaOverlayController = this.model.get("media_overlay_controller");
                // this.mediaOverlayController.setPages(this.pages);
                // this.mediaOverlayController.setView(this);

                // Initialize handlers
                // this.mediaOverlayController.on("change:mo_text_id", this.highlightText, this);
                // this.mediaOverlayController.on("change:active_mo", this.indicateMoIsPlaying, this);
            },

            destruct: function () {

                // Remove all handlers so they don't hang around in memory
                // this.mediaOverlayController.off("change:mo_text_id", this.highlightText, this);
                // this.mediaOverlayController.off("change:active_mo", this.indicateMoIsPlaying, this);
            },

            // ------------------------------------------------------------------------------------ //
            //  "PUBLIC" METHODS (THE API)                                                          //
            _afterPopulatingContentDocument: function (thatElement, hashFragmentId, goToLastPage) {
                var that = this;
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
                    var iFrame = that.getReadiumFlowingContent();
                    var iFrameWindow = iFrame.contentWindow || iFrame.contentDocument.parentWindow;
                    var ers = navigator.epubReadingSystem;
                    iFrameWindow.navigator.epubReadingSystem = ers;
                }

                var borderElement;
                var lastPageElementId = that.initializeContentDocument();

                // Rationale: The content document must be paginated in order for the subsequent "go to page" methods
                //   to have access to the number of pages in the content document.
                that.paginateContentDocument();
                // that.mediaOverlayController.pagesLoaded();

                // Rationale: The assumption here is that if a hash fragment is specified, it is the result of Readium
                //   following a clicked linked, either an internal link, or a link from the table of contents. The intention
                //   to follow a link should supersede restoring the last-page position, as this should only be done for the
                //   case where Readium is re-opening the book, from the library view.
                if (hashFragmentId) {
                    that.showPageByElementId(hashFragmentId);
                } else if (lastPageElementId) {
                    that.showPageByElementId(lastPageElementId);
                } else {

                    if (goToLastPage) {
                        // that.pages.goToLastPage(that.viewerModel.get("syntheticLayout"), that.spineItemModel.get("firstPageIsOffset"));
                    } else {
                        that.showPageByNumber(1);
                        // that.pages.goToPage(1, that.viewerModel.get("syntheticLayout"), that.spineItemModel.get("firstPageIsOffset"));
                    }
                }

                that.annotations = new ReflowableAnnotations({
                    saveCallback: undefined,
                    callbackContext: undefined,
                    contentDocumentDOM: that.getEpubContentDocument().parentNode
                });

                that.customizer = new ReflowableCustomizer({
                    parentElement: that.getFlowingWrapper(),
                    readiumFlowingContent: that.getReadiumFlowingContent(),
                    spineDividerStyleView: that.spineDivider,
                    epubContentDocument: that.getEpubContentDocument()
                });

                that.trigger("contentDocumentLoaded", thatElement);
            },
            // ------------------------------------------------------------------------------------ //

            render: function (goToLastPage, hashFragmentId) {

                var that = this;
                var json = this.spineItemModel.toJSON();
                var epubFetch = this.epubFetch;
                var thatElement = that.el;

                console.log('rendering in IFRAME from URI [' + json.contentDocumentURI + ']');
                if (epubFetch.isPackageExploded()) {

                    $("iframe", thatElement).attr("src", json.contentDocumentURI);
                    $("iframe", thatElement).attr("title", json.title);

                    // Wait for iframe to load EPUB content document
                    $(that.getReadiumFlowingContent()).on("load", function (e) {
                        that._afterPopulatingContentDocument(thatElement, hashFragmentId, goToLastPage);
                    });
                } else {
                    epubFetch.relativeToPackageFetchFileContents(json.contentDocumentURI, 'text',
                        function (contentDocumentText) {
                            var documentIframe = $("iframe", thatElement);
                            epubFetch.resolveInternalPackageResources(json.contentDocumentURI, json.mediaType,
                                contentDocumentText, function (resolvedContentDocumentDom) {
                                    var contentDocument = documentIframe[0].contentDocument;
                                    contentDocument.replaceChild(resolvedContentDocumentDom.documentElement,
                                        contentDocument.documentElement);
                                    that._afterPopulatingContentDocument(thatElement, hashFragmentId, goToLastPage);
                                });
                        }, function (err) {
                            console.error(err);
                        });
                }

                return thatElement;
            },

            // indicateMoIsPlaying: function () {
            // 	var moHelper = new EpubReflowable.MediaOverlayViewHelper({epubController : this.model});
            // 	moHelper.renderReflowableMoPlaying(
            // 		this.model.get("current_theme"),
            // 		this.mediaOverlayController.get("active_mo"),
            // 		this
            // 	);
            // },

            // highlightText: function () {
            // 	var moHelper = new EpubReflowable.MediaOverlayViewHelper({epubController : this.model});
            // 	moHelper.renderReflowableMoFragHighlight(
            // 		this.model.get("current_theme"),
            // 		this,
            // 		this.mediaOverlayController.get("mo_text_id")
            // 	);
            // },

            showPageByNumber: function (pageNumber) {

                this.pages.goToPage(pageNumber, this.viewerModel.get("syntheticLayout"),
                    this.spineItemModel.get("firstPageIsOffset"));
                this.showCurrentPages();
            },

            // TODO: Check to see if it's a character offset CFI. If it is, inject it and keep track of the injection.
            showPageByCFI: function (CFI) {

                var $rangeTargetElements;
                var $standardTargetElement;
                var targetElement;
                try {

                    // Check if it's a CFI range type
                    if (new RegExp(/.+,.+,.+/).test(CFI)) {
                        $rangeTargetElements =
                            this.cfi.getRangeTargetElements(CFI, $(this.getEpubContentDocument()).parent()[0], [], [],
                                ["MathJax_Message"]);
                        targetElement = $rangeTargetElements[0];
                    } else {
                        $standardTargetElement =
                            this.cfi.getTargetElement(CFI, $(this.getEpubContentDocument()).parent()[0], [], [],
                                ["MathJax_Message"]);
                        targetElement = $standardTargetElement[0];
                    }
                } catch (error) {
                    // Maybe check error type
                    throw error;
                }

                if (targetElement.nodeType === Node.TEXT_NODE) {
                    this.showPageByElement($(targetElement).parent()[0])
                } else {
                    this.showPageByElement(targetElement);
                }
            },

            showPageByElementId: function (elementId) {

                var targetElement = $("#" + elementId, this.getEpubContentDocument())[0];
                if (!targetElement) {
                    return;
                }

                // Rationale: We get more precise results if we look at the first children
                while (targetElement.children.length > 0) {
                    targetElement = targetElement.children[0];
                }

                this.showPageByElement(targetElement);
            },

            showView: function () {

                this.$el.show();
                this.updatePageNumber();
            },

            hideView: function () {

                this.$el.hide();
            },

            // REFACTORING CANDIDATE: This method is delegating to setFontSize and setMargin. These could both be added
            //   as customizable style objects - essentially treated the same way
            customizeStyles: function (customElement, styleNameOrCSSObject) {

                if (customElement === "margin") {
                    this.setMargin(parseInt(styleNameOrCSSObject));
                } else if (customElement === "fontSize") {
                    this.setFontSize(parseInt(styleNameOrCSSObject));
                } else {
                    this.customizer.setCustomStyle(customElement, styleNameOrCSSObject);
                }
                this.paginateContentDocument();
            },

            setFontSize: function (fontSize) {

                if (fontSize !== this.viewerModel.get("fontSize")) {
                    this.viewerModel.set("fontSize", fontSize);
                    this.paginateContentDocument();
                }
            },

            setMargin: function (margin) {

                if (margin !== this.viewerModel.get("currentMargin")) {
                    this.viewerModel.set("currentMargin", margin);
                    this.paginateContentDocument();
                }
            },

            setSyntheticLayout: function (isSynthetic) {

                // Rationale: Only toggle the layout if a change is required
                if (isSynthetic !== this.viewerModel.get("syntheticLayout")) {

                    this.viewerModel.set("syntheticLayout", isSynthetic);
                    this.pages.toggleTwoUp(isSynthetic, this.spineItemModel.get("firstPageIsOffset"));
                    this.paginateContentDocument();
                    this.viewerModel.get("syntheticLayout") ? this.spineDivider.show() : this.spineDivider.hide();
                    this.trigger("layoutChanged", isSynthetic);
                }
            },

            nextPage: function () {

                if (!this.pages.onLastPage()) {

                    var isSynthetic = this.viewerModel.get("syntheticLayout");
                    this.pages.nextPage(isSynthetic);
                    this.showCurrentPages();

                    // Trigger events
                    this.trigger("atNextPage");
                    this.pages.onLastPage() ? this.trigger("atLastPage") : undefined;
                } else {
                    this.trigger("atLastPage");
                }
            },

            previousPage: function () {

                if (!this.pages.onFirstPage()) {

                    var isSynthetic = this.viewerModel.get("syntheticLayout");
                    this.pages.prevPage(isSynthetic);
                    this.showCurrentPages();

                    // Trigger events
                    this.trigger("atPreviousPage");
                    this.pages.onFirstPage() ? this.trigger("atFirstPage") : undefined;
                } else {
                    this.trigger("atFirstPage");
                }
            },

            // ------------------------------------------------------------------------------------ //
            //  PRIVATE GETTERS FOR VIEW                                                            //
            // ------------------------------------------------------------------------------------ //

            getFlowingWrapper: function () {
                return this.el;
            },

            getReadiumFlowingContent: function () {
                return $(this.el).children()[0];
            },

            // REFACTORING CANDIDATE: That's a lot of chaining right there. Too much.
            getEpubContentDocument: function () {
                return $($($(this.el).children()[0]).contents()[0]).children()[0];
            },

            // ------------------------------------------------------------------------------------ //
            //  PRIVATE EVENT HANDLERS                               								//
            // ------------------------------------------------------------------------------------ //

            keydownHandler: function (e) {

                if (e.which == 39) {
                    this.trigger("keydown-right");
                }

                if (e.which == 37) {
                    this.trigger("keydown-left");
                }
            },

            linkClickHandler: function (e) {

                this.trigger("epubLinkClicked", e);
            },

            // ------------------------------------------------------------------------------------ //
            //  "PRIVATE" HELPERS AND UTILITY METHODS                                               //
            // ------------------------------------------------------------------------------------ //

            // Rationale: The "paginator" model uses the scrollWidth of the paginated xhtml content document in order
            //   to calculate the number of pages (given the current screen size etc.). It appears that
            //   the scroll width property is either buggy, unreliable, or changes by small amounts between the time the content
            //   document is paginated and when it is used. Regardless of the cause, the scroll width is understated, which causes
            //   the number of pages to be understated. As a result, the last page of a content document is often not shown when
            //   a user moves to the last page of the content document. This method recalculates the number of pages for the current
            //   scroll width of the content document.
            updatePageNumber: function () {

                var recalculatedNumberOfPages;
                var epubContentDocument = this.getEpubContentDocument();
                var isSyntheticLayout = this.viewerModel.get("syntheticLayout");
                var currScrollWidth = epubContentDocument.scrollWidth;
                var lastScrollWidth = this.reflowablePaginator.get("lastScrollWidth");

                if (lastScrollWidth !== currScrollWidth) {
                    recalculatedNumberOfPages =
                        this.reflowablePaginator.calcNumPages(epubContentDocument, isSyntheticLayout);
                    this.pages.set("numberOfPages", recalculatedNumberOfPages);
                    this.reflowablePaginator.set("lastScrollWidth", currScrollWidth);
                }
            },

            // Rationale: This method delegates the pagination of a content document to the reflowable layout model
            paginateContentDocument: function () {

                var pageInfo = this.reflowablePaginator.paginateContentDocument(this.viewerModel.get("syntheticLayout"),
                    this.offsetDirection(), this.getEpubContentDocument(), this.getReadiumFlowingContent(),
                    this.getFlowingWrapper(), this.spineItemModel.get("firstPageIsOffset"),
                    this.pages.get("currentPages"), this.spineItemModel.get("pageProgressionDirection"),
                    this.viewerModel.get("currentMargin"), this.viewerModel.get("fontSize"));

                this.pages.set("numberOfPages", pageInfo[0]);
                this.viewerModel.get("syntheticLayout") ? this.spineDivider.show() : this.spineDivider.hide();
                this.redrawAnnotations();
                this.pages.resetCurrentPages();
                this.showCurrentPages();
            },

            initializeContentDocument: function () {

                this.reflowableLayout.initializeContentDocument(this.getEpubContentDocument(),
                    this.getReadiumFlowingContent(), this.linkClickHandler, this, this.keydownHandler, this.bindings);
            },

            showPageByElement: function (element) {

                var pageNumber = this.reflowableElementsInfo.getElemPageNumber(element, this.offsetDirection(),
                    this.reflowablePaginator.page_width, this.reflowablePaginator.gap_width,
                    this.getEpubContentDocument());

                if (pageNumber > 0) {

                    this.pages.goToPage(pageNumber, this.viewerModel.get("syntheticLayout"),
                        this.spineItemModel.get("firstPageIsOffset"));
                    this.showCurrentPages();
                } else {
                    // Throw an exception here
                }
            },

            showCurrentPages: function () {

                var currentPageNumber;
                this.hideContent();
                currentPageNumber = this.reflowablePaginator.accountForOffset(this.getReadiumFlowingContent(),
                    this.viewerModel.get("syntheticLayout"), this.spineItemModel.get("firstPageIsOffset"),
                    this.pages.get("currentPages"), this.spineItemModel.get("pageProgressionDirection"));
                this.moveViewportToPage(currentPageNumber);
                this.showContent();
                this.trigger("displayedContentChanged");
            },

            moveViewportToPage: function (pageNumber) {

                var offset = this.calcPageOffset(pageNumber).toString() + "px";
                $(this.getEpubContentDocument()).css(this.offsetDirection(), "-" + offset);

                // if (this.viewerModel.get("twoUp") == false ||
                //     (this.viewerModel.get("twoUp") && page % 2 === 1)) {
                //         // when we change the page, we have to tell MO to update its position
                //         // this.mediaOverlayController.reflowPageChanged();
                // }
            },

            hideContent: function () {
                $(this.getFlowingWrapper()).css("opacity", "0");
            },

            showContent: function () {
                $(this.getFlowingWrapper()).css("opacity", "1");
            },

            calcPageOffset: function (pageNumber) {
                return (pageNumber - 1) * (this.reflowablePaginator.page_width + this.reflowablePaginator.gap_width);
            },

            redrawAnnotations: function () {

                if (this.annotations) {
                    this.annotations.redraw();
                }
            },

            offsetDirection: function () {

                // Rationale: If this book does right to left pagination we need to set the
                //   offset on the right
                if (this.spineItemModel.get("pageProgressionDirection") === "rtl") {
                    return "right";
                } else {
                    return "left";
                }
            }
        });
        return ReflowablePaginationView;
    });
