Epub.SpineItem = Epub.ManifestItem.extend({

    defaults : {
        "height" : 0,
        "width" : 0,
        "page_class" : undefined,
        "uri" : undefined,
        "href" : undefined,
        "id" : undefined,
        "idref" : undefined,
        "media_overlay" : undefined,
        "media_type" : undefined,
        "page_prog_dir" : "ltr",
        "properties" : "",
        "spine_index" : undefined
    },

    initialize: function() {
        if (this.isFixedLayout()) {
            this.on("change:content", this.parseMetaTags, this);
            this.loadContent();
        }
    },

    // this method creates the JSON representation of a manifest item
    // that is used to render out a page view.
    buildSectionJSON: function(manifest_item, spine_index) {
        if (!manifest_item) {
            return null;
        }
        var section = Object.create(null);
        section.width = this.get("meta_width") || 0;
        section.height = this.get("meta_height") || 0;
        section.uri = this.packageDocument.resolveUri(manifest_item.get('href'));
        section.page_class = this.getPageSpreadClass(manifest_item, spine_index);
        return section;
    },

    toJSON: function() {
        if (this.isFixedLayout()) {
            this.parseMetaTags();
        }
        var json = {};
        json.width = this.get("meta_width") || 0;
        json.height = this.get("meta_height") || 0;
        json.uri = this.resolveUri(this.get('href'));
        json.page_class = this.getPageSpreadClass();
        return json;
    },

    // when rendering fixed layout pages we need to determine whether the page
    // should be on the left or the right in two up mode, options are:
    //  left_page:      render on the left side
    //  right_page:     render on the right side
    //  center_page:    always center the page horizontally
    // REFACTORING CANDIDATE: This method is too long. 
    getPageSpreadClass: function() {
        var book = this.collection.packageDocument.get("book");
        var spine_index = this.get("spine_index");
        var pageSpreadProperty;
        var spineItems = this.collection;
        var numPagesBetween;
        var lastSpecifiedPageSpread;

        if(book.get("apple_fixed")) {
            // the logic for apple fixed layout is a little different:
            /*
            if(!book.get("open_to_spread")) {
                // page spread is disabled for this book
                return  "center_page"
            }
            else if(spine_index === 0) {
                */
            if(spine_index === 0) {
                // for ibooks, odd pages go on the right. This means
                // the first page (0th index) will always be on the right
                // without a left counterpart, so center it
                return "center_page";
            }
            else if (spine_index % 2 === 1 && 
                spine_index === this.collection.length) {

                // if the last spine item in the book would be on the left, then
                // it would have no left counterpart, so center it
                return "center_page";
            }
            else {
                // otherwise first page goes on the right, and then alternate
                // left - right - left - right etc
                return (spine_index % 2 === 0 ? "right_page" : "left_page");
            }
        }
        else {

            // If the page spread property has been set for this spine item, return 
            // the name of the appropriate spread class. 
            // Note: As there are only three valid values (left, right, center) for the page
            // spread property in ePub 3.0, if the property is set and 
            // it is not "left" or "right, "center" will always be assumed. 
            if (this.get("page_spread")) {

                pageSpreadProperty = this.get("page_spread");
                if (pageSpreadProperty === "left") {

                    return "left_page";
                }
                else if (pageSpreadProperty === "right") {

                    return "right_page";
                }
                else {
                    return "center_page";
                }
            }
            // If the page spread property is not set, we must iterate back through the EPUB's spine items to find 
            //   the last spine item with a page-spread value set. We can use that value, whether there are an even or odd
            //   number of pages between this spine item and the "last" one, and the page progression direction of the EPUB
            //   to determine the appropriate page spread value for this spine item. 
            // REFACTORING CANDIDATE: WAY too much nesting here. This should be moved to it's own method, at the least.
            else {

                // If this is the first spine item, assign left or right based on page progression direction
                if (spine_index === 0) {

                    return book.get("page_prog_dir") === "rtl" ? "right_page" : "left_page";
                }
                else {

                    // Find last spine item with page-spread value and use it to determine the appropriate value for 
                    //   this spine item.
                    for (var currSpineIndex = spine_index - 1; currSpineIndex >= 0; currSpineIndex--) {

                        // REFACTORING CANDIDATE: This would be clearer if the currSpineIndex === 0 case was 
                        //   handled seperately. 
                        if (currSpineIndex === 0 || spineItems.at(currSpineIndex).get("page_spread")) {

                            // Handles the case where currSpineIndex === 0 and a page-spread value has not been specified
                            lastSpecifiedPageSpread = 
                                spineItems.at(currSpineIndex).get("page_spread") ? spineItems.at(currSpineIndex).get("page_spread") : 
                                book.get("page_prog_dir") === "rtl" ? "right" : "left";

                            numPagesBetween = spine_index - currSpineIndex;

                            if (numPagesBetween % 2 === 0) {

                                return lastSpecifiedPageSpread === "left" ? "left_page" : 
                                    lastSpecifiedPageSpread === "right" ? "right_page" :
                                    book.get("page_prog_dir") === "rtl" ? "left_page" : "right_page";
                            }
                            // Odd number of pages between current and last spine item with a specified page-spread value
                            else {

                                return lastSpecifiedPageSpread === "left" ? "right_page" :
                                    lastSpecifiedPageSpread === "right" ? "left_page" :
                                    book.get("page_prog_dir") === "rtl" ? "right_page" : "left_page";
                            }
                        }
                    }
                }
            }
        }
    },

    pageProgressionDirection : function () {

        var book = this.collection.packageDocument.get("book");
        book.get("page_prog_dir");
    },

    isFixedLayout: function() {

        // if it an svg or image then it is fixed layout
        if(this.isSvg() || this.isImage()) {
            return true;
        }

        // if there is a fixed_flow property, then it takes precedence
        if(typeof this.get("fixed_flow") !== 'undefined') {
            return this.get('fixed_flow');
        }

        // nothing special about this spine item, fall back to the books settings
        return this.collection.isBookFixedLayout();
    },

    // Description: Determines if the first page of the content document should be offset in a synthetic layout
    firstPageOffset : function () {

        // Get book properties
        var notFixedLayout = !this.isFixedLayout();
        var pageProgDirIsRTL = this.get("page_prog_dir") === "rtl" ? true : false;
        var pageSpreadLeft = this.get("page_spread") === "left" ? true : false;
        var pageSpreadRight = this.get("page_spread") === "right" ? true : false;

        // Default to no page spread specified if they are both set on the spine item
        if (pageSpreadRight && pageSpreadLeft) {
            pageSpreadRight = false;
            pageSpreadLeft = false;
        }

        if (notFixedLayout) {

            if (pageProgDirIsRTL) {

                if (pageSpreadLeft) {
                    return true;
                }
            }
            else {

                if (pageSpreadRight) {
                    return true;
                }
            }
        }

        return false;
    },

    // REFACTORING CANDIDATE: caching the the fixed layout views. I do not remember the reason that
    // we are doing this. Possible that it is not necessary...
    getPageView: function() {
        if(!this.view) {
            if(this.isImage()) {
                this.view = new Readium.Views.ImagePageView({model: this});
            }
            else {
                this.view = new Readium.Views.FixedPageView({model: this}); 
            }
            
        }
        return this.view;
    },
    
    hasMediaOverlay: function() {
        return !!this.get("media_overlay") && !!this.getMediaOverlay();
    },
    
    getMediaOverlay: function() {
        return this.collection.getMediaOverlay(this.get("media_overlay"));
    }
});