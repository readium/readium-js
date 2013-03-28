describe("EpubReader.EpubReaderView", function () {

    describe("initialization", function () {

        beforeEach(function () {

            var spineInfo = JSON.parse(jasmine.getFixtures().read("spine_info.json"));
            var viewerSettings = JSON.parse(jasmine.getFixtures().read("viewer_settings.json"));

            this.readerViewer = new EpubReader.EpubReaderView({ 
                readerElement : $("body"),
                spineInfo : spineInfo, 
                viewerSettings : viewerSettings
            });
        });

        it("exists in namespace", function () {

            expect(EpubReader.EpubReaderView).toBeDefined();
        });

        it("can be initialized", function () {

            expect(typeof this.readerViewer).toBe("object");
        });
    });

    describe("public interface", function () {

        beforeEach(function () {

            var spineInfo = JSON.parse(jasmine.getFixtures().read("spine_info.json"));
            var viewerSettings = JSON.parse(jasmine.getFixtures().read("viewer_settings.json"));

            this.readerViewer = new EpubReader.EpubReaderView({ 
                readerElement : $("body"),
                spineInfo : spineInfo, 
                viewerSettings : viewerSettings
            });
        });

        describe("showSpineItem()", function () {

            it("shows the spine item", function () {

                this.readerViewer.showSpineItem(1);
            });
        });

        describe("showPageByCFI()", function () {
            
            // This method is currently unspecified
        });

        describe("showPageByElementId()", function () {

            // This method is currently unspecified
        });

        describe("nextPage()", function () {

            // Needs tests
        });

        describe("previousPage()", function () {

            // Needs tests
        });

        describe("setFontSize()", function () {

        });

        describe("setMargin()", function () {

        });

        describe("setTheme()", function () {

        });

        describe("setSyntheticLayout()", function () {

        });
    });

    describe("private helpers", function () {

        describe("renderNextPagesView()", function () {

            // Needs tests
        });

        describe("renderPreviousPagesView()", function () {

            // Needs tests
        });
    });
});