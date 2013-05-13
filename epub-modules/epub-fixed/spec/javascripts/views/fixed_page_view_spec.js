describe("EpubFixed.FixedPageView", function () {

    describe("initialization", function () {

        var fixedPage;
        var spineObject;

        beforeEach(function () {

            var packageDocumentXML = jasmine.getFixtures().read("FXL_package_document.xml");
            var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
            var packageDocumentObject = epubParser.parse();
            var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
            var spineInfo = epub.getSpineInfo();
            spineObject = spineInfo.spine[1];
        });

        it("exists in the namespace", function () {

            expect(EpubFixed.FixedPageView).toBeDefined();
        });

        it("can be instantiated", function () {

            fixedPage = new EpubFixed.FixedPageView({
                pageSpreadClass : "left",
                iframeSrc : "path/to/iframe",
                viewerSettings : { syntheticLayout : false }
            });

            expect(fixedPage).toBeDefined();
        });
    });

    describe("public interface", function () {

        var fixedPage;
        var spineObject;

        beforeEach(function () {

            var packageDocumentXML = jasmine.getFixtures().read("FXL_package_document.xml");
            var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
            var packageDocumentObject = epubParser.parse();
            var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
            var spineInfo = epub.getSpineInfo();
            spineObject = spineInfo.spine[1];
        });

        describe("render()", function () {

            it("sets the iframe source", function () {

                fixedPage = new EpubFixed.FixedPageView({
                    pageSpreadClass : "left",
                    iframeSrc : "path/to/iframe",
                    viewerSettings : { syntheticLayout : false }
                });
                fixedPage.render();

                expect(fixedPage.get$iframe().attr("src")).toBe("path/to/iframe");
            });

            it("triggers the content document loaded event", function () {

                fixedPage = new EpubFixed.FixedPageView({
                    pageSpreadClass : "left",
                    iframeSrc : "spec/javascripts/fixtures/PageBlanche_Page_005.xhtml",
                    viewerSettings : { syntheticLayout : false }
                });
                spyOn(fixedPage, "trigger");

                runs(function () {
                    $("body").append(fixedPage.render());
                });

                waits(500);

                runs(function () {
                    expect(fixedPage.trigger).toHaveBeenCalledWith("contentDocumentLoaded");
                });
            });
        });
    });

    describe("private helpers", function () {});
});