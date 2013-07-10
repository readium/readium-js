RJSDemoApp.applyToolbarHandlers = function () {

    // Library panel
    $("#toc-btn").off("click");
    $("#library-btn").on("click", function () {
        RJSDemoApp.toggleLibraryPanel();
    });

    // TOC
    $("#toc-btn").off("click");
    $("#toc-btn").on("click", function () {
        RJSDemoApp.toggleTOCPanel();
    });

    // Prev
    // Remove any existing click handlers
    $("#previous-page-btn").off("click");
    $("#previous-page-btn").on("click", function () {

        if (RJSDemoApp.epub.pageProgressionDirection() === "rtl") {
            RJSDemoApp.epubViewer.nextPage(function () {
                console.log("the page turned");
            });
        }
        else {
            RJSDemoApp.epubViewer.previousPage(function () {
                console.log("the page turned");
            });
        }
    });

    // Next
    // Remove any existing click handlers
    $("#next-page-btn").off("click");
    $("#next-page-btn").on("click", function () {

        if (RJSDemoApp.epub.pageProgressionDirection() === "rtl") {
            RJSDemoApp.epubViewer.previousPage(function () {
                console.log("the page turned");
            });
        }
        else {
            RJSDemoApp.epubViewer.nextPage(function () {
                console.log("the page turned");
            });
        }
    });

    // Layout
    $("#toggle-synthetic-btn").off("click");
    $("#toggle-synthetic-btn").on("click", function () {
        RJSDemoApp.toggleLayout();
    });

    // Layout
    $("#toggle-ast-btn").off("click");
    $("#toggle-ast-btn").on("click", function () {
        RJSDemoApp.toggleAST();
    });
};

RJSDemoApp.applyViewerHandlers = function (epubViewer, tocDocument) {

    epubViewer.off("epubLinkClicked");
    epubViewer.on("epubLinkClicked", function (e) {
        RJSDemoApp.epubLinkClicked(e);
    });

    $(tocDocument).find("a").on("click", function (e) {
        RJSDemoApp.tocLinkClicked(e);
    });

    $(window).off("resize");
    $(window).on("resize", function () {
        RJSDemoApp.setModuleContainerHeight();
        RJSDemoApp.resizeContent();
    });
};

RJSDemoApp.epubLinkClicked = function (e) {

    var href;
    var splitHref;
    var spineIndex;
    e.preventDefault();

    // Check for both href and xlink:href attribute and get value
    if (e.currentTarget.attributes["xlink:href"]) {
        href = e.currentTarget.attributes["xlink:href"].value;
    }
    else {
        href = e.currentTarget.attributes["href"].value;
    }

    // It's a CFI
    if (href.match("epubcfi")) {

        href = href.trim();
        splitHref = href.split("#");
    
        RJSDemoApp.epubViewer.showPageByCFI(splitHref[1], function () {
            console.log("Showed the page using a CFI");
        }, this);        
    }
    // It's a regular id
    else {

        // Get the hash id if it exists
        href = href.trim();
        splitHref = href.split("#");

        spineIndex = RJSDemoApp.epub.getSpineIndexByHref(href);
        if (splitHref[1] === undefined) {      
            RJSDemoApp.epubViewer.showSpineItem(spineIndex, function () {
                console.log("Spine index shown: " + splitHref[0]);
            });
        }
        else {
            RJSDemoApp.epubViewer.showPageByElementId(spineIndex, splitHref[1], function () {
                console.log("Page shown: href: " + splitHref[0] + " & hash id: " + splitHref[1]);
            });
        }
    }
};

RJSDemoApp.tocLinkClicked = function (e) {

    RJSDemoApp.epubLinkClicked(e);
};

RJSDemoApp.resizeContent = function () {

    var libraryIsVisible = RJSDemoApp.viewerPreferences.libraryIsVisible;
    var tocIsVisible = RJSDemoApp.viewerPreferences.tocIsVisible;

    if (!libraryIsVisible && !tocIsVisible) {
        $("#reader-panel").removeClass("span8");
        $("#reader-panel").addClass("span12");
    }
    else {
        $("#reader-panel").removeClass("span12");
        $("#reader-panel").addClass("span8");
    }
    RJSDemoApp.epubViewer.resizeContent();
};

RJSDemoApp.toggleLibraryPanel = function () {

    if (RJSDemoApp.viewerPreferences.libraryIsVisible) {
        $("#library-panel").hide();
        RJSDemoApp.viewerPreferences.libraryIsVisible = false;
    }
    else {
        $("#toc-panel").hide();
        $("#library-panel").show();
        RJSDemoApp.viewerPreferences.tocIsVisible = false;
        RJSDemoApp.viewerPreferences.libraryIsVisible = true;
    }
    RJSDemoApp.resizeContent();
};

RJSDemoApp.toggleTOCPanel = function () {

    if (RJSDemoApp.viewerPreferences.tocIsVisible) {
        $("#toc-panel").hide();
        RJSDemoApp.viewerPreferences.tocIsVisible = false;
    }
    else {
        $("#library-panel").hide();
        $("#toc-panel").show();
        RJSDemoApp.viewerPreferences.tocIsVisible = true;
        RJSDemoApp.viewerPreferences.libraryIsVisible = false;
    }
    RJSDemoApp.resizeContent();
},

RJSDemoApp.toggleLayout = function () {

    if (RJSDemoApp.viewerPreferences.syntheticLayout) {
        RJSDemoApp.epubViewer.setSyntheticLayout(false);
        RJSDemoApp.viewerPreferences.syntheticLayout = false;
    }
    else {
        RJSDemoApp.epubViewer.setSyntheticLayout(true);
        RJSDemoApp.viewerPreferences.syntheticLayout = true;
    }
};

RJSDemoApp.toggleAST = function () {

    if (RJSDemoApp.viewerPreferences.day) {
        RJSDemoApp.epubViewer.customize("alt-style-tag", "night");
        RJSDemoApp.viewerPreferences.day = false;
    }
    else {
        RJSDemoApp.epubViewer.customize("alt-style-tag", "day");
        RJSDemoApp.viewerPreferences.day = true;
    }
};

