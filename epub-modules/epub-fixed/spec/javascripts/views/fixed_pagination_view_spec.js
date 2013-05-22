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
        var fixedPaginationView;
        var spineObjects; 

        describe("render()", function () {

            it("each spine object has a view initialized for it", function () {

                var fixedPaginationView = getPaginationView("FXL_image_package_document.xml")
                var numSpineObjects = spineObjects.length;
                fixedPaginationView.render();
                expect(fixedPaginationView.fixedPageViews.get("fixedPages").length).toBe(numSpineObjects); 
            });

            it("triggers the epubLoaded event when each page is loaded", function () {

                var fixedPaginationView = getPaginationView("FXL_package_document_two_pages.xml")
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
    });
});