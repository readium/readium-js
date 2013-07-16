define(['require', 'module', 'jquery', 'underscore', 'backbone', 'URIjs/URI', 'epub-cfi/cfi_module', './load_strategy'],
    function (require, module, $, _, Backbone, URI, EpubCFIModule, LoadStrategy) {

    var EpubReader = Backbone.Model.extend({

        defaults : function () {
            return {
                "loadedPagesViews" : [],
                "currentPagesViewIndex" : 0,
                "pagesViewEventList" : []
            };
        },

        initialize : function (attributes, options) {

            var spineInfo = this.get("spineInfo");
            this.set("spine", spineInfo.spine);
            this.set("bindings", spineInfo.bindings);
            this.set("annotations", spineInfo.annotations);
            this.get("viewerSettings").customStyles = [];

            this.loadStrategy = new LoadStrategy({
                epubFetch: this.get("epubFetch"),
                spineInfo : this.get("spine")
            });
            this.cfi = new EpubCFIModule();
        },

        // ------------------------------------------------------------------------------------ //
        //  "PUBLIC" INTERFACE                                                                  //
        // ------------------------------------------------------------------------------------ //

        // Description: This method chooses the appropriate page view to load for individual
        //   spine items, and sections of the spine.
        loadSpineItems : function () {

            var pagesViews = this.loadStrategy.loadSpineItems(this.get("viewerSettings"), this.get("annotations"), this.get("bindings"));
            this.set("loadedPagesViews", pagesViews);

            if (this.get("renderStrategy") === "eager") {
                this.eagerRenderStrategy();
            }
            else if (this.get("renderStrategy") === "lazy") {
                this.trigger("epubLoaded");
            }
        },

        numberOfLoadedPagesViews : function () {

            return this.get("loadedPagesViews").length;
        },

        hasNextPagesView : function () {

            return this.get("currentPagesViewIndex") < this.numberOfLoadedPagesViews() - 1 ? true : false;
        },

        hasPreviousPagesView : function () {

            return this.get("currentPagesViewIndex") > 0 ? true : false;
        },

        getCurrentPagesView : function () {

            return this.get("loadedPagesViews")[this.get("currentPagesViewIndex")].pagesView;
        },

        renderPagesView : function (pagesViewIndex, callback, callbackContext) {

            var pagesViewInfo;
            var pagesView;
            var that = this;

            if (pagesViewIndex >= 0 && pagesViewIndex < this.numberOfLoadedPagesViews()) {

                this.hideRenderedViews();
                this.set({"currentPagesViewIndex" : pagesViewIndex});
                pagesViewInfo = this.getCurrentPagesViewInfo();
                pagesView = pagesViewInfo.pagesView;

                if (pagesViewInfo.isRendered) {

                    pagesView.showPagesView();
                    this.applyPreferences(pagesView);
                    this.fitCurrentPagesView();
                    callback.call(callbackContext, pagesView);
                }
                else {

                    // Invoke callback when the content document loads
                    pagesView.on("contentDocumentLoaded", function (result) {

                        pagesView.showPagesView();
                        that.applyPreferences(pagesView);

                        _.each(that.get("pagesViewEventList"), function (eventInfo) {
                            pagesView.on(eventInfo.eventName, eventInfo.callback, eventInfo.callbackContext);
                        });

                        callback.call(callbackContext, pagesView);
                    }, this);

                    $(this.get("parentElement")).append(pagesView.render(false, undefined));
                    that.setLastRenderSize(pagesViewInfo, $(that.get("parentElement")).height(), $(that.get("parentElement")).width());
                    pagesViewInfo.isRendered = true;
                }
            }
        },

        renderNextPagesView : function (callback, callbackContext) {

            var nextPagesViewIndex = this.get("currentPagesViewIndex") + 1;
            this.renderPagesView(nextPagesViewIndex, function (pagesView) {

                pagesView.showPageByNumber(1);
                callback.call(callbackContext);
            }, callbackContext);
        },

        renderPreviousPagesView : function (callback, callbackContext) {

            var previousPagesViewIndex = this.get("currentPagesViewIndex") - 1;
            this.renderPagesView(previousPagesViewIndex, function (pagesView) {

                pagesView.showPageByNumber(pagesView.numberOfPages());
                callback.call(callbackContext);
            }, callbackContext);
        },

        attachEventHandler : function (eventName, callback, callbackContext) {

            // Rationale: Maintain a list of the callbacks, which need to be attached when pages views are loaded
            this.get("pagesViewEventList").push({
                eventName : eventName,
                callback : callback,
                callbackContext : callbackContext
            });

            // Attach the event handler to each current pages view
            _.each(this.get("loadedPagesViews"), function (pagesViewInfo) {
                pagesViewInfo.pagesView.on(eventName, callback, callbackContext);
            }, this);
        },

        removeEventHandler : function (eventName) {

            var that = this;
            // Find index of events
            var indexOfEventsToRemove = [];
            _.each(this.get("pagesViewEventList"), function (pagesViewEvent, index) {

                if (pagesViewEvent.eventName === eventName) {
                    indexOfEventsToRemove.push(index);
                }
            });

            // Remove them in reverse order, so each index is still valid
            indexOfEventsToRemove.reverse();
            _.each(indexOfEventsToRemove, function (indexToRemove) {
                that.get("pagesViewEventList").splice(indexToRemove, 1);
            });

            // Remove event handlers on views
            _.each(this.get("loadedPagesViews"), function (pagesViewInfo) {
                pagesViewInfo.pagesView.off(eventName);
            }, this);
        },

        // REFACTORING CANDIDATE: For consistency, it might make more sense if each of the page sets kept track
        //   of their own last size and made the decision as to whether to resize or not. Or maybe that doesn't make
        //   sense.... something to think about.
        fitCurrentPagesView : function () {

            var readerElementHeight = this.get("parentElement").height();
            var readerElementWidth = this.get("parentElement").width();

            var currPagesViewInfo = this.getCurrentPagesViewInfo();
            var heightIsDifferent = currPagesViewInfo.lastRenderHeight !== readerElementHeight ? true : false;
            var widthIsDifferent = currPagesViewInfo.lastRenderWidth !== readerElementWidth ? true : false;

            if (heightIsDifferent || widthIsDifferent) {
                this.setLastRenderSize(currPagesViewInfo, readerElementHeight, readerElementWidth);
                currPagesViewInfo.pagesView.resizeContent();
            }
        },

        // Description: Finds the first spine index in the primary reading order
        getFirstSpineIndex : function () {

            var foundSpineItem = _.find(this.get("spine"), function (spineItem, index) {

                if (spineItem.linear) {
                    return true;
                }
            });

            return foundSpineItem.spineIndex;
        },

        // ------------------------------------------------------------------------------------ //
        //  "PRIVATE" HELPERS                                                                   //
        // ------------------------------------------------------------------------------------ //

        eagerRenderStrategy : function () {

            var that = this;
            var numPagesViewsToLoad = this.get("loadedPagesViews").length;

            _.each(this.get("loadedPagesViews"), function (pagesViewInfo) {

                pagesViewInfo.pagesView.on("contentDocumentLoaded", function (viewElement) {

                    pagesViewInfo.isRendered = true;
                    pagesViewInfo.pagesView.hidePagesView();

                    numPagesViewsToLoad = numPagesViewsToLoad - 1;
                    if (numPagesViewsToLoad === 0) {
                        that.trigger("epubLoaded");
                    }

                    // Attach list of event handlers
                    _.each(that.get("pagesViewEventList"), function (eventInfo) {
                        pagesViewInfo.pagesView.on(eventInfo.eventName, eventInfo.callback, eventInfo.callbackContext);
                    });
                });

                // This will cause the pages view to try to retrieve its resources
                $(that.get("parentElement")).append(pagesViewInfo.pagesView.render(false, undefined));
                that.setLastRenderSize(pagesViewInfo, $(that.get("parentElement")).height(), $(that.get("parentElement")).width());
            });

            setTimeout(function () {

                if (numPagesViewsToLoad != 0) {
                    // throw an exception
                }

            }, 1000);
        },

        getCurrentPagesViewInfo : function () {

            return this.get("loadedPagesViews")[this.get("currentPagesViewIndex")];
        },

        hideRenderedViews : function () {

            _.each(this.get("loadedPagesViews"), function (pagesViewInfo) {

                if (pagesViewInfo.isRendered) {
                    pagesViewInfo.pagesView.hidePagesView();
                }
            });
        },

        // REFACTORING CANDIDATE: The each method is causing numPages and currentPage to be hoisted into the global
        //   namespace, I believe. Bad bad. Check this.
        calculatePageNumberInfo : function () {

            var that = this;
            var numPages = 0;
            var currentPage;
            _.each(this.get("loadedPagesViews"), function (pagesViewInfo) {

                // Calculate current page number
                if (that.getCurrentPagesView() === pagesViewInfo.pagesView) {
                    currentPage = numPages + pagesViewInfo.pagesView.currentPage()[0];
                }

                // Sum up number of pages
                if (pagesViewInfo.isRendered) {
                    numPages += pagesViewInfo.pagesView.numberOfPages();
                }
            });

            return {
                numPages : numPages,
                currentPage : currentPage
            };
        },

        // REFACTORING CANDIDATE: This method should be replaced when the epub reader api is changed to have an
        //   instantiated epub module passed to it.
        findSpineIndex : function (contentDocumentHref) {

            var contentDocHref = contentDocumentHref;
            var foundSpineItem;

            foundSpineItem = _.find(this.get("spine"), function (spineItem, index) {
                console.log('looking for [' + contentDocumentHref + '] in ' + spineItem.contentDocumentURI);
                var uri = new URI(spineItem.contentDocumentURI);
                var filename = uri.filename();
                if (contentDocumentHref.trim() === filename.trim()) {
                    console.log('FOUND [' + contentDocumentHref + '] in [' + filename + ']!');
                    return true;
                }
            });

            return foundSpineItem.spineIndex;
        },

        getPagesViewInfo : function (spineIndex) {

            var foundPagesViewInfo = _.find(this.get("loadedPagesViews"), function (currPagesViewInfo, index) {

                var foundSpineIndex = _.find(currPagesViewInfo.spineIndexes, function (currSpineIndex) {
                    if (currSpineIndex === spineIndex) {
                        return true;
                    }
                });

                // Only checking for null and undefined, as "foundSpineIndex" can be 0, which evaluates as falsy
                if (foundSpineIndex !== undefined && foundSpineIndex !== null) {
                    return true;
                }
            });

            return foundPagesViewInfo;
        },

        getPagesViewIndex : function (spineIndex) {

            var foundPagesViewIndex;
            _.find(this.get("loadedPagesViews"), function (currPagesViewInfo, index) {

                var foundSpineIndex = _.find(currPagesViewInfo.spineIndexes, function (currSpineIndex) {
                    if (currSpineIndex === spineIndex) {
                        return true;
                    }
                });

                // Only checking for null and undefined, as "foundSpineIndex" can be 0, which evaluates as falsy
                if (foundSpineIndex !== undefined && foundSpineIndex !== null) {
                    foundPagesViewIndex = index;
                    return true;
                }
            });

            return foundPagesViewIndex;
        },

        applyPreferences : function (pagesView) {

            var preferences = this.get("viewerSettings");
            pagesView.setSyntheticLayout(preferences.syntheticLayout);

            // Apply all current preferences to the next page set
            pagesView.customize("margin", preferences.currentMargin + "");
            pagesView.customize("fontSize", preferences.fontSize + "")
            _.each(preferences.customStyles, function (customStyle) {
                pagesView.customize(customStyle.customProperty, customStyle.styleNameOrCSSObject);
            });
        },

        setLastRenderSize : function (pagesViewInfo, height, width) {

            pagesViewInfo.lastRenderHeight = height;
            pagesViewInfo.lastRenderWidth = width;
        }
    });
    return EpubReader;
});