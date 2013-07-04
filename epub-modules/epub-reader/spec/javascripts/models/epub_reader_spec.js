describe("EpubReader.EpubReader", function () {

    describe("initialization", function () {

        var spineInfo = JSON.parse(jasmine.getFixtures().read("spine_info.json"));
        var viewerSettings = JSON.parse(jasmine.getFixtures().read("viewer_settings.json"));

        beforeEach(function () {

            this.reader = new EpubReader.EpubReader({ 
                spineInfo : spineInfo, 
                viewerSettings : viewerSettings 
            });
        });

        it("exists in namespace", function () {

            expect(EpubReader.EpubReader).toBeDefined();
        });

        it("can be initialized", function () {

            expect(typeof this.reader).toBe("object");
        });

        describe("defaults", function () {

            it("sets current pages view as 0", function () {

                expect(this.reader.get("currentPagesViewIndex")).toBe(0);
            });
        });

        describe("expected attributes", function () {

            it("sets the spine", function () {

                expect(this.reader.get("spine")).toBeDefined();
            });

            it("sets the bindings", function () {

                expect(this.reader.get("bindings")).toBeDefined();
            });

            it("sets the viewer settings", function () {

                expect(this.reader.get("viewerSettings")).toBeDefined();
            });

            it("sets the annotations", function () {

                expect(this.reader.get("annotations")).toBeDefined();
            });
        });
    });

    describe("public interface", function () {

        beforeEach(function () {

            var spineInfo = JSON.parse(jasmine.getFixtures().read("spine_info.json"));
            var viewerSettings = JSON.parse(jasmine.getFixtures().read("viewer_settings.json"));

            this.reader = new EpubReader.EpubReader({ 
                spineInfo : spineInfo, 
                viewerSettings : viewerSettings 
            });
            this.reader.loadSpineItems();
        });

        describe("getFirstSpineIndex()", function () {

            it("gets the first index in the primary reading order", function () {

                expect(this.reader.getFirstSpineIndex()).toBe(1);
            });
        });

        describe("getRenderedPagesView()", function () {
        });

        describe("numberOfLoadedPagesViews()", function () {

            it("gets the number of loaded views", function () {

                expect(this.reader.numberOfLoadedPagesViews()).toBe(5);
            });
        });

        describe("hasNextPagesView()", function () {

            it("is true when there is a next page", function () {

                this.reader.set({"currentPagesViewIndex" : 0});
                expect(this.reader.hasNextPagesView()).toBe(true);
            });

            it("is false when there is no next page", function () {

                this.reader.set({"currentPagesViewIndex" : 4});
                expect(this.reader.hasNextPagesView()).toBe(false);
            });
        });

        describe("hasPreviousPagesView()", function () {

            it("is true when there is a previous page", function () {

                this.reader.set({"currentPagesViewIndex" : 1});
                expect(this.reader.hasPreviousPagesView()).toBe(true);
            });

            it("is false when there is no previous page", function () {
                
                this.reader.set({"currentPagesViewIndex" : 0});
                expect(this.reader.hasPreviousPagesView()).toBe(false);
            });
        });

        describe("getCurrentPagesView()", function () {

            it("gets the current pages view", function () {

                this.reader.set({"currentPagesViewIndex" : 1});
                var expectedPagesView = this.reader.get("loadedPagesViews")[1].pagesView;
                var pagesView = this.reader.getCurrentPagesView();
                expect(pagesView === expectedPagesView).toBe(true);
            });
        });
    });

    describe("private helpers", function () {

        var getSpineInfo = function (fixtureFilename) {
            var packageDocumentXML = jasmine.getFixtures().read(fixtureFilename);
            var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
            var packageDocumentObject = epubParser.parse();
            var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
            var spineInfo = epub.getSpineInfo();
            return spineInfo;
        };

        var reader;
        describe("getPagesViewIndex()", function () {

            beforeEach(function () {
                var viewerSettingsMock = { syntheticLayout : false };
                var spineInfo = getSpineInfo("mixed_pack_doc_2.xml");

                reader = new EpubReader.EpubReader({ 
                    spineInfo : spineInfo, 
                    viewerSettings : viewerSettingsMock 
                });
            });

            it("finds the pages view index for a reflowable spine content document", function () {

                reader.loadSpineItems();
                var pagesViewIndex = reader.getPagesViewIndex(1);

                expect(pagesViewIndex).toBe(1);
            });

            it("finds the pages view index for a set of fixed spine content documents", function () {

                reader.loadSpineItems();
                var pagesViewIndex = reader.getPagesViewIndex(4);

                expect(pagesViewIndex).toBe(2);
            });
        });
    });
});