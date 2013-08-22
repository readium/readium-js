var pathsReadium = {
    jquery: 'jquery-1.9.1',
    underscore: 'underscore-1.4.4',
    backbone: 'backbone-0.9.10',
    Readium: './readium-js/Readium'
};

require.config({
    baseUrl: '../lib/',
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        }
    },
    paths: pathsReadium
});

// TODO: eliminate this global
RJSDemoApp = {};


require(['jquery', 'underscore', 'Readium', '../test_site/event_handling'],
    function ($, _, Readium,  EventHandling) {

    RJSDemoApp.setModuleContainerHeight = function () {
        $("#reader").css({ "height": $(window).height() * 0.85 + "px" });
    };

    RJSDemoApp.addLibraryList = function ($ulElementContainer, libraryJson) {

        _.each(libraryJson.library_epubs, function (currEpub) {

            var $currLi = $('<li><a id="' + currEpub.url_to_package_doc + '" href="#">' + currEpub.title + '</a></li>');
            $currLi.on("click", function () {
                RJSDemoApp.loadAndRenderEpub(currEpub.url_to_package_doc);
            });
            $ulElementContainer.append($currLi);
        });
    };

    RJSDemoApp.addTOC = function (tocIframe) {

        // $(tocIframe).off("load");

        // // On TOC load, add all the link handlers
        // if (!RJSDemoApp.epub.tocIsNcx()) {

        //     $(tocIframe).on("load", function () {
        //         $(tocIframe).show();
        //         RJSDemoApp.applyViewerHandlers(RJSDemoApp.epubViewer, $(tocIframe)[0].contentDocument);
        //     });
        // }

        // var tocUrl = RJSDemoApp.epub.getTocURL();

        // RJSDemoApp.epub.generateTocListDOM(function (navList) {
        //     if (RJSDemoApp.epub.tocIsNcx()) {
        //         $(tocIframe).parent().append(navList);
        //         $(tocIframe).hide();
        //         RJSDemoApp.applyViewerHandlers(RJSDemoApp.epubViewer, $(tocIframe).parent()[0]);
        //     } else {
        //         if (RJSDemoApp.epubFetch.isPackageExploded()) {
        //             // With exploded documents, can simply set the TOC IFRAME's src
        //             $(tocIframe).attr("src", tocUrl);
        //         } else {
        //             var tocContentDocument = tocIframe.contentDocument;
        //             tocContentDocument.replaceChild(navList.documentElement, tocContentDocument.documentElement);
        //             // load event doesn't trigger when replacing on the DOM level - need to trigger it artificially:
        //             $(tocIframe).trigger('load');
        //         }
        //     }
        // });
    };

    // This function will retrieve a package document and load an EPUB
    RJSDemoApp.loadAndRenderEpub = function (packageDocumentURL) {

        var that = this;

        // Clear the viewer, if it has been defined -> to load a new epub
        RJSDemoApp.epubViewer = undefined;

        var jsLibDir = '../lib/';

        // Get the HTML element to bind the module reader to
        var elementToBindReaderTo = $("#reader")[0];
        $(elementToBindReaderTo).html("");

        RJSDemoApp.readium = new Readium(elementToBindReaderTo, packageDocumentURL, jsLibDir, function (epubViewer) {
            RJSDemoApp.epubViewer = epubViewer;
            RJSDemoApp.epubViewer.openBook();
            RJSDemoApp.addTOC($("#toc-iframe")[0]);
            RJSDemoApp.applyToolbarHandlers();
            RJSDemoApp.setModuleContainerHeight();
        });
    };

    loadInitialEpub($)
});

function loadInitialEpub($) {

    $(document).ready(function () {

        // Create an object of viewer preferences
        RJSDemoApp.viewerPreferences = {
            fontSize: 12,
            syntheticLayout: true,
            tocVisible: false,
            libraryIsVisible: true,
            tocIsVisible: false
        };

        // Load Moby Dick by default
        RJSDemoApp.loadAndRenderEpub("../epub_samples_project/moby-dick-20120118/OPS/package.opf");

        // Generate the library
        $.getJSON('../available_epubs/epub_library_info.json',function (data) {

            // Generate the library list in a drop-down
            RJSDemoApp.addLibraryList($("#library-list"), data);
        }).fail(function (result) {
                console.log("The library could not be loaded");
            });
    });

    // Note: the epubReadingSystem object may not be ready when directly using the
    // window.onload callback function (from within an (X)HTML5 EPUB3 content document's Javascript code)
    // To address this issue, the recommended code is:
    // -----
    function doSomething() {
        console.log(navigator.epubReadingSystem);
    };
    //
    // // With jQuery:
    // $(document).ready(function () { setTimeout(doSomething, 200); });
    //
    // // With the window "load" event:
    // window.addEventListener("load", function () { setTimeout(doSomething, 200); }, false);
    //
    // // With the modern document "DOMContentLoaded" event:
    document.addEventListener("DOMContentLoaded", function (e) {
        setTimeout(doSomething, 200);
    }, false);
    // -----
}
