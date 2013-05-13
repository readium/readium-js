describe("EpubFixed.FixedPageViews", function () {

    var spineObjects;
    beforeEach(function () {
        
        var packageDocumentXML = jasmine.getFixtures().read("FXL_package_document.xml");
        var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
        var packageDocumentObject = epubParser.parse();
        var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
        var spineInfo = epub.getSpineInfo();
        spineObjects = spineInfo.spine;
    });

    describe("initialization", function () {

        it("can be initialized", function () {

            var pageViews = new EpubFixed.FixedPageViews({ spineObjects : spineObjects });
            expect(pageViews).toBeDefined(); 
        });
    });

    describe("public interface", function () {

        var pageViews;
        beforeEach(function () {
            
            var packageDocumentXML = jasmine.getFixtures().read("FXL_package_document.xml");
            var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
            var packageDocumentObject = epubParser.parse();
            var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
            var spineInfo = epub.getSpineInfo();
            var spineObjects = spineInfo.spine;
            pageViews = new EpubFixed.FixedPageViews({ spineObjects : spineObjects });
            pageViews.loadPageViews($("body"), { syntheticLayout : true });
        });

        describe("loadFixedPages()", function () {

            // This is tested with loadPageViews() and renderAll(), below
        });

        // Rationale: The nextPage() and previousPage() methods rely on the page spread class assigned in the
        //   the spine of the package document fixture used for these tests
        describe("nextPage()", function () {

            it("increments the page number", function () {

                pageViews.set("currentPages", [1, 2]);
                pageViews.nextPage(true);

                expect(pageViews.get("currentPages")).toEqual([3, 4]);
            });

            it("does not increment the page number past the last page", function () {

                var numPages = pageViews.numberOfPages();
                pageViews.set("currentPages", [numPages - 1, numPages]);
                pageViews.nextPage(true);

                expect(pageViews.get("currentPages")).toEqual([numPages - 1, numPages]);
            });
        });

        describe("previousPage()", function () {

            it("does not decrement the page number past the first page", function () {

                pageViews.set("currentPages", [1, 2]);
                pageViews.previousPage(true);

                expect(pageViews.get("currentPages")).toEqual([1, 2]);
            });

            it("decrements the page number", function () {

                pageViews.set("currentPages", [3, 4]);
                pageViews.previousPage(true);

                expect(pageViews.get("currentPages")).toEqual([1, 2]);
            });
        });

        describe("onLastPage()", function () {

            it("detects being on the last page", function () {

                var numPages = pageViews.numberOfPages();
                pageViews.set("currentPages", [numPages - 1, numPages]);

                expect(pageViews.onLastPage()).toBe(true);
            });

            it("detects NOT being on the last page", function () {

                var numPages = pageViews.numberOfPages();
                pageViews.set("currentPages", [numPages - 3, numPages - 2]);

                expect(pageViews.onLastPage()).toBe(false);
            });
        });

        describe("onFirstPage()", function () {

            it("detects being on the first page", function () {

                pageViews.set("currentPages", [1, 2]);

                expect(pageViews.onFirstPage()).toBe(true);
            });

            it("detects NOT being on the first page", function () {

                pageViews.set("currentPages", [3, 4]);

                expect(pageViews.onFirstPage()).toBe(false);
            });
        });
    });

    describe("private helpers", function () {

        var getSpineObjects = function (fixture) {
            
            var packageDocumentXML = jasmine.getFixtures().read(fixture);
            var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
            var packageDocumentObject = epubParser.parse();
            var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
            var spineInfo = epub.getSpineInfo();
            return spineInfo.spine;
        };
        var spineObjects;
        var pageViews;

        describe("loadPageViews()", function () {

            it("adds a page for each spine itemref", function () {

                spineObjects = getSpineObjects("FXL_package_document.xml");
                pageViews = new EpubFixed.FixedPageViews({ spineObjects : spineObjects });
                var numSpineObjects = spineObjects.length;
                pageViews.loadPageViews($("body"), { syntheticLayout : true });

                expect(pageViews.get("fixedPages").length).toBe(numSpineObjects);
            });

            it("adds an image page view for image in spine itemrefs", function () {

                spineObjects = getSpineObjects("FXL_image_package_document.xml");
                pageViews = new EpubFixed.FixedPageViews({ spineObjects : spineObjects });
                spyOn(pageViews, "initializeImagePage");
                spyOn(pageViews, "initializeFixedPage");

                pageViews.loadPageViews($("body"), { syntheticLayout : true });

                expect(pageViews.initializeImagePage).toHaveBeenCalled();
                expect(pageViews.initializeFixedPage).not.toHaveBeenCalled();
            });

            it("adds a fixed page for non-image in spine itemrefs", function () {

                spineObjects = getSpineObjects("FXL_package_document.xml");
                pageViews = new EpubFixed.FixedPageViews({ spineObjects : spineObjects });
                spyOn(pageViews, "initializeImagePage");
                spyOn(pageViews, "initializeFixedPage");

                pageViews.loadPageViews($("body"), { syntheticLayout : true });

                expect(pageViews.initializeImagePage).not.toHaveBeenCalled();
                expect(pageViews.initializeFixedPage).toHaveBeenCalled();
            });
        });

        describe("renderAll()", function () {

            it("calls addPageToDom()", function () {

                var bindingElement = $("body")[0]
                spineObjects = getSpineObjects("FXL_package_document.xml");
                pageViews = new EpubFixed.FixedPageViews({ spineObjects : spineObjects });
                spyOn(pageViews, "addPageViewToDom");

                pageViews.loadPageViews($("body"), { syntheticLayout : true });
                pageViews.renderAll(bindingElement);

                expect(pageViews.addPageViewToDom).toHaveBeenCalled();
                expect(pageViews.addPageViewToDom.callCount).toBe(10);
            });

        });
    });

});




