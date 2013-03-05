describe("Epub.EPUB", function() {
    
    describe("initialization", function() {

        beforeEach(function() {
            return stubFileSystem();
        });

        describe("without passing a file path", function() {
        
            it("throws an exeption", function() {
                
                var createWithNoPath;
                createWithNoPath = function() {
                    return new Epub.EPUB();
                };
                expect(createWithNoPath).toThrow("This class cannot be synced without a file path");
            });
        });
      
        describe("with valid params", function() {

            it("initializes the package document", function() {

                var epub;
                epub = new Epub.EPUB({
                    "package_doc_path": "some/file/path"
                });
                expect(epub.getPackageDocument()).toBeDefined();
            });

            it('passes a reference to itself to the package document', function() {
                
                var args, epub, packDoc;
                packDoc = new Epub.PackageDocument({
                    book: {},
                    "file_path": "some/path"
                });

                spyOn(Epub, "PackageDocument").andReturn(packDoc);
                epub = new Epub.EPUB({
                    "package_doc_path": "some/file/path"
                });
                args = Epub.PackageDocument.mostRecentCall.args;
                expect(args[0].book).toEqual(epub);
            });
        });
    });
    
    describe("defaults", function() {

        beforeEach(function() {
            this.epub = new Epub.EPUB({
                "package_doc_path": "some/file/path"
            });
        });
      
        it('correctly sets default attributes', function() {
            
            expect(this.epub.get("can_two_up")).toEqual(true);
        });
    });

    describe("toJSON", function() {

        beforeEach(function() {
            this.epub = new Epub.EPUB({
              "package_doc_path": "some/file/path"
            });
        });

        it('does not serialize attributes that should not be persisted', function() {
            var json;
            json = this.epub.toJSON();
            expect(json.apple_fixed).not.toBeDefined();
            expect(json.author).not.toBeDefined();
            expect(json.cover_href).not.toBeDefined();
            expect(json.create_at).not.toBeDefined();
            expect(json.description).not.toBeDefined();
            expect(json.epub_version).not.toBeDefined();
            expect(json.fixed_layout).not.toBeDefined();
            expect(json.id).not.toBeDefined();
            expect(json.key).not.toBeDefined();
            expect(json.language).not.toBeDefined();
            expect(json.layout).not.toBeDefined();
            expect(json.modified_date).not.toBeDefined();
            expect(json.ncx).not.toBeDefined();
            expect(json.open_to_spread).not.toBeDefined();
            expect(json.orientation).not.toBeDefined();
            expect(json.page_prog_dir).not.toBeDefined();
            expect(json.paginate_backwards).not.toBeDefined();
            expect(json.pubdate).not.toBeDefined();
            expect(json.publisher).not.toBeDefined();
            expect(json.rights).not.toBeDefined();
            expect(json.spread).not.toBeDefined();
            expect(json.src_url).not.toBeDefined();
            expect(json.title).not.toBeDefined();
        });
    });
});

