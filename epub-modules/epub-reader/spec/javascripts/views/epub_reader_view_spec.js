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
            var parser = new window.DOMParser()
            var packageDocumentDOM = parser.parseFromString(jasmine.getFixtures().read("package_document.xml"), "text/xml");

            this.readerViewer = new EpubReader.EpubReaderView({ 
                readerElement : $("body"),
                spineInfo : spineInfo, 
                viewerSettings : viewerSettings,
                packageDocumentDOM : packageDocumentDOM
            });
        });

        describe("showSpineItem()", function () {

            it("shows the spine item", function () {});
        });

        describe("showPageByCFI()", function () {
            
            it("calls show spine item with the correct spine index", function () {

                // spyOn(this.readerViewer, "showSpineItem");
                // this.readerViewer.showPageByCFI("epubcfi(/6/20)");
                // expect(this.readerViewer.showSpineItem).toHaveBeenCalledWith(0);
            });
        });

        describe("getCurrentSelectionInfo()", function () {

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

        beforeEach(function () {

            var spineInfo = JSON.parse(jasmine.getFixtures().read("spine_info.json"));
            var viewerSettings = JSON.parse(jasmine.getFixtures().read("viewer_settings.json"));
            var parser = new window.DOMParser()
            var packageDocumentDOM = parser.parseFromString(jasmine.getFixtures().read("package_document.xml"), "text/xml");

            this.readerViewer = new EpubReader.EpubReaderView({ 
                readerElement : $("body"),
                spineInfo : spineInfo, 
                viewerSettings : viewerSettings,
                packageDocumentDOM : packageDocumentDOM
            });
        });

        describe("getSpineIndexFromCFI()", function () {

            it("gets the expected spine index", function () {

                // TODO migrate to callback
                var spineIndex = this.readerViewer.getSpineIndexFromCFI("epubcfi(/6/20!/4)");
                expect(spineIndex).toBe(0);
            });
        });
    });
});