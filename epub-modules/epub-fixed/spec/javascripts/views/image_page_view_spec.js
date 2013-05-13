describe("EpubFixed.ImagePageView", function () {

    describe("initialization", function () {

        var imagePage;
        var spineObject;

        beforeEach(function () {

            var packageDocumentXML = jasmine.getFixtures().read("FXL_image_package_document.xml");
            var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
            var packageDocumentObject = epubParser.parse();
            var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
            var spineInfo = epub.getSpineInfo();
            spineObject = spineInfo.spine[1];
        });

        it("exists in the namespace", function () {

            expect(EpubFixed.ImagePageView).toBeDefined();
        });

        it("can be initialized", function () {

            imagePage = new EpubFixed.ImagePageView({ 
                pageSpreadClass : spineObject.pageSpreadClass,
                imageSrc : spineObject.contentDocumentURI,
                viewerSettings : { syntheticLayout : false }
            });

            expect(imagePage).toBeDefined();
        });
    });

    describe("public interface", function () {

        var imagePage;
        var spineObject;

        beforeEach(function () {

            var packageDocumentXML = jasmine.getFixtures().read("FXL_image_package_document.xml");
            var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
            var packageDocumentObject = epubParser.parse();
            var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
            var spineInfo = epub.getSpineInfo();
            spineObject = spineInfo.spine[1];
        });

        describe("render()", function () {

            it("sets the image source attribute", function () {

                imagePage = new EpubFixed.ImagePageView({ 
                    pageSpreadClass : "right",
                    imageSrc : "the-image-source",
                    viewerSettings : { syntheticLayout : false }
                });
                imagePage.render();

                expect($("img", imagePage.$el).attr("src")).toBe("the-image-source");
            });

            it("triggers the content document load event", function () {

                imagePage = new EpubFixed.ImagePageView({ 
                    pageSpreadClass : "right",
                    imageSrc : "spec/javascripts/fixtures/PageBlanche_Page_005.jpg",
                    viewerSettings : { syntheticLayout : false }
                });
                spyOn(imagePage, "trigger");

                runs(function () {
                    imagePage.render();    
                });

                waits(500);
                
                runs(function () {
                    expect(imagePage.trigger).toHaveBeenCalledWith("contentDocumentLoaded");
                });
            });
        });
    });

    describe("private helpers", function () {});
});