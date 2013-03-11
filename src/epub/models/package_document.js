// Description: This model provides an interface for navigating an EPUB's package document
Epub.PackageDocument = Backbone.Model.extend({

    initialize : function (attributes, options) {

        this.manifest = new Epub.Manifest(this.get("packageDocumentObject").manifest);
        this.spine = new Epub.Spine(this.get("packageDocumentObject").spine);
        this.metadata = new Epub.Metadata(this.get("packageDocumentObject").metadata);
    },

    getManifestItemById : function (id) {

        var foundManifestItem = this.manifest.find(
            function (manifestItem) { 
                if (manifestItem.get("id") === id) {
                    return manifestItem;
                }
            });
        return foundManifestItem;
    },

    getManifestItemByIdref : function (idref) {

        var foundManifestItem = this.getManifestItemById(idref);
        return foundManifestItem;
    },


    // Not sure if this method is that useful.
    // getSpineItemById : function (id) {

    //     var foundSpineItem = this.spine.find(
    //         function (spineItem) { 
    //             if (spineItem.get("id") === id) {
    //                 return spineItem;
    //             }
    //         });
    //     return foundSpineItem;
    // },

    getSpineItem : function (spineIndex) {
        return this.spine.at(spineIndex);
    },

    spineLength : function () {
        return this.spine.length;
    },

    // Description: gets the next position in the spine for which the
    // spineItem does not have `linear='no'`. The start
    // param is the non-inclusive position to begin the search
    // from. If start is not supplied, the search will begin at
    // postion 0. If no linear position can be found, this 
    // function returns undefined
    getNextLinearSpinePosition : function (currSpineIndex) {

        var spine = this.spine;
        if (currSpineIndex === undefined || currSpineIndex < 0) {
            currSpineIndex = 0;

            if (spine.at(currSpineIndex).get("linear") !== "no") {
                return currSpineIndex;
            }
        }

        while (currSpineIndex < this.spineLength() - 1) {
            currSpineIndex += 1;
            if (spine.at(currSpineIndex).get("linear") !== "no") {
                return currSpineIndex;
            }
        }

        // No next linear spine position.
        return undefined; 
    },

    // Description: gets the previous position in the spine for which the
    // spineItem does not have `linear='no'`. The start
    // param is the non-inclusive position to begin the search
    // from. If start is not supplied, the search will begin at
    // the end of the spine. If no linear position can be found, 
    // this function returns undefined
    getPrevLinearSpinePosition : function(currSpineIndex) {

        var spine = this.spine;
        if (currSpineIndex === undefined || currSpineIndex > this.spineLength() - 1) {
            currSpineIndex = this.spineLength() - 1;

            if (spine.at(currSpineIndex).get("linear") !== "no") {
                return currSpineIndex;
            }
        }

        while (currSpineIndex > 0) {
            currSpineIndex -= 1;
            if (spine.at(currSpineIndex).get("linear") !== "no") {
                return currSpineIndex;
            }
        }

        // No previous linear spine position.
        return undefined;
    },

    pageProgressionDirection : function () {

        if (this.metadata.get("page_prog_dir") === "rtl") {
            return "rtl";
        }
        else if (this.metadata.get("page_prog_dir") === "default") {
            return "default";
        }
        else {
            return "ltr";
        }
    },


    // ----------------------- PRIVATE HELPERS -------------------------------- //


    // when rendering fixed layout pages we need to determine whether the page
    // should be on the left or the right in two up mode, options are:
    //  left_page:      render on the left side
    //  right_page:     render on the right side
    //  center_page:    always center the page horizontally
    // NOTE: Look into how spine items with the linear="no" property affect this algorithm 

    assignPageSpreadClass : function () {
        var book = this.collection.packageDocument.get("book");
        var spine_index = this.get("spine_index");
        var pageSpreadProperty;
        var spineItems = this.collection;
        var numPagesBetween;
        var lastSpecifiedPageSpread;

        // If the epub is apple fixed layout
        if (this.metadata.get("apple_fixed")) {

            var numSpineItems = this.spine.length;
            this.spine.each(function (spineItem, spineIndex) {


                spineItem.set({ pageSpreadClass : });
            });
        }
        else {
            // For each spine item
            this.spine.each(function (spineItem, spineIndex) {

                // If the page spread property has been set for this spine item, return 
                // the name of the appropriate spread class. 
                // Note: As there are only three valid values (left, right, center) for the page
                // spread property in ePub 3.0, if the property is set and 
                // it is not "left" or "right, "center" will always be assumed. 
                if (spineItem.get("page_spread")) {

                    var manifestItem = this.getManifestItemByIdref(spineItem.get("idref"));
                    pageSpreadProperty = manifestItem.get("page_spread");
                    // Then get the delegate to return the appropriate page spread class
                }
                // If the page spread property is not set, we must iterate back through the EPUB's spine items to find 
                //   the last spine item with a page-spread value set. We can use that value, whether there are an even or odd
                //   number of pages between this spine item and the "last" one, and the page progression direction of the EPUB
                //   to determine the appropriate page spread value for this spine item. 
                else {

                    this.inferPageSpread(spineItem, spineIndex);
                }
            });
        }
    },


    // This doesn't work at the moment.
    getTocItem : function() {
        var manifest = this.get("manifest");
        var spine_id = this.get("metadata").ncx;

        var item = manifest.find(function(item){

            if (item.get("properties").indexOf("nav") !== -1) {
                return true;
            }
            else {
                return false;
            }
        });

        if( item ) {
            return item;
        }

        if( spine_id && spine_id.length > 0 ) {
            return manifest.find(function(item) {
                return item.get("id") === spine_id;
            });
        }

        return null;
    },


    // NOTE: Media overlays are temporarily disabled
    // getMediaOverlayItem : function(idref) {
    //     // just look up the object in the mo_map
    //     var map = this.get("mo_map");
    //     return map && map[idref];
    // },
});
