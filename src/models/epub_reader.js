EpubReader.EpubReader = Backbone.Model.extend({

    defaults : function () { 
        return {
            "loadedPagesViews" : [],
            "currentPagesViewIndex" : 0
        };
    },

    initialize : function (attributes, options) {

        var spineInfo = this.get("spineInfo");
        this.set("spine", spineInfo.spine);
        this.set("bindings", spineInfo.bindings);
        this.set("annotations", spineInfo.annotations);

        // Rendering strategy options could be implemented here

        // A mechanism to determine whether a reflowable content document should scroll needs to be determined
        this.loadSpineItems();
    },

    // ------------------------------------------------------------------------------------ //  
    //  "PUBLIC" INTERFACE                                                                  //
    // ------------------------------------------------------------------------------------ //  

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

    renderPagesView : function (pagesViewIndex, renderLast, hashFragmentId) {

        var pagesView;
        if (pagesViewIndex >= 0 && pagesViewIndex < this.numberOfLoadedPagesViews()) {

            this.hideRenderedViews();
            this.set({"currentPagesViewIndex" : pagesViewIndex});
            pagesViewInfo = this.getCurrentPagesViewInfo();

            if (pagesViewInfo.isRendered) {
                pagesViewInfo.pagesView.showPagesView();
            }
            else {
                
                viewElement = pagesViewInfo.pagesView.render(renderLast, hashFragmentId);
                $(this.get("parentElement")).append(viewElement);
                pagesViewInfo.isRendered = true;
            }
        }
    },

    renderNextPagesView : function () {

        var nextPagesViewIndex;
        if (this.hasNextPagesView()) {
            nextPagesViewIndex = this.get("currentPagesViewIndex") + 1;
            this.renderPagesView(nextPagesViewIndex, false, undefined);
        }
    },

    renderPreviousPagesView : function () {

        var previousPagesViewIndex;
        if (this.hasPreviousPagesView()) {
            previousPagesViewIndex = this.get("currentPagesViewIndex") - 1;
            this.renderPagesView(previousPagesViewIndex, true, undefined);
        }
    },

    // ------------------------------------------------------------------------------------ //  
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //  

    // spinePositionIsRendered()
    // renderSpinePosition()

    // Description: This method chooses the appropriate page view to load for individual 
    //   spine items, and sections of the spine. 
    loadSpineItems : function () {

        var spineIndex;
        var currSpineItem; 
        var FXLStartIndex;
        var FXLEndIndex;
        for (spineIndex = 0; spineIndex <= this.get("spine").length - 1; spineIndex++) {

            currSpineItem = this.get("spine")[spineIndex];

            // A fixed layout epub
            if (currSpineItem.isFixedLayout) {

                FXLStartIndex = spineIndex;

                // Another loop to find the start and end index of the current FXL part of the spine
                spineIndex++;
                for (spineIndex; spineIndex <= this.get("spine").length - 1; spineIndex++) {

                    currSpineItem = this.get("spine")[spineIndex];
                    if (currSpineItem.isFixedLayout) {
                        FXLEndIndex = spineIndex;
                    }
                    else {
                        break;
                    }
                }
            }
            // A scrolling epub
            else if (currSpineItem.shouldScroll) {

                // Load the scrolling pages view
            }
            // A reflowable epub
            else {
                this.loadReflowableSpineItem(currSpineItem, this.get("viewerSettings"), undefined, this.get("bindings"));
            }
        }
    },

    loadReflowableSpineItem : function (spineItem) {

        var view = new EpubReflowableModule(
            spineItem, 
            this.get("viewerSettings"), 
            this.get("annotations"), 
            this.get("bindings")
            );
        var pagesViewInfo = {
            pagesView : view, 
            spineIndexes : [spineItem.spineIndex],
            isRendered : false
        };

        // Add the pages view to the end of the array
        this.get("loadedPagesViews").push(pagesViewInfo);
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
    }
});