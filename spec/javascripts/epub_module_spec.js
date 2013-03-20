describe("EpubModule.js", function () {

    beforeEach(function() {

        this.packageDocumentObject = JSON.parse(jasmine.getFixtures().read("package_document.json"));
    });

    it("can be instantiated", function () {

        var currEpub = new EpubModule(this.packageDocumentObject);
        expect(typeof currEpub).toBe("object");
    });
});