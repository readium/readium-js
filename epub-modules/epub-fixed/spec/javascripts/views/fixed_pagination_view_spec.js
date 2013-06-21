describe("EpubFixed.FixedPaginationView", function () {

    describe("initialization", function () {

        var fixedPaginationView;
        var spineObjects; 

        beforeEach(function () {

            var viewerSettings = {
                fontSize : 3,
                syntheticLayout : false,
                currentMargin : 3,
                tocVisible : false,
                currentTheme : "default"
            };

            var packageDocumentXML = jasmine.getFixtures().read("FXL_image_package_document.xml");
            var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
            var packageDocumentObject = epubParser.parse();
            var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
            var spineInfo = epub.getSpineInfo();
            spineObjects = spineInfo.spine;

            fixedPaginationView = new EpubFixed.FixedPaginationView({
                spineObjects : spineObjects,
                viewerSettings : viewerSettings
            });
        });

        it("exists in namespace", function () {

            expect(EpubFixed.FixedPaginationView).toBeDefined();
        });

        it("can be initialized", function () {

            expect(fixedPaginationView).toBeDefined();
        });

        it("initializes a delegate that manages the set of fixed page views", function () {

            expect(fixedPaginationView.fixedPageViews).toBeDefined();
        });

        it("persists the viewer settings", function () {

            expect(fixedPaginationView.viewerSettings).toBeDefined();
        });
    });

    describe("public interface", function () {

        var fixedPaginationView;
        var spineObjects; // This is set in the getPaginationView function, when it is called

        var getPaginationView = function (fixture) {

            var viewerSettings = {
                fontSize : 3,
                syntheticLayout : false,
                currentMargin : 3,
                tocVisible : false,
                currentTheme : "default"
            };

            var packageDocumentXML = jasmine.getFixtures().read(fixture);
            var epubParser = new EpubParserModule("spec/javascripts/fixtures/", packageDocumentXML);
            var packageDocumentObject = epubParser.parse();
            var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
            var spineInfo = epub.getSpineInfo();
            spineObjects = spineInfo.spine;

            return new EpubFixed.FixedPaginationView({
                spineObjects : spineObjects,
                viewerSettings : viewerSettings
            });
        };

        describe("render()", function () {
            
            it("each spine object has a view initialized for it", function () {

                fixedPaginationView = getPaginationView("FXL_image_package_document.xml")
                var numSpineObjects = spineObjects.length;
                fixedPaginationView.render();
                expect(fixedPaginationView.fixedPageViews.get("fixedPages").length).toBe(numSpineObjects); 
            });

            it("triggers the epubLoaded event when each page is loaded", function () {

                fixedPaginationView = getPaginationView("FXL_package_document_two_pages.xml")
                spyOn(fixedPaginationView, "trigger");
                runs(function () {
                    $("body").append(fixedPaginationView.render());
                });
                
                waits(500);

                runs(function () {
                    expect(fixedPaginationView.trigger).toHaveBeenCalledWith("contentDocumentLoaded");
                });
            });
        });

        // Events are tested with fixed content documents, rather that images in spine
        describe("events", function () {

            var fixedPaginationView;
            beforeEach(function () {

                fixedPaginationView = getPaginationView("FXL_package_document.xml");
                spyOn(fixedPaginationView, "trigger");
            });

            // Rationale: Need to load an actual content document
            // it("triggers contentDocumentLoaded once rendered", function () {
            // });

            // Rationale: This only tests whether the event is trigger on the view if the handler is executed; it is not
            //   testing whether the handler actually gets bound to anything. 
            it("triggers linkClicked on click", function () {

                var eventObject = $.Event("click");
                fixedPaginationView.linkClickHandler(eventObject);
                expect(fixedPaginationView.trigger).toHaveBeenCalledWith("epubLinkClicked", eventObject);
            });

            it("triggers the atNextPage event", function () {

                spyOn(fixedPaginationView.fixedPageViews, "onLastPage").andReturn(false);
                spyOn(fixedPaginationView.fixedPageViews, "resetCurrentPages").andCallFake(function () {});
                fixedPaginationView.nextPage();
                expect(fixedPaginationView.trigger).toHaveBeenCalledWith("atNextPage");
            });

            it("triggers the atPreviousPage event", function () {

                spyOn(fixedPaginationView.fixedPageViews, "onFirstPage").andReturn(false);
                spyOn(fixedPaginationView.fixedPageViews, "resetCurrentPages").andCallFake(function () {});
                fixedPaginationView.previousPage();
                expect(fixedPaginationView.trigger).toHaveBeenCalledWith("atPreviousPage");
            });

            it("triggers layoutChanged: when layout changes to synthetic", function () {

                // Initialize some extra test state
                fixedPaginationView.viewerSettings.syntheticLayout = false;
                spyOn(fixedPaginationView.fixedPageViews, "resetCurrentPages").andCallFake(function () {});

                // Test
                fixedPaginationView.setSyntheticLayout(true);
                expect(fixedPaginationView.trigger).toHaveBeenCalledWith("layoutChanged", true);
            });

            it("triggers layoutChanged: when layout changes to single", function () {

                // Initialize some extra test state
                fixedPaginationView.viewerSettings.syntheticLayout = true;
                spyOn(fixedPaginationView.fixedPageViews, "resetCurrentPages").andCallFake(function () {});

                // Test
                fixedPaginationView.setSyntheticLayout(false);
                expect(fixedPaginationView.trigger).toHaveBeenCalledWith("layoutChanged", false);
            });

            it("triggers atFirstPage WHILE ON first page", function () {

                spyOn(fixedPaginationView.fixedPageViews, "onFirstPage").andReturn(true);
                fixedPaginationView.previousPage();

                expect(fixedPaginationView.trigger).toHaveBeenCalledWith("atFirstPage");
            });

            it("triggers atFirstPage WHEN first page reached", function () {

                spyOn(fixedPaginationView.fixedPageViews, "onFirstPage").andReturn(true);
                fixedPaginationView.viewerSettings.syntheticLayout = false;
                fixedPaginationView.fixedPageViews.set("currentPages", [2]);
                fixedPaginationView.previousPage();

                expect(fixedPaginationView.trigger).toHaveBeenCalledWith("atFirstPage");
            });

            it("triggers atLastPage WHILE ON last page", function () {

                spyOn(fixedPaginationView.fixedPageViews, "onLastPage").andReturn(true);
                fixedPaginationView.nextPage();

                expect(fixedPaginationView.trigger).toHaveBeenCalledWith("atLastPage");
            });

            it("triggers atLastPage WHEN last page reached", function () {

                spyOn(fixedPaginationView.fixedPageViews, "onLastPage").andReturn(true);
                fixedPaginationView.viewerSettings.syntheticLayout = false;
                fixedPaginationView.fixedPageViews.set("currentPages", [9]);
                fixedPaginationView.nextPage();

                expect(fixedPaginationView.trigger).toHaveBeenCalledWith("atLastPage");
            });

            describe("contentChanged event", function () {

                // it("triggers the displayedContentChanged event: next page", function () {
                // });

                // it("triggers the displayedContentChanged event: previous page", function () {
                // });

                // it("triggers the displayedContentChanged event: show by page number", function () {
                // });
                
                // it("triggers the displayedContentChanged event: show by cfi", function () {
                // });

                // it("triggers the displayedContentChanged event: show by id", function () {
                // });

                it("triggers the displayedContentChanged event: page re-size", function () {

                    spyOn(fixedPaginationView.fixedPageViews, "resizePageViews").andCallFake(function () {});
                    fixedPaginationView.resizePageViews();
                    expect(fixedPaginationView.trigger).toHaveBeenCalledWith("displayedContentChanged"); 
                });
            });
        });
    });
});