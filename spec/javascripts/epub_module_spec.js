describe("Epub", function () {

    beforeEach(function() {

        this.packageDocumentObject = JSON.parse(jasmine.getFixtures().read("package_document.json"));
    });

    it("works", function () {

        var currEpub = new EpubModule(this.packageDocumentObject);
        debugger;
    });
});