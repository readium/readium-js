define(['jquery'], function ($) {
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

        // Decrease font size
        (function () {
            var $decreaseFont = $("#decrease-font-btn");

            $decreaseFont.off("click");
            $decreaseFont.on("click", function () {
                // ReadiumSDK.Views.ReaderView doesn't expose a method to retrieve current settings,
                // so at the moment differential changes to fontSize cannot be implemented:
                //var settings = RJSDemoApp.epubViewer.getViewerSettings()
                //RJSDemoApp.epubViewer.setFontSize(settings.fontSize - 2);
                console.log('differential changes to fontSize not supported with the ReadiumSDK version used.');
            });
        })();

        // Increase font size
        (function () {
            var $increaseFont = $("#increase-font-btn");

            $increaseFont.off("click");
            $increaseFont.on("click", function () {
                // ReadiumSDK.Views.ReaderView doesn't expose a method to retrieve current settings,
                // so at the moment differential changes to fontSize cannot be implemented:
                //var settings = RJSDemoApp.epubViewer.getViewerSettings()
                //RJSDemoApp.epubViewer.setFontSize(settings.fontSize + 2);
                console.log('differential changes to fontSize not supported with the ReadiumSDK version used.');

            });
        })();

        // Prev
        // Remove any existing click handlers
        $("#previous-page-btn").off("click");
        $("#previous-page-btn").on("click", function () {
            RJSDemoApp.epubViewer.openPageLeft();
        });

        // Next
        // Remove any existing click handlers
        $("#next-page-btn").off("click");
        $("#next-page-btn").on("click", function () {
            RJSDemoApp.epubViewer.openPageRight();
        });

        // Layout
        $("#toggle-synthetic-btn").off("click");
        $("#toggle-synthetic-btn").on("click", function () {
            RJSDemoApp.toggleLayout();
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

            // RJSDemoApp.epubViewer.showPageByCFI(splitHref[1], function () {
            //     console.log("Showed the page using a CFI");
            // }, this);
        }
        // It's a regular id
        else {

            // Get the hash id if it exists
            href = href.trim();
            splitHref = href.split("#");

            spineIndex = RJSDemoApp.epub.getSpineIndexByHref(href);
            if (splitHref[1] === undefined) {
                // RJSDemoApp.epubViewer.showSpineItem(spineIndex, function () {
                //     console.log("Spine index shown: " + splitHref[0]);
                // });
            }
            else {
                // RJSDemoApp.epubViewer.showPageByElementId(spineIndex, splitHref[1], function () {
                //     console.log("Page shown: href: " + splitHref[0] + " & hash id: " + splitHref[1]);
                // });
            }
        }
    };

    RJSDemoApp.tocLinkClicked = function (e) {

        RJSDemoApp.epubLinkClicked(e);
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
    };

    RJSDemoApp.toggleLayout = function () {

        if (RJSDemoApp.viewerPreferences.syntheticLayout) {
            RJSDemoApp.epubViewer.updateSettings({ "isSyntheticSpread": false });
            RJSDemoApp.viewerPreferences.syntheticLayout = false;
        }
        else {
            RJSDemoApp.epubViewer.updateSettings({ "isSyntheticSpread": true });
            RJSDemoApp.viewerPreferences.syntheticLayout = true;
        }
    };

    return RJSDemoApp;
});
