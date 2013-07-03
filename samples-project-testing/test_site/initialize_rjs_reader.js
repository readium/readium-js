RJSDemoApp = {};

RJSDemoApp.setModuleContainerHeight = function () {
    $("#epub-reader-container").css({ "height" : $(document).height() * 0.85 + "px" });
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
            RJSDemoApp.loadAndRenderEpub(currEpub.url_to_package_doc);
        });
        $ulElementContainer.append($currLi);
    });
};

RJSDemoApp.addTOC = function (tocIframe) {
    $(tocIframe).attr("src", RJSDemoApp.epub.getToc());
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

            // On TOC load, add all the link handlers
            $("#toc-iframe").off("load");
            $("#toc-iframe").on("load", function () {
                RJSDemoApp.applyViewerHandlers(RJSDemoApp.epubViewer, $("#toc-iframe")[0].contentDocument);
            });

            RJSDemoApp.applyToolbarHandlers();

            // Set a fixed height for the epub viewer container, as a function of the document height
            RJSDemoApp.setModuleContainerHeight();
            RJSDemoApp.epubViewer.on("epubLoaded", function () { 
                RJSDemoApp.epubViewer.showSpineItem(0, function () {
                    console.log("showed first spine item"); 
                });
            }, that);
			
            RJSDemoApp.epubViewer.render(0);
        }
    });
};