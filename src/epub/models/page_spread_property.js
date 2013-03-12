// Description: This is a delegate that provides information about the appropriate page-spread property for fixed layout spine items
Epub.PageSpreadProperty = Backbone.Model.extend({

    initialize : function () {

        // "Constants" for page spread class
        this.CENTER_PAGE = "center_page";
        this.LEFT_PAGE = "left_page";
        this.RIGHT_PAGE = "right_page";
    },

    inferiBooksPageSpread : function (spineIndex, numSpineItems) {

        var pageNum = spineIndex + 1;

        // Rationale: For ibooks, odd pages go on the right. This means
        // the first page will always be on the right
        // without a left counterpart, so center it
        if (pageNum === 1) {
            
            return "center_page";
        }
        // Rationale: If the last spine item in the book would be on the left, then
        //   it would have no left counterpart, so center it
        else if (pageNum % 2 === 0 && pageNum === numSpineItems) { 
            
            return "center_page";
        }
        // Rationale: Otherwise first page goes on the right, and then alternate
        // left - right - left - right etc
        else {

            if (pageNum % 2 === 1) {
                return "right_page";
            }
            else {
                return "left_page";
            }
        }
    },

    getPageSpreadFromProperties : function (pageSpreadProperty) {

        if (pageSpreadProperty === "left") {

            return "left_page";
        }
        else if (pageSpreadProperty === "right") {

            return "right_page";
        }
        else {

            return "center_page";
        }
    },

    // NOTE: This method still cannot infer the page spread value when center pages are sporadically specified
    inferUnassignedPageSpread : function (spineIndex, spine, pageProgDirection) {

        var lastSpecifiedPageSpread;
        var numPagesBetween;

        if (spine.at(spineIndex).get("page_spread") === "left" ||
            spine.at(spineIndex).get("page_spread") === "right" ||
            spine.at(spineIndex).get("page_spread") === "center") {

            return this.getPageSpreadFromProperties(spine.at(spineIndex).get("page_spread"));
        }
        // If this is the first spine item, assign left or right based on page progression direction
        else if (spineIndex === 0) {

            return pageProgDirection === "rtl" ? "right_page" : "left_page";
        }
        else {

            // Find last spine item with page-spread value and use it to determine the appropriate value for 
            //   this spine item. This loop iterates, in reverse order, from the current spine index to the
            //   spine item that had a specified page spread specified. 
            for (var currSpineIndex = spineIndex - 1; currSpineIndex >= 0; currSpineIndex--) {

                // REFACTORING CANDIDATE: This would be clearer if the currSpineIndex === 0 case was 
                //   handled seperately. 
                if (currSpineIndex === 0 || spine.at(currSpineIndex).get("page_spread")) {

                    lastSpecifiedPageSpread = this.lastSpecifiedPageSpread(
                        spine.at(currSpineIndex).get("page_spread"), 
                        pageProgDirection
                        );
                    numPagesBetween = spineIndex - currSpineIndex;

                    // Even number of pages between current and last spine item
                    if (numPagesBetween % 2 === 0) {

                        return lastSpecifiedPageSpread === "left" ? "left_page" : 
                            lastSpecifiedPageSpread === "right" ? "right_page" :
                            pageProgDirection === "rtl" ? "left_page" : "right_page";
                    }
                    // Odd number of pages between current and last spine item with a specified page-spread value
                    else {

                        return lastSpecifiedPageSpread === "left" ? "right_page" :
                            lastSpecifiedPageSpread === "right" ? "left_page" :
                            pageProgDirection === "rtl" ? "right_page" : "left_page";
                    }
                }
            }
        }
    },

    lastSpecifiedPageSpread : function (pageSpreadValue, pageProgDirection) {

        // Handles the case where currSpineIndex === 0 and a page-spread value has not been specified
        if (pageSpreadValue && pageSpreadValue !== "") {
            return pageSpreadValue;
        }
        else {
            return pageProgDirection === "rtl" ? "right" : "left";
        }
    }
});