describe("Epub.EPUBController", function() {
        
    describe("initialization", function() {

        beforeEach(function() {
            return stubFileSystem();
        });

        describe("with valid params", function() {

            beforeEach(function() {
                this.epub = new Epub.EPUB({
                    "package_doc_path": "some/file/path"
                });
            });

            it("initializes a pagination strategy selector", function() {

                var epub;
                epub = new Epub.EPUBController({
                    "epub": this.epub
                });
                expect(epub.paginator).toBeDefined();
            });

            it("initializes a reference to the package document", function() {

                var epubController;
                epubController = new Epub.EPUBController({
                    "epub": this.epub
                });
                expect(epubController.packageDocument).toBeDefined();
            });

            it("calls fetch on the package document", function() {
              
                var epub;
                var epubController;
                var packageDocument;

                packageDocument = Factory.spy("package_document");
                spyOn(Epub, "PackageDocument").andReturn(packageDocument);            
                epub = new Epub.EPUB({"package_doc_path": "some/file/path"});
                epubController = new Epub.EPUBController({
                    "epub": epub
                });

                expect(Epub.PackageDocument).toHaveBeenCalled();
                expect(packageDocument.fetch).toHaveBeenCalled();
            });

            describe("sets up event handlers", function() {
                
                beforeEach(function() {
                    this.epub = new Epub.EPUB({
                        "package_doc_path": "some/file/path"
                    });
                    this.epubController = new Epub.EPUBController({
                        "epub": this.epub
                    });
                });
            });
        });
    });

    describe("defaults", function() {

        beforeEach(function() {
            this.epub = new Epub.EPUB({
                "package_doc_path": "some/file/path"
            });
            this.epubController = new Epub.EPUBController({
                "epub": this.epub
            });
        });
        
        it('correctly sets default attributes', function() {

            expect(this.epubController.get("font_size")).toEqual(10);
            expect(this.epubController.get("two_up")).toEqual(false);
            expect(this.epubController.get("full_screen")).toEqual(false);
            expect(this.epubController.get("toolbar_visible")).toEqual(true);
            expect(this.epubController.get("toc_visible")).toEqual(false);
            expect(this.epubController.get("rendered_spine_items")).toEqual([]);
            expect(this.epubController.get("current_theme")).toEqual("default-theme");
            expect(this.epubController.get("current_margin")).toEqual(3);
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
