describe("Epub.ManifestItem", function() {

    beforeEach(function() {

        spyOn(Readium, "FileSystemApi");
        spyOn(Epub.ManifestItem.prototype, "resolvePath");

        this.man_item_attrs = {
            href: "Font/Helvetica-0850.otf",
            id: "id4",
            media_overlay: "",
            media_type: "image/svg+xml",
            properties: ""
        };

        this.man_item = new Epub.ManifestItem(this.man_item_attrs);
    });

    describe("initialization", function() {

        it("works", function() {

            var man_item;
            man_item = new Epub.ManifestItem(this.man_item_attrs);
            expect(man_item.loadContent).toBeDefined();
        });
    });

    describe("isImage()", function() {

        it("is not an image if it is svg", function() {

            expect(this.man_item.isImage()).toBeFalsy();
        });

        it("is not an image if it is xhtml", function() {
          
            this.man_item.set("media_type", "application/xhtml+xml");
            expect(this.man_item.isImage()).toBeFalsy();
        });

        it("is an image if it has an image mime", function() {
            
            this.man_item.set("media_type", "image/jpeg");
            expect(this.man_item.isImage()).toBeTruthy();

            this.man_item.set("media_type", "image/png");
            expect(this.man_item.isImage()).toBeTruthy();
        });
    });

    describe("isSvg()", function() {

        it("is svg if it has an svg mime", function() {

            expect(this.man_item.isSvg()).toBeTruthy();
        });
        
        it("is not svg if it deos not have svg mime", function() {

            this.man_item.set("media_type", "application/xhtml+xml");
            expect(this.man_item.isSvg()).toBeFalsy();
        });
    });
    describe("parseViewboxTag()", function() {

        beforeEach(function() {

            var parser, xml_string;
            xml_string = jasmine.getFixtures().read('manifest_item.svg');
            parser = new window.DOMParser();
            this.dom = parser.parseFromString(xml_string, 'text/xml');
            this.man_item = new Epub.ManifestItem(this.man_item_attrs);
            spyOn(this.man_item, "getContentDom").andReturn(this.dom);
        });

        it("loads the dom", function() {

            this.man_item.parseViewboxTag();

            expect(this.man_item.getContentDom).toHaveBeenCalled();
        });

        it("parses the tag", function() {

            var result;
            result = this.man_item.parseViewboxTag();

            expect(result.width).toEqual(368);
            expect(result.height).toEqual(581);
        });
    });
});

describe("Epub.SpineItem", function() {

    beforeEach(function() {
        spyOn(Readium, "FileSystemApi");
        spyOn(Epub.SpineItem.prototype, "resolvePath");
        
        this.spine_item_attrs = {
            href: "Content/pageNum-9.svg",
            id: "ch9",
            idref: "ch9",
            media_overlay: "",
            media_type: "image/svg+xml",
            page_prog_dir: "",
            properties: "",
            spine_index: 6
        };
    });

    describe("initialization", function() {

        it("works", function() {

            var spine_item;
            spine_item = new Epub.SpineItem(this.spine_item_attrs);
            expect(spine_item.isImage).toBeDefined();
        });

        it("calls loadContent() if the content is fixed layout", function() {

            var spine_item;
            spyOn(Epub.SpineItem.prototype, "loadContent");
            spine_item = new Epub.SpineItem(this.spine_item_attrs);
            expect(Epub.SpineItem.prototype.loadContent).toHaveBeenCalled();
        });

        it("call does not call loadContent() if the content is reflowable", function() {
            
            var spine_item;
            spyOn(Epub.SpineItem.prototype, "loadContent");
            spyOn(Epub.SpineItem.prototype, "isFixedLayout").andReturn(false);
            spine_item = new Epub.SpineItem(this.spine_item_attrs);
            expect(Epub.SpineItem.prototype.loadContent).not.toHaveBeenCalled();
        });
    });

    describe("isFixedLayout()", function() {

        beforeEach(function() {

            this.spine_item = new Epub.SpineItem(this.spine_item_attrs);
            return this.spine_item.set("media_type", "application/xhtml+xml");
        });

        it("is fixed layout it it is an image", function() {

            spyOn(this.spine_item, "isImage").andReturn(true);
            return expect(this.spine_item.isFixedLayout()).toBeTruthy();
        });

        it("is fixed layout if it is svg", function() {

            spyOn(this.spine_item, "isSvg").andReturn(true);
            return expect(this.spine_item.isFixedLayout()).toBeTruthy();
        });

        it("it defaults to checking what the books is", function() {

            var collection;
            collection = {
              isBookFixedLayout: jasmine.createSpy()
            };
            this.spine_item.collection = collection;
            this.spine_item.isFixedLayout();
            return expect(collection.isBookFixedLayout).toHaveBeenCalled();
        });

        it("is fixed layout if its fixed_flow property is set", function() {

            this.spine_item.set("fixed_flow", true);
            return expect(this.spine_item.isFixedLayout()).toBeTruthy();
        });
    });
});
