describe("CFI GENERATOR", function () {

    it("can generate CFI steps recursively for a single content document", function () {

        var dom = 
            "<html>"
            +    "<div></div>"
            +    "<div>"
            +         "<div id='startParent'>"
            +             "<div></div>"
            +             "textnode1"
            +             "<div></div>"
            +             "textNode2"
            +             "<div></div>"
            +         "</div>"
            +     "</div>"
            +     "<div></div>"
            + "</html>";
        var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));

        var generatedCFI = EPUBcfi.Generator.createCFIElementSteps($($('#startParent', $dom).contents()[0]), "html");
        expect(generatedCFI).toEqual("!/4/2[startParent]/2"); 
    });

    it("can infer the presence of a single node from multiple adjacent nodes", function () {

        var dom = 
            "<html>"
            +    "<div></div>"
            +    "<div>"
            +         "<div id='startParent'>"
            +             "<div></div>"
            +             "textnode1.0"
            +             "<div class='cfi-marker'></div>"
            +             "textnode1.1"
            +             "<div class='cfi-marker'></div>"
            +             "textnode1.2"            
            +             "<div></div>"
            +             "textNode2"
            +             "<div></div>"
            +         "</div>"
            +     "</div>"
            +     "<div></div>"
            + "</html>";
        var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));

        var $startNode = $($('#startParent', $dom).contents()[5]);
        var textTerminus = EPUBcfi.Generator.createCFITextNodeStep($startNode, 3, ["cfi-marker"]);
        var generatedCFI = EPUBcfi.Generator.createCFIElementSteps($startNode.parent(), "html", ["cfi-marker"]) + textTerminus;

        expect(generatedCFI).toEqual("!/4/2[startParent]/3:3"); // [ te,xtn]
    });

    it("calculates the original character offset", function () {

        var dom = 
            "<html>"
            +    "<div></div>"
            +    "<div>"
            +         "<div id='startParent'>"
            +             "<div></div>"
            +             "textnode1.0"
            +             "<div class='cfi-marker'></div>"
            +             "textnode1.1"
            +             "<div class='cfi-marker'></div>"
            +             "textnode1.2"            
            +             "<div></div>"
            +             "textNode2"
            +             "<div></div>"
            +         "</div>"
            +     "</div>"
            +     "<div></div>"
            + "</html>";
        var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));

        var orgIndexFromSplitNodes = EPUBcfi.Generator.findOriginalTextNodeCharOffset($($('#startParent', $dom).contents()[3]), 3, ["cfi-marker"]);
        var orgIndexFromSingleNode = EPUBcfi.Generator.findOriginalTextNodeCharOffset($($('#startParent', $dom).contents()[7]), 3, ["cfi-marker"]);
        expect(orgIndexFromSplitNodes).toEqual(13);
        expect(orgIndexFromSingleNode).toEqual(3);
    });

    it("can generate a complete CFI for both the content document and package document", function () {

        var packageDocXhtml = 
        "<package>" 
        +   "<div></div>"
        +   "<div></div>"
        +   "<div>"
        +       "<spine>"
        +           "<itemref></itemref>"
        +           "<itemref></itemref>"
        +           "<itemref idref='contentDocId'></itemref>" 
        +       "</spine>"
        +   "</div>"
        + "</package>";

        var contentDocXhtml = 
        "<html>"
        +   "<div></div>"
        +   "<div>"
        +       "<div id='startParent'>"
        +           "<div></div>"
        +           "textnode1"
        +           "<div></div>"
        +           "textNode2"
        +           "<div></div>"
        +       "</div>"
        +   "</div>"
        +   "<div></div>"
        + "</html>";

        var contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
        var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");

        var contentDocCFIComponent = EPUBcfi.Generator.generateCharacterOffsetCFIComponent($('#startParent', contentDoc).contents()[1], 3);
        var packageDocCFIComponent = EPUBcfi.Generator.generatePackageDocumentCFIComponent("contentDocId", packageDoc);
        var generatedCFI = EPUBcfi.Generator.generateCompleteCFI(packageDocCFIComponent, contentDocCFIComponent);

        expect(generatedCFI).toEqual("epubcfi(/6/2/6!/4/2[startParent]/3:3)"); // [ te,xtn]
    });

    it('can generate a CFI for an actual epub', function () {

        var contentDocXhtml = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
        var contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
        var packageDocXhtml = jasmine.getFixtures().read("moby_dick_package.opf");
        var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");

        var contentDocCFIComponent = EPUBcfi.Generator.generateCharacterOffsetCFIComponent($("#c01p0008", contentDoc)[0].firstChild, 103);
        var packageDocCFIComponent = EPUBcfi.Generator.generatePackageDocumentCFIComponent("xchapter_001", packageDoc);
        var generatedCFI = EPUBcfi.Generator.generateCompleteCFI(packageDocCFIComponent, contentDocCFIComponent);

        expect(generatedCFI).toEqual("epubcfi(/6/14!/4[body1]/2/18[c01p0008]/1:103)"); // [, a,lof]
    });

    it("can generate a CFI without a terminus", function () {

        var contentDocXhtml = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
        var contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
        var packageDocXhtml = jasmine.getFixtures().read("moby_dick_package.opf");
        var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");

        var contentDocCFIComponent = EPUBcfi.Generator.generateElementCFIComponent($("#c01p0008", contentDoc)[0]);
        var packageDocCFIComponent = EPUBcfi.Generator.generatePackageDocumentCFIComponent("xchapter_001", packageDoc);
        var generatedCFI = EPUBcfi.Generator.generateCompleteCFI(packageDocCFIComponent, contentDocCFIComponent);

        expect(generatedCFI).toEqual("epubcfi(/6/14!/4[body1]/2/18[c01p0008])");
    });

    it("can generate a CFI without a terminus when the start element is the 'html' element", function () {

        var contentDocXhtml = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
        var contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
        var packageDocXhtml = jasmine.getFixtures().read("moby_dick_package.opf");
        var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");

        var contentDocCFIComponent = EPUBcfi.Generator.generateElementCFIComponent($("html", contentDoc)[0]);
        var packageDocCFIComponent = EPUBcfi.Generator.generatePackageDocumentCFIComponent("xchapter_001", packageDoc);
        var generatedCFI = EPUBcfi.Generator.generateCompleteCFI(packageDocCFIComponent, contentDocCFIComponent);        

        expect(generatedCFI).toEqual("epubcfi(/6/14!/2)");
    });

    describe("CFI GENERATOR ERROR HANDLING", function () {

        var contentDocXhtml;
        var contentDoc;
        var packageDocXhtml;
        var packageDoc;
        var startTextNode;

        beforeEach(function () {

            contentDocXhtml = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
            contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
            packageDocXhtml = jasmine.getFixtures().read("moby_dick_package.opf");
            packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");
            startTextNode = $("#c01p0008", contentDoc)[0].firstChild;
        });

        it("throws an error if a text node is not supplied as a starting point", function () {

            expect(function () {
                EPUBcfi.Generator.generateCharacterOffsetCFIComponent(undefined, 103, "xchapter_001", packageDoc)})
            .toThrow(
                EPUBcfi.NodeTypeError(undefined, "Cannot generate a character offset from a starting point that is not a text node")
            );
        });

        it("throws an error if the character offset is less then 0", function () {

           expect(function () {
                EPUBcfi.Generator.generateCharacterOffsetCFIComponent(startTextNode, -1, "xchapter_001", packageDoc)})
            .toThrow(
                EPUBcfi.OutOfRangeError(-1, 0, "Character offset cannot be less than 0")
            ); 
        });

        it("throws an error if the character offset is greater than the length of the text node", function () {

           expect(function () {
                EPUBcfi.Generator.generateCharacterOffsetCFIComponent(startTextNode, startTextNode.nodeValue.length + 1, "xchapter_001", packageDoc)})
            .toThrow(
                EPUBcfi.OutOfRangeError(
                    startTextNode.nodeValue.length + 1, 
                    startTextNode.nodeValue.length, 
                    "character offset cannot be greater than the length of the text node")
            ); 
        });

        it("throws an error if an idref is not supplied", function () {

            expect(function () {
                EPUBcfi.Generator.generatePackageDocumentCFIComponent(undefined, packageDoc)})
            .toThrow(
                Error("The idref for the content document, as found in the spine, must be supplied")
            );
        });

        it("throws an error if a package document is not supplied", function () {

            expect(function () {
                EPUBcfi.Generator.generatePackageDocumentCFIComponent("xchapter_001", undefined)})
            .toThrow(
                Error("A package document must be supplied to generate a CFI")
            );
        });

        it("throws an error if the idref does not match any idref attribute on itemref elements in the spine", function () {

            expect(function () {
                EPUBcfi.Generator.generatePackageDocumentCFIComponent("xchapter_", packageDoc)})
            .toThrow(
                Error("The idref of the content document could not be found in the spine")
            );
        });

        it("throws an error if target element is undefined", function () {

            expect(function () {
                EPUBcfi.Generator.validateStartElement(undefined)})
            .toThrow(
                Error("CFI target element is undefined")
            );
        });

        it("throws an error if target element is not an HTML element", function () {

            expect(function () {
                EPUBcfi.Generator.validateStartElement(document.createTextNode("a text node"))})
            .toThrow(
                Error("CFI target element is not an HTML element")
            );
        });
    });
});