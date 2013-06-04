
RWCDemoApp = {};

RWCDemoApp.getInputValue = function (inputId) {
    return $("#" + inputId).val();
};

RWCDemoApp.setModuleContainerHeight = function () {
    $("#epub-reader-container").css({ "height" : $(document).height() * 0.85 + "px" });
};

RWCDemoApp.parseXMLFromDOM = function (data) {
    var serializer = new XMLSerializer();
    var packageDocumentXML = serializer.serializeToString(data);
    return packageDocumentXML;
};



            // This function will retrieve a package document and load an EPUB
            RWCDemoApp.loadAndRenderEpub = function (packageDocumentURL) {

                var that = this;

                // Clear the viewer, if it has been defined -> to load a new epub
                RWCDemoApp.epubViewer = undefined;

                // Get the package document and load the modules
                $.ajax({
                    url : packageDocumentURL,
                    success : function (result) {

                        // Get the HTML element to bind the module reader to
                        var elementToBindReaderTo = $("#reader");

                        // Create an object of viewer preferences
                        var viewerPreferences = {
                            fontSize : 12,
                            syntheticLayout : false,
                            currentMargin : 3,
                            tocVisible : false,
                            currentTheme : "default"
                        };
                        var currLayoutIsSynthetic = viewerPreferences.syntheticLayout;

                        if (result.nodeType) {
                            result = RWCDemoApp.parseXMLFromDOM(result);
                        }

                        // THE MOST IMPORTANT PART - INITIALIZING THE SIMPLE RWC MODEL
                        RWCDemoApp.epubViewer = new SimpleRWC(
                            elementToBindReaderTo, viewerPreferences, packageDocumentURL, result, "lazy"
                        );

                        // Set a fixed height for the epub viewer container, as a function of the document height
                        RWCDemoApp.setModuleContainerHeight();

                        // These are application specific handlers that wire the HTML to the SimpleRWC module API
						/*
                        // Set handlers for click events
                        $("#previous-page-btn").unbind("click");
                        $("#previous-page-btn").on("click", function () {
                            RWCDemoApp.epubViewer.previousPage(function () {
                                console.log("went to previous page");
                            });
                        });

                        $("#next-page-btn").unbind("click");
                        $("#next-page-btn").on("click", function () {
                            RWCDemoApp.epubViewer.nextPage(function () {
                                console.log("went to next page");
                            });
                        });

                        $("#toggle-synthetic-btn").unbind("click");
                        $("#toggle-synthetic-btn").on("click", function () {

                            if (currLayoutIsSynthetic) {
                                RWCDemoApp.epubViewer.setSyntheticLayout(false);
                                currLayoutIsSynthetic = false;
                                $("#single-page-ico").show();
                                $("#synthetic-page-ico").hide();
                            }
                            else {
                                RWCDemoApp.epubViewer.setSyntheticLayout(true);
                                currLayoutIsSynthetic = true;
                                $("#single-page-ico").hide();
                                $("#synthetic-page-ico").show();
                            }
                        });
*/
						
		                var pressLeft = function () { RWCDemoApp.epubViewer.previousPage(); };
		                var pressRight = function () { RWCDemoApp.epubViewer.nextPage(); };

		                RWCDemoApp.epubViewer.on("keydown-left", pressLeft, that);
		                RWCDemoApp.epubViewer.on("keydown-right", pressRight, that);

		                RWCDemoApp.epubViewer.on("internalLinkClicked", function(e){
		                    var href;
		                    e.preventDefault();

		                    // Check for both href and xlink:href attribute and get value
		                    if (e.currentTarget.attributes["xlink:href"]) {
		                        href = e.currentTarget.attributes["xlink:href"].value;
		                    }
		                    else {
		                        href = e.currentTarget.attributes["href"].value;
		                    }

		                    var spineIndex = RWCDemoApp.epubViewer.findSpineIndex(href);
		                    RWCDemoApp.epubViewer.showSpineItem(spineIndex);

		                }, that);

                        // Render the reader
                        RWCDemoApp.epubViewer.on("epubLoaded", function () { 
                            RWCDemoApp.epubViewer.showSpineItem(0, function () {
                                console.log("showed first spine item"); 
								
//								alert("Reading System name: " + navigator.epubReadingSystem.name);
                            });
                        }, that);
						
                        RWCDemoApp.epubViewer.render(0);
                    }
                });
            };



var showEpub = function (packageDocumentPath) {

    var reader;
    $.ajax({
        url : packageDocumentPath,
        async : false,
		error : function(xhr, status)
		{
//			alert(status);
			console.log(xhr);
		},
        success : function (result) {
            
          var packageDocumentXML = result;
          var epubParser = new EpubParserModule(packageDocumentPath, packageDocumentXML);
          var packageDocumentObject = epubParser.parse();
          var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
          var spineInfo = epub.getSpineInfo();
          var spineObjects = spineInfo.spine;

          var viewerSettings = {
              fontSize : 12,
              syntheticLayout : false,
              currentMargin : 3,
              tocVisible : false,
              currentTheme : "default"
          };

          var packDocDOM = (new window.DOMParser()).parseFromString(packageDocumentXML, "text/xml");
//          console.log(packDocDOM);
          reader = new EpubReaderModule(
              $("#reader"),
              spineInfo,
              viewerSettings,
              packDocDOM
          );
        }
    });

    return reader;
};



var testEpub = function (packageDocumentPath) {

    var url = "../epub_samples_project/" + packageDocumentPath;
    RWCDemoApp.loadAndRenderEpub(url);
	
	/*
    var that = this;
    this.view = showEpub("/epub_samples_project/" + packageDocumentPath);
	
	if (typeof this.view == "undefined")
	{
		var url =
		window.location + "/" +
		"../.."
		+ "/epub_samples_project/" + packageDocumentPath;
		console.log("Server not running? Trying local (RECOMMENDED: GoogleChrome.app --args --disable-application-cache --disable-web-security -–allow-file-access-from-files --incognito): " + url);
		
		this.view = showEpub(url);
	}

    var pressLeft = function () { that.view.previousPage(); };
    var pressRight = function () { that.view.nextPage(); };

    this.view.on("keydown-left", pressLeft, this);
    this.view.on("keydown-right", pressRight, this);

    this.view.on("internalLinkClicked", function(e){
        var href;
        e.preventDefault();

        // Check for both href and xlink:href attribute and get value
        if (e.currentTarget.attributes["xlink:href"]) {
            href = e.currentTarget.attributes["xlink:href"].value;
        }
        else {
            href = e.currentTarget.attributes["href"].value;
        }

        var spineIndex = this.view.findSpineIndex(href);
        this.view.showSpineItem(spineIndex);

    }, this);

    this.view.on("epubLoaded", function () { 

		alert("HERE");

        this.view.showSpineItem(0, function () {
            console.log("showed first spine item"); 
        });
    }, this);

    this.view.render(0);
	*/
};
