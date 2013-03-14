
describe("EpubParser.PackageDocumentParser", function() {
  
    beforeEach(function() {

        var uri_object;
        this.xml_string = jasmine.getFixtures().read('package_document.xml');
        this.xml = new window.DOMParser().parseFromString(this.xml_string, 'text/xml');
        uri_object = new URI("http://google.com");
        return this.parser = new EpubParser.PackageDocumentParser({ uriObject : uri_object });
    });

    describe("initialization", function() {

        it('exists in the proper namespace', function() {
            return expect(EpubParser.PackageDocumentParser).toBeDefined();
        });

        it('can be initialized', function() {
            var parser;
            parser = new EpubParser.PackageDocumentParser({});
            return expect(typeof parser).toEqual("object");
        });

        it('assign the parameter as uri_obj', function() {
            var parser;
            parser = new EpubParser.PackageDocumentParser({uriObject : "banana"});
            return expect(parser.get("uriObject")).toEqual("banana");
        });
    });

    describe("getJsonSpine", function () {

        beforeEach(function () {
            this.spine = this.parser.getJsonSpine(this.xml);
            this.arbitrarySpineItemToTest = this.spine[0];
        });

        it('parses the number of spine nodes', function() {
            expect(this.spine.length).toEqual(3);
        });

        it("parses the idref property", function () {
            expect(this.arbitrarySpineItemToTest.idref).toEqual("Page_1");
        });

        it("parses the linear property", function () {
            expect(this.arbitrarySpineItemToTest.linear).toEqual("");
        });

        it("parses the properties property", function () {
            expect(this.arbitrarySpineItemToTest.properties).toEqual("page-spread-right rendition:layout-pre-paginated");
        });
    });

    describe("getJsonMetadata", function () {

        beforeEach(function () {
            this.metadata = this.parser.getJsonMetadata(this.xml);
        });

        it("parses the active class property", function () {
            expect(this.metadata.active_class).toEqual("-epub-media-overlay-active")
        });

        it("parses the author property", function () {
            expect(this.metadata.author).toEqual("");
        });

        it("parses the description property", function () {
            expect(this.metadata.description).toEqual("Lorem Ipsum Dolor sed");
        });

        it('parses the epub version number', function() {
            expect(this.metadata.epub_version).toEqual("2.0");
        });

        it('parses the identifier', function() {
            expect(this.metadata.id).toEqual("9782035862464");
        });

        it("parses the language property", function () {
            expect(this.metadata.language).toEqual("fr");
        });

        it("parses the layout property", function () {
            expect(this.metadata.layout).toEqual("");
        });

        it("parses the modified_date property", function () {
            expect(this.metadata.modified_date).toEqual("");
        });

        it("parses the ncx property", function () {
            expect(this.metadata.ncx).toEqual("ncx");
        });

        it("parses the orientation property", function () {
            expect(this.metadata.orientation).toEqual("");
        });

        it("parses page_prog_dir property", function () {
            expect(this.metadata.page_prog_dir).toEqual("");
        });

        it("parses the pubdate property", function () {
            expect(this.metadata.pubdate).toEqual("");
        });

        it("parses the publisher property", function () {
            expect(this.metadata.publisher).toEqual("Larousse");
        });

        it("parses the rights property", function () {
            expect(this.metadata.rights).toEqual("");
        });

        it("parses the spread property", function () {
            expect(this.metadata.spread).toEqual("");
        });

        it('parses the title', function() {
            expect(this.metadata.title).toEqual("L'espagnol dans votre poche");
        });
    });

    describe("getJsonManifest", function () {

        beforeEach(function () {
            this.manifest = this.parser.getJsonManifest(this.xml);
            this.arbitraryManifestItemToTest = this.manifest[3];
        });

        it("parses the entire manifest", function () {
            expect(this.manifest.length).toEqual(10);
        });

        it("parses the href property", function () {
            expect(this.arbitraryManifestItemToTest.href).toEqual("Page_4.html");
        });

        it("parses the id property", function () {
            expect(this.arbitraryManifestItemToTest.id).toEqual("Page_4");
        });

        it("parses the media overlay property", function () {
            expect(this.arbitraryManifestItemToTest.media_overlay).toEqual("Page_4_MO");
        });

        it("parses the media type property", function () {
            expect(this.arbitraryManifestItemToTest.media_type).toEqual("application/xhtml+xml");
        });

        it("parses the manifest properties", function () {
            expect(this.arbitraryManifestItemToTest.properties).toEqual("");
        });
    });

    describe("getJsonBindings", function () {

        beforeEach(function () {
            this.bindings = this.parser.getJsonBindings(this.xml);
            this.arbitraryBindingToTest = this.bindings[0];
        });

        it("parses the bindings", function() {
            expect(this.bindings.length).toEqual(1);
        });

        it("parses the handler property", function () {
            expect(this.arbitraryBindingToTest.handler).toEqual("figure-gallery-impl");
        });

        it("parses the media_type property", function () {
            expect(this.arbitraryBindingToTest.media_type).toEqual("application/x-epub-figure-gallery");
        });
    });

    describe("parse", function() {

        it("returns a javascript object", function() {
            var type;
            this.result = this.parser.parse(this.xml);
            type = typeof this.result;
            return expect(type).toEqual("object");
        });

        it("parses spine item properties", function() {
            var res;
            spyOn(this.parser, "parseSpineProperties");
            res = this.parser.parse(this.xml);
            return expect(this.parser.parseSpineProperties).toHaveBeenCalled();
        });

        it("parses the media:active-class metadata", function() {
            var res;
            res = this.parser.parse(this.xml);
            return expect(res.metadata.active_class).toEqual("-epub-media-overlay-active");
        });
    });

    describe("parseSpineProperties", function() {

        beforeEach(function() {
            this.spine = [
            {
                idref: 'Page_1',
                properties: 'page-spread-right rendition:layout-pre-paginated'
            }, {
                idref: 'Page_2',
                properties: ''
            }, {
                idref: 'Page_3',
                properties: ''
            }
            ];
            return this.res = this.parser.parseSpineProperties(this.spine);
        });

        it("returns an array", function() {
            return expect(this.res.length).toBeDefined();
        });

        it("add properties to the spine item if they exist", function() {
            expect(this.res[0].page_spread).toEqual('right');
            return expect(this.res[0].fixed_flow).toEqual(true);
        });

        it("leaves the properties string entact", function() {
            return expect(this.res[0].properties).toEqual('page-spread-right rendition:layout-pre-paginated');
        });
    });

    describe("paginateBackwards()", function() {

        it("returns false the page-progression-direction attr is not present", function() {
            var result;
            result = this.parser.paginateBackwards(this.xml);
            return expect(result).toBeFalsy();
        });

        it("returns false if the page-progression-direction attr is ltr", function() {
            var result;
            $('spine', this.xml).attr('page-progression-direction', 'rtl');
            result = this.parser.paginateBackwards(this.xml);
            return expect(result).toBeFalsy();
        });

        it("returns true if the page-progression-direction attr is rtl", function() {
            var result;
            $('spine', this.xml).attr('page-progression-direction', 'ltr');
            result = this.parser.paginateBackwards(this.xml);
            return expect(result).toBeTruthy();
        });
    });
});
