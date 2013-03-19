describe("Epub.EPUBController", function() {
        
    describe("initialization", function() {

        describe("with valid params", function() {

            beforeEach(function() {
                this.epub = new Epub.EPUB({
                    "package_doc_path": "some/file/path"
                });
            });

            it("initializes a reference to the package document", function() {

                var epubController;
                epubController = new Epub.EPUBController({
                    "epub": this.epub
                });
                expect(epubController.packageDocument).toBeDefined();
            });
        });
    });

    describe("toJSON", function() {

        beforeEach(function() {
            this.epub = new Epub.EPUB({
                "package_doc_path": "some/file/path"
            });
            this.epubController = new Epub.EPUBController({
                "epub": this.epub
            });
        });

        it('does not serialize attributes that should not be presisted', function() {

            var json;
            this.epubController.set("rendered_spine_items", [1, 2, 3]);
            this.epubController.set("spine_index", [1]);
            json = this.epubController.toJSON();
            expect(json.rendered_spine_items).not.toBeDefined();
            expect(json.spine_index).not.toBeDefined();
        });

        it('serializes attributes that should be persisted', function() {

            var json;
            this.epubController.set("key", "alksjflkasd");
            this.epubController.set("updated_at", "alksdjfs");
            json = this.epubController.toJSON();
            expect(json.current_theme).toBeDefined();
            expect(json.updated_at).toBeDefined();
            expect(json.current_margin).toBeDefined();
            expect(json.font_size).toBeDefined();
            expect(json.two_up).toBeDefined();
            expect(json.key).toBeDefined();
        });
    });
});
