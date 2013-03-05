describe('PACKAGE_DOCUMENT', function() {
    
    describe("initialization", function() {

        beforeEach(function() {

            var xml_string;
            var domXML;
            var parser;
            var packageDocumentJson;
            
            // Parse XML
            xml_string = jasmine.getFixtures().read('package_document.xml');
            domXML = new window.DOMParser().parseFromString(xml_string, 'text/xml');

            // Get a package document parser object 
            parser = new Helper.PackageDocumentParser({ uriObject : new URI("http://google.com") });
            packageDocumentJson = parser.parse(domXML);

            // Initialize the package document
            this.packageDocument = new Epub.PackageDocument({ packageDocumentJson : packageDocumentJson });

            // this.packageDocument.uri_obj = new URI("http://google.ca");
            // spyOn(this.packageDocument, "crunchSpine");
            // this.json = this.packageDocument.parse(this.xml);
        });

        it("exists in the namespace", function() {
            
            expect(Epub.PackageDocument).toBeDefined();
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

    describe("parsing the xml", function() {
        
        

        //           
    });
});
