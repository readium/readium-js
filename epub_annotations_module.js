var EpubAnnotationsModule = function(offsetTopAddition, offsetLeftAddition, readerBoundElement) {
    
    var EpubAnnotations = {};

    // Rationale: The order of these matters
    EpubAnnotations.Highlight = Backbone.Model.extend({

    defaults : {
        "isVisible" : false
    },

    initialize : function (attributes, options) {}
});
    EpubAnnotations.Highlighter = Backbone.Model.extend({

    defaults : function () {
        return {
            "selectedNodes" : [],
            "highlightViews" : []
        };
    },

    initialize : function (attributes, options) {},

    // --------------- PRIVATE HELPERS ---------------------------------------

    constructHighlightViews : function () {

        var that = this;
        _.each(this.get("selectedNodes"), function (node, index) {

            var range = document.createRange();
            range.selectNodeContents(node);
            var rects = range.getClientRects();

            _.each(rects, function (rect, index) {

                var highlightTop = rect.top;
                var highlightLeft = rect.left;
                var highlightHeight = rect.height;
                var highlightWidth = rect.width;

                var highlightView = new EpubAnnotations.HighlightView({
                    CFI : that.get("CFI"),
                    top : highlightTop + that.get("offsetTopAddition"),
                    left : highlightLeft + that.get("offsetLeftAddition"),
                    height : highlightHeight,
                    width : highlightWidth
                });

                that.get("highlightViews").push(highlightView);
            });
        });
    },

    renderHighlights : function (viewportElement) {

        this.constructHighlightViews();
        _.each(this.get("highlightViews"), function (view, index) {
            $(viewportElement).append(view.render());
        });
    },

    toInfo : function () {

        return {

            id : this.get("id"),
            type : "highlight",
            CFI : this.get("CFI")
        };
    }
}); 
    EpubAnnotations.Bookmark = Backbone.Model.extend({

    defaults : {
        "isVisible" : false,
        "bookmarkCenteringAdjustment" : 10,
        "bookmarkTopAdjustment" : 15
    },

    initialize : function (attributes, options) {

        // Figure out the top and left of the bookmark
        // This should include the additional offset provided by the annotations object
    },

    getAbsoluteTop : function () {

        var targetElementTop = $(this.get("targetElement")).offset().top;
        var bookmarkAbsoluteTop = this.get("offsetTopAddition") + targetElementTop - this.get("bookmarkTopAdjustment");
        return bookmarkAbsoluteTop;
    },

    getAbsoluteLeft : function () {

        var targetElementLeft = $(this.get("targetElement")).offset().left;
        var bookmarkAbsoluteLeft = this.get("offsetLeftAddition") + targetElementLeft - this.get("bookmarkCenteringAdjustment");
        return bookmarkAbsoluteLeft;
    },

    toInfo : function () {

        return {

            id : this.get("id"),
            type : "bookmark",
            CFI : this.get("CFI")
        };
    }
});
    EpubAnnotations.Annotations = Backbone.Model.extend({

    defaults : function () {
        return {
            "bookmarkViews" : [],
            "highlights" : [],
            "annotationHash" : {},
            "offsetTopAddition" : 0,
            "offsetLeftAddition" : 0,
            "readerBoundElement" : undefined
        };
    },

    initialize : function (attributes, options) {},

    getBookmark : function (id) {

        var bookmarkView = this.get("annotationHash")[id];
        if (bookmarkView) {
            return bookmarkView.bookmark.toInfo();
        }
        else {
            return undefined;
        }
    },

    getHighlight : function (id) {

        var highlight = this.get("annotationHash")[id];
        if (highlight) {
            return highlight.toInfo();
        }
        else {
            return undefined;
        }
    },

    getBookmarks : function () {

        var bookmarks = [];
        _.each(this.get("bookmarkViews"), function (bookmarkView) {

            bookmarks.push(bookmarkView.bookmark.toInfo());
        });
        return bookmarks;
    },

    getHighlights : function () {

        var highlights = [];
        _.each(this.get("highlights"), function (highlight) {

            highlights.push(highlight.toInfo());
        });
        return highlights;
    },

    addBookmark : function (CFI, targetElement, annotationId, offsetTop, offsetLeft) {

        if (!offsetTop) {
            offsetTop = this.get("offsetTopAddition");
        }
        if (!offsetLeft) {
            offsetLeft = this.get("offsetLeftAddition");
        }

        annotationId = annotationId.toString();
        this.validateAnnotationId(annotationId);

        var bookmarkView = new EpubAnnotations.BookmarkView({
            CFI : CFI,
            targetElement : targetElement, 
            offsetTopAddition : offsetTop,
            offsetLeftAddition : offsetLeft,
            id : annotationId.toString()
        });
        this.get("annotationHash")[annotationId] = bookmarkView;
        this.get("bookmarkViews").push(bookmarkView);
        $(this.get("readerBoundElement")).append(bookmarkView.render());
    },

    addHighlight : function (CFI, highlightedTextNodes, annotationId, offsetTop, offsetLeft) {

        if (!offsetTop) {
            offsetTop = this.get("offsetTopAddition");
        }
        if (!offsetLeft) {
            offsetLeft = this.get("offsetLeftAddition");
        }

        annotationId = annotationId.toString();
        this.validateAnnotationId(annotationId);

        var highlighter = new EpubAnnotations.Highlighter({
            CFI : CFI,
            selectedNodes : highlightedTextNodes,
            offsetTopAddition : offsetTop,
            offsetLeftAddition : offsetLeft,
            id : annotationId
        });
        this.get("annotationHash")[annotationId] = highlighter;
        this.get("highlights").push(highlighter);
        highlighter.renderHighlights(this.get("readerBoundElement"));
    },

    // REFACTORING CANDIDATE: Some kind of hash lookup would be more efficient here, might want to 
    //   change the implementation of the annotations as an array
    validateAnnotationId : function (id) {

        if (this.get("annotationHash")[id]) {
            throw new Error("That annotation id already exists; annotation not added");
        }
    }
});
    EpubAnnotations.BookmarkView = Backbone.View.extend({

    el : "<div class='bookmark'></div>",

    initialize : function (options) {

        this.bookmark = new EpubAnnotations.Bookmark({
            CFI : options.CFI,
            targetElement : options.targetElement, 
            offsetTopAddition : options.offsetTopAddition,
            offsetLeftAddition : options.offsetLeftAddition,
            id : options.id
        });
    },

    render : function () {

        var absoluteTop = this.bookmark.getAbsoluteTop();
        var absoluteLeft = this.bookmark.getAbsoluteLeft();
        this.$el.css({ 
            "top" : absoluteTop + "px",
            "left" : absoluteLeft + "px"
        });
        return this.el;
    }
});
    EpubAnnotations.HighlightView = Backbone.View.extend({

    el : "<div class='highlight'></div>",

    events : {
        "hover .highlight" : "setHoverOpacity"
    },

    initialize : function (options) {

        this.highlight = new EpubAnnotations.Highlight({
            CFI : options.CFI,
            top : options.top,
            left : options.left,
            height : options.height,
            width : options.width
        });
    },

    render : function () {

        this.$el.css({ 
            "top" : this.highlight.get("top") + "px",
            "left" : this.highlight.get("left") + "px",
            "height" : this.highlight.get("height") + "px",
            "width" : this.highlight.get("width") + "px"
        });
        return this.el;
    },

    liftHighlight : function () {

        this.$el.toggleClass("highlight");
        this.$el.toggleClass("liftedHighlight");
    },

    setHoverOpacity : function () {

        this.$el.css({
            "opacity" : "0.1"
        });
    }
});

    var annotations = new EpubAnnotations.Annotations({
        offsetTopAddition : offsetTopAddition, 
        offsetLeftAddition : offsetLeftAddition, 
        readerBoundElement : readerBoundElement
    });

    // Description: The public interface
    return {

        addBookmark : function (CFI, targetElement, id, offsetTop, offsetLeft) { return annotations.addBookmark.call(annotations, CFI, targetElement, id, offsetTop, offsetLeft); },
        getBookmark : function (id) { return annotations.getBookmark.call(annotations, id); },
        getBookmarks : function () { return annotations.getBookmarks.call(annotations); }, 
        addHighlight : function (CFI, highlightedTextNodes, id, offsetTop, offsetLeft) { return annotations.addHighlight.call(annotations, CFI, highlightedTextNodes, id, offsetTop, offsetLeft); },
        getHighlight : function (id) { return annotations.getHighlight.call(annotations, id); },
        getHighlights : function () { return annotations.getHighlights.call(annotations); }
    };
};
