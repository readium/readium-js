define(['require', 'module', 'jquery', 'underscore', 'backbone', 'epub-reflowable/epub_reflowable_module',
    'epub-fixed/epub_fixed_module'], function (require, module, $, _, Backbone, EpubReflowableModule, EpubFixedModule) {

    var LoadStrategy = Backbone.Model.extend({

        defaults : {
            "numFixedPagesPerView" : 100
        },

        initialize : function (attributes, options) {},

        // Description: This method chooses the appropriate page view to load for individual
        //   spine items, and sections of the spine.
        loadSpineItems : function (viewerSettings, annotations, bindings) {

            var spineIndex;
            var currSpineItem;
            var currFixedSpineItems = [];
            var nextSpineItem;
            var pagesViews = [];
            var currPageView;
            var nextSpineItem;
            for (spineIndex = 0; spineIndex <= this.get("spineInfo").length - 1; spineIndex++) {

                currSpineItem = this.get("spineInfo")[spineIndex];

                // A fixed layout spine item
                if (currSpineItem.isFixedLayout) {

                    currFixedSpineItems.push(currSpineItem);

                    // Check how many fixed pages have been added for the next view
                    if (currFixedSpineItems.length === this.get("numFixedPagesPerView")) {

                        currPageView = this.loadFixedPagesView(currFixedSpineItems, viewerSettings);
                        pagesViews.push(currPageView);
                        currFixedSpineItems = [];
                        continue;
                    }

                    nextSpineItem = this.get("spineInfo")[spineIndex + 1];
                    if (nextSpineItem) {

                        if (!nextSpineItem.isFixedLayout) {

                            currPageView = this.loadFixedPagesView(currFixedSpineItems, viewerSettings);
                            pagesViews.push(currPageView);
                            currFixedSpineItems = [];
                        }
                    }
                    else {
                        currPageView = this.loadFixedPagesView(currFixedSpineItems, viewerSettings);
                        pagesViews.push(currPageView);
                        currFixedSpineItems = [];
                    }
                }
                // A scrolling spine item
                else if (currSpineItem.shouldScroll) {

                    // Load the scrolling pages view
                }
                // A reflowable spine item
                else {
                    currPageView = this.loadReflowablePagesView(currSpineItem, viewerSettings, annotations, bindings);
                    pagesViews.push(currPageView);
                }
            }

            return pagesViews;
        },

        loadReflowablePagesView : function (spineItem, viewerSettings, annotations, bindings) {

            var view = new EpubReflowableModule(
                this.get('epubFetch'),
                spineItem,
                viewerSettings,
                annotations,
                bindings
            );

            var pagesViewInfo = {
                pagesView : view,
                spineIndexes : [spineItem.spineIndex],
                isRendered : false,
                type : "reflowable"
            };

            return pagesViewInfo;
        },

        loadFixedPagesView : function (spineItemList, viewerSettings) {

            var view = new EpubFixedModule(
                this.get('epubFetch'),
                spineItemList,
                viewerSettings
            );

            var spineIndexes = [];
            _.each(spineItemList, function (spineItem) {
                spineIndexes.push(spineItem.spineIndex)
            });

            var pagesViewInfo = {
                pagesView : view,
                spineIndexes : spineIndexes,
                isRendered : false,
                type : "fixed"
            };

            return pagesViewInfo;
        }
    });
    return LoadStrategy;
});