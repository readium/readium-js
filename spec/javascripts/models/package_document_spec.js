describe('PACKAGE_DOCUMENT', function() {
    
    describe("module structure", function () {

        it("exists in the namespace", function() {
            
            expect(Epub.PackageDocument).toBeDefined();
        });
    });

    describe("initialization", function() {

        beforeEach(function() {

            var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document.json"));
            this.packageDocument = new Epub.PackageDocument({ packageDocumentJson : packageDocumentJson });

            // spyOn(this.packageDocument, "crunchSpine");
        });

        it("sets the json package document data", function () {

            expect(this.packageDocument.get("packageDocumentJson")).toBeDefined();
        });
          
        // it('subscribes to spine position changed events', function() {
            
        //     spyOn(this.packageDocument.onSpinePosChanged, "apply");
        //     this.packageDocument.trigger("change:spine_position");
        //     expect(this.packageDocument.onSpinePosChanged.apply).toHaveBeenCalled();
        // });
    });
});
