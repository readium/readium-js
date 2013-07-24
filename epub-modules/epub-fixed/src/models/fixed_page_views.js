define(
    ['require', 'module', 'jquery', 'underscore', 'backbone', './fixed_page_number_logic', '../views/fixed_page_view',
        '../views/image_page_view'],
    function (require, module, $, _, Backbone, PageNumberDisplayLogic, FixedPageView, ImagePageView) {

        var FixedPageViews = Backbone.Model.extend({

            defaults: function () {

                return {
                    "fixedPages": [],
                    "currentPages": [1]
                }
            },

            // -------------------------------------------- PUBLIC INTERFACE ---------------------------------

            initialize: function (attributes, options) {

                this.fixedPagination = new PageNumberDisplayLogic({ spineObjects: this.get("spineObjects") });

                // Rationale: Get the page progression direction off the first spine object. This assumes that ppd is the
                //   same for all FXL spine objects in the epub - which it should be.
                this.set("pageProgressionDirection", this.get("spineObjects")[0].pageProgressionDirection);
            },

            renderFixedPages: function (bindingElement, viewerSettings, linkClickHandler, handlerContext) {
                var that = this;

                // Reset the default for a synthetic layout
                if (viewerSettings.syntheticLayout) {
                    this.set("currentPages", [1, 2]);
                }

                this.loadPageViews(viewerSettings, function () {
                    that.renderAll(bindingElement, linkClickHandler, handlerContext, viewerSettings.syntheticLayout);
                });
            },

            nextPage: function (twoUp, pageSetEventContext) {

                var newPageNums;
                if (!this.onLastPage()) {

                    newPageNums = this.fixedPagination.getNextPageNumbers(this.get("currentPages"), twoUp,
                        this.get("pageProgressionDirection"));
                    this.resetCurrentPages(newPageNums);

                    // Trigger events
                    pageSetEventContext.trigger("atNextPage");
                    pageSetEventContext.trigger("displayedContentChanged");
                    this.onLastPage() ? pageSetEventContext.trigger("atLastPage") : undefined;
                } else {
                    pageSetEventContext.trigger("atLastPage");
                }
            },

            previousPage: function (twoUp, pageSetEventContext) {

                var newPageNums;
                if (!this.onFirstPage()) {

                    newPageNums = this.fixedPagination.getPreviousPageNumbers(this.get("currentPages"), twoUp,
                        this.get("pageProgressionDirection"));
                    this.resetCurrentPages(newPageNums);

                    // Trigger events
                    pageSetEventContext.trigger("atPreviousPage");
                    pageSetEventContext.trigger("displayedContentChanged");
                    this.onFirstPage() ? pageSetEventContext.trigger("atFirstPage") : undefined;
                } else {
                    pageSetEventContext.trigger("atFirstPage");
                }
            },

            onFirstPage: function () {

                if (this.get("currentPages")[0] <= 1) {
                    return true;
                }

                return false;
            },

            onLastPage: function () {

                if (this.get("currentPages")[0]) {
                    if (this.get("currentPages")[0] >= this.numberOfPages()) {
                        return true;
                    }
                }

                if (this.get("currentPages")[1]) {
                    if (this.get("currentPages")[1] >= this.numberOfPages()) {
                        return true;
                    }
                }

                return false;
            },

            showPageNumber: function (pageNumber, syntheticLayout) {

                var pageIndexToShow;
                var fixedPageView;
                var pageNumsToShow = this.fixedPagination.getPageNumbers(pageNumber, syntheticLayout,
                    this.get("pageProgressionDirection"));
                this.resetCurrentPages(pageNumsToShow);
            },

            setSyntheticLayout: function (isSynthetic) {

                var newPageNumbers;
                if (isSynthetic) {

                    _.each(this.get("fixedPages"), function (fixedPageInfo) {
                        fixedPageInfo.fixedPageView.setSyntheticPageSpreadStyle();
                    });
                } else {

                    _.each(this.get("fixedPages"), function (fixedPageInfo) {
                        fixedPageInfo.fixedPageView.setSinglePageSpreadStyle();
                    });
                }

                // Rationale: This method toggles the page numbers
                newPageNumbers = this.fixedPagination.getPageNumbersForTwoUp(this.get("currentPages"), undefined,
                    this.get("pageProgressionDirection"));
                this.resetCurrentPages(newPageNumbers);
            },

            getPageViewInfo: function (pageNumber) {

                var pageIndex = pageNumber - 1;
                return this.get("fixedPages")[pageIndex];
            },

            // -------------------------------------------- PRIVATE HELPERS ---------------------------------

            hidePageViews: function () {

                _.each(this.get("fixedPages"), function (fixedPageInfo) {
                    fixedPageInfo.fixedPageView.hidePage();
                });
            },

            numberOfPages: function () {

                return this.get("fixedPages").length;
            },

            initializeFixedImagePageInfo: function (spineObject, imageSrc, viewerSettings, fixedPageViewInfo,
                                                    callback) {
                var that = this;
                var fixedPageView;
                fixedPageView = that.initializeImagePage(spineObject.pageSpread, imageSrc, viewerSettings);
                // Initialize info object
                fixedPageViewInfo.fixedPageView = fixedPageView;
                fixedPageView.pageType = spineObject.fixedLayoutType;
                fixedPageView.isRendered = false;
                fixedPageView.spineIndex = spineObject.spineIndex;
                fixedPageView.pageSpread = spineObject.pageSpread;

                callback();
            },

            initializeFixedPageInfo: function (spineObject, imageSrc, viewerSettings, fixedPageViewInfo,
                                                    callback) {
                var that = this;
                var fixedPageView;
                fixedPageView = that.initializeFixedPage(spineObject.pageSpread, spineObject.fixedLayoutType, imageSrc,
                    viewerSettings);
                // Initialize info object
                fixedPageViewInfo.fixedPageView = fixedPageView;
                fixedPageView.pageType = spineObject.fixedLayoutType;
                fixedPageView.isRendered = false;
                fixedPageView.spineIndex = spineObject.spineIndex;
                fixedPageView.pageSpread = spineObject.pageSpread;

                callback();
            },

            fetchPlainAndInitializePage: function (initializePageInfoFunction, spineObject, viewerSettings, fixedPageViewInfo, callback) {
                var that = this;
                var contentUri = spineObject.contentDocumentURI;
                initializePageInfoFunction.call(that, spineObject, contentUri, viewerSettings, fixedPageViewInfo, callback);

            },

            fetchPackedAndInitializePage: function (initializePageInfoFunction, spineObject, viewerSettings, fixedPageViewInfo, callback) {
                var that = this;
                var contentUri = spineObject.contentDocumentURI;
                var epubFetch = that.get('epubFetch');

                epubFetch.relativeToPackageFetchFileContents(contentUri, 'blob', function (contentData) {
                    var objectContentUri = window.URL.createObjectURL(contentData);
                    initializePageInfoFunction.call(that, spineObject, objectContentUri, viewerSettings, fixedPageViewInfo, callback);
                }, function (err) {
                    console.error('Fatal ERROR when initializing page from URI [' + contentUri + ']:');
                    console.error(err);
                })
            },

            loadPageView: function(spineObject, viewerSettings) {
                var that = this;
                var epubFetch = that.get('epubFetch');

                var fixedPageViewInfo = {};
                var spineObjectInitializationDeferred = $.Deferred();

                var initializePageInfoFunction;
                var contentFetchingFunction;

                if (epubFetch.isPackageExploded()) {
                    contentFetchingFunction = that.fetchPlainAndInitializePage;
                }   else {
                    contentFetchingFunction = that.fetchPackedAndInitializePage;
                }

                if (spineObject.fixedLayoutType === "image") {
                    initializePageInfoFunction = that.initializeFixedImagePageInfo;
                } else {
                    // SVG and all others
                    initializePageInfoFunction = that.initializeFixedPageInfo;
                }

                console.log('initializing page with fixedLayoutType [' + spineObject.fixedLayoutType +
                    '], contentDocumentURI: [' + spineObject.contentDocumentURI + '] from ' +
                    (epubFetch.isPackageExploded() ? 'exploded' : 'zipped' ) + ' EPUB');

                contentFetchingFunction.call(that, initializePageInfoFunction, spineObject, viewerSettings,
                    fixedPageViewInfo, spineObjectInitializationDeferred.resolve);

                return [fixedPageViewInfo, spineObjectInitializationDeferred];
            },

            loadPageViews: function (viewerSettings, finishCallback) {

                var that = this;
                var initializationDeferreds = [];
                _.each(this.get("spineObjects"), function (spineObject) {
                    // Get the fixedPageViewInfo object and push its reference onto fixedPages array. The object
                    // at this moment will most probably empty, since its corresponding page starts to be loaded
                    // asynchronously at this moment. Eventually, it will load, end then its corresponding Deferred
                    // will become resolved.
                    // BTW, the statement below asks for using JavaScript 1.7 destructuring assignments but that
                    // language feature is too new to use it...
                    var retArr = that.loadPageView(spineObject, viewerSettings);
                    var fixedPageViewInfo = retArr[0];
                    var spineObjectInitializationDeferred = retArr[1];
                    that.get("fixedPages").push(fixedPageViewInfo);
                    initializationDeferreds.push(spineObjectInitializationDeferred);
                });
                $.when.apply($, initializationDeferreds).done(function () {
                    console.log('all fixed page deferreds done.');
                    finishCallback();
                });
            },

            // REFACTORING CANDIDATE: the pageSetEventContext can be used to trigger the epubLoaded event; also, epubLoaded
            //   should be renamed to something like pageSetLoaded.
            renderAll: function (bindingElement, linkClickHandler, handlerContext, isSynthetic) {

                var that = this;
                var numFixedPages = this.get("fixedPages").length;

                _.each(this.get("fixedPages"), function (fixedPageViewInfo) {

                    fixedPageViewInfo.fixedPageView.on("contentDocumentLoaded", function (viewElement) {

                        fixedPageViewInfo.isRendered = true;
                        fixedPageViewInfo.fixedPageView.hidePage();

                        numFixedPages = numFixedPages - 1;

                        console.log('rendered page, numfixedpages: ' + numFixedPages);
                        if (numFixedPages === 0) {
                            console.log('triggering epubLoaded');
                            console.trace();
                            that.trigger("epubLoaded");
                        }
                    });

                    that.addPageViewToDom(bindingElement,
                        fixedPageViewInfo.fixedPageView.render(false, undefined, linkClickHandler, handlerContext,
                            isSynthetic));
                });

                setTimeout(function () {

                    if (numFixedPages != 0) {
                        // throw an exception
                    }

                }, 1000);
            },

            addPageViewToDom: function (bindingElement, pageViewElement) {

                $(bindingElement).append(pageViewElement);
            },

            resetCurrentPages: function (currentPages) {

                this.set("currentPages", currentPages);
                this.hidePageViews();

                if (currentPages[0] !== undefined && currentPages[0] !== null) {
                    this.getPageViewInfo(currentPages[0]).fixedPageView.showPage();
                }

                if (currentPages[1] !== undefined && currentPages[1] !== null) {
                    this.getPageViewInfo(currentPages[1]).fixedPageView.showPage();
                }
            },

            initializeImagePage: function (pageSpread, imageSrc, viewerSettings) {

                console.log('initializeImagePage imageSrc: ' + imageSrc);

                return new ImagePageView({
                    pageSpread: pageSpread,
                    imageSrc: imageSrc,
                    viewerSettings: viewerSettings
                });
            },

            initializeFixedPage: function (pageSpread, fixedLayoutType, iframeSrc, viewerSettings) {

                return new FixedPageView({
                    pageSpread: pageSpread,
                    fixedLayoutType: fixedLayoutType,
                    iframeSrc: iframeSrc,
                    viewerSettings: viewerSettings
                });
            },

            resizePageViews: function (isSynthetic) {

                _.each(this.get("fixedPages"), function (fixedPageViewInfo) {
                    fixedPageViewInfo.fixedPageView.setPageSize(isSynthetic);
                });
            }
        });
        return FixedPageViews;
    });