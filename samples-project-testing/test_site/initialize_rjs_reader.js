RJSDemoApp = {};

RJSDemoApp.setModuleContainerHeight = function () {
    $("#reader").css({ "height" : $(window).height() * 0.85 + "px" });
};

RJSDemoApp.parseXMLFromDOM = function (data) {
    var serializer = new XMLSerializer();
    var packageDocumentXML = serializer.serializeToString(data);
    return packageDocumentXML;
};

RJSDemoApp.addLibraryList = function ($ulElementContainer, libraryJson) {

    _.each(libraryJson.library_epubs, function (currEpub) {

        var $currLi = $('<li><a id="' + currEpub.url_to_package_doc + '" href="#">' + currEpub.title + '</a></li>');
        $currLi.on("click", function () {
            RJSDemoApp.loadAndRenderEpub(currEpub.url_to_package_doc, RJSDemoApp.viewerPreferences);
        });
        $ulElementContainer.append($currLi);
    });
};

RJSDemoApp.addTOC = function (tocIframe) {

    $(tocIframe).off("load");

    // On TOC load, add all the link handlers
    if (!RJSDemoApp.epub.tocIsNcx()) {

        $(tocIframe).on("load", function () {
            $(tocIframe).show();
            RJSDemoApp.applyViewerHandlers(RJSDemoApp.epubViewer, $(tocIframe)[0].contentDocument);
        });
    }

    var tocUrl = RJSDemoApp.epub.getTocURL();
    if (RJSDemoApp.epub.tocIsNcx()) {

        $.ajax({

            url : tocUrl,
            success : function (result) {
                var navList = RJSDemoApp.epub.generateTocListDOM(result);
                $(tocIframe).parent().append(navList);
                $(tocIframe).hide();
                RJSDemoApp.applyViewerHandlers(RJSDemoApp.epubViewer, $(tocIframe).parent()[0]);
            }
        });
    }
    else {
        $(tocIframe).attr("src", tocUrl);
    }
};

// This function will retrieve a package document and load an EPUB
RJSDemoApp.loadAndRenderEpub = function (packageDocumentURL, viewerPreferences) {

    var that = this;

    // Clear the viewer, if it has been defined -> to load a new epub
    RJSDemoApp.epubViewer = undefined;

    // Get the package document and load the modules
    $.ajax({
        url : packageDocumentURL,
        success : function (result) {

            // Get the HTML element to bind the module reader to
            var elementToBindReaderTo = $("#reader")[0];
            $(elementToBindReaderTo).html("");

            if (result.nodeType) {
                result = RJSDemoApp.parseXMLFromDOM(result);
            }

            // THE MOST IMPORTANT PART - INITIALIZING THE SIMPLE RWC MODEL
            var packageDocumentXML = result;
            RJSDemoApp.epubParser = new EpubParserModule(packageDocumentURL, packageDocumentXML);
            var packageDocumentObject = RJSDemoApp.epubParser.parse();
            RJSDemoApp.epub = new EpubModule(packageDocumentObject, packageDocumentXML);
            var spineInfo = RJSDemoApp.epub.getSpineInfo();

            RJSDemoApp.epubViewer = new EpubReaderModule(
                elementToBindReaderTo, spineInfo, viewerPreferences, RJSDemoApp.epub.getPackageDocumentDOM(), "lazy"
            );

            // Set the TOC
            RJSDemoApp.addTOC($("#toc-iframe")[0]);

            RJSDemoApp.applyToolbarHandlers();

            // Set a fixed height for the epub viewer container, as a function of the document height
            RJSDemoApp.setModuleContainerHeight();
            RJSDemoApp.epubViewer.on("epubLoaded", function () { 
                RJSDemoApp.epubViewer.showFirstPage(function () {
                    console.log("showed first spine item"); 
                });
            }, that);
			
            RJSDemoApp.epubViewer.render(0);
        }
    });
};