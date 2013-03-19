describe("Epub.EPUB", function() {
    
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

