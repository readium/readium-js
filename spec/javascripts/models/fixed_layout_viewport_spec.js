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