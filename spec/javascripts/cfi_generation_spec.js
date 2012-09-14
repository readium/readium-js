describe("CFI GENERATOR", function () {

    it("can generate CFI steps recursively for a single content document", function () {

        var dom = "<html> <div></div> <div> <div id='startParent'> <div></div> textnode1 <div></div> textNode2 <div></div> </div> </div> <div></div> </html>";
        var $dom = $((new window.DOMParser).parseFromString(dom, "text/xml"));

        var generatedCFI = EPUBcfi.Generator.createCFIElementSteps($($('#startParent', $dom).contents()[2]), 3, "html");

        // This should be checked to see if this is what we actually expect, particularly with regards to the character 
        //   offsets
        expect(generatedCFI).toEqual("!/4/2[startParent]/3:3[ te,xtn]");
    });

    it("can generate a complete CFI for both the content document and package document", function () {

        var packageDocXhtml = "<package> <div></div><div></div><div> <spine> <itemref></itemref> <itemref></itemref> <itemref idref='contentDocId'></itemref> </spine> </div> </package>"
        var contentDocXhtml = "<html> <div></div> <div> <div id='startParent'> <div></div> textnode1 <div></div> textNode2 <div></div> </div> </div> <div></div> </html>";
        var contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
        var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");

        var generatedCFI = EPUBcfi.Generator.generateCharacterOffsetCFI($($('#startParent', contentDoc).contents()[2]), 3, "contentDocId", packageDoc);

        // This should be checked to see if this is what we actually expect, particularly with regards to the character 
        //   offsets
        expect(generatedCFI).toEqual("epubcfi(/6/2/6!/4/2[startParent]/3:3[ te,xtn])");
    });

    it('can generate a CFI for an actual epub', function () {

        var contentDocXhtml = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
        var contentDoc = (new window.DOMParser).parseFromString(contentDocXhtml, "text/xml");
        var packageDocXhtml = jasmine.getFixtures().read("moby_dick_package.opf");
        var packageDoc = (new window.DOMParser).parseFromString(packageDocXhtml, "text/xml");

        var generatedCFI = EPUBcfi.Generator.generateCharacterOffsetCFI($("#c01p0008", contentDoc)[0].firstChild, 103, "xchapter_001", packageDoc);

        expect(generatedCFI).toEqual("epubcfi(/6/14!/4[body1]/2/18[c01p0008]/1:103[, a,lof])");
    });

});