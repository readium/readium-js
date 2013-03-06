
describe('CFI INTERPRETER OBJECT', function () {

    var CFI;
    var CFIAST;
    var $packageDocument;
    var contentDocument;
    var $contentDocument;

    beforeEach(function () {

        // Generate CFI AST to reference a paragraph in the Moby Dick test features
        CFI = "epubcfi(/6/14!/4/2/14/1:4)";
        CFIAST = EPUBcfi.Parser.parse(CFI);

        // Set up package document
        var domParser = new window.DOMParser();
        var packageDocXML = jasmine.getFixtures().read("moby_dick_package.opf");
        $packageDocument = $(domParser.parseFromString(packageDocXML, "text/xml"));

        // Set up content document
        var contentDocXHTML = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
        contentDocument = domParser.parseFromString(contentDocXHTML, 'text/xml');
        $contentDocument = $(contentDocument);

        spyOn($, "ajax").andCallFake(function (params) {

            params.success(domParser.parseFromString(contentDocXHTML, 'text/xml'));
        });
    });

    it('can inject text when supplied with a content document', function () {

        var expectedResult = 'c01p0006';
        var $result = EPUBcfi.Interpreter.injectElement(CFI, contentDocument, "<span></span>");
        expect($result.attr("id")).toEqual(expectedResult);
    });

    it('returns a text node CFI target', function () {

        var CFI = "epubcfi(/6/14!/4/2/14/1:4)";
        var textNode = 3;
        var $result = EPUBcfi.Interpreter.getTargetElement(CFI, contentDocument);
        expect($result[0].nodeType).toEqual(textNode); 
    });

    it('returns an element target for a CFI with no terminus', function () {

        var CFI = "epubcfi(/6/14!/4/2/14)";
        var expectedResult = 'c01p0006';
        var $result = EPUBcfi.Interpreter.getTargetElement(CFI, contentDocument);
        expect($result.attr("id")).toEqual(expectedResult); 
    });

    it('interprets an index step node without an id assertion', function () {

        var $expectedResult = $($('spine', $packageDocument)[0]);
        var $result = EPUBcfi.Interpreter.interpretIndexStepNode(CFIAST.cfiString.path, $($packageDocument.children()[0]));

        expect($result.children()[0]).toEqual($expectedResult.children()[0]);
    });

    it('injects an element for a text terminus with a text location assertion', function () {

        var $expectedResult = 'Ther<span xmlns="http://www.w3.org/1999/xhtml" class="cfi_marker"></span>e now is your insular city of the Manhattoes, belted round by wharves as Indian isles by coral reefs—commerce surrounds it with her surf. Right and left, the streets take you waterward. Its extreme downtown is the battery, where that noble mole is washed by waves, and cooled by breezes, which a few hours previous were out of sight of land. Look at the crowds of water-gazers there.';
        var $result = EPUBcfi.Interpreter.interpretTextTerminusNode(
            CFIAST.cfiString.localPath.termStep,
            $($("#c01p0002", $contentDocument)[0].firstChild),
            '<span class="cfi_marker"></span>');

        expect($result.html()).toEqual($expectedResult);
    });

    // Rationale: This test is really only testing the decodeURI() method, which does not require testing. This spec exists
    //   as a reminder that the interpreter currently uses this method to decode URI-encoded CFIs.
    it('decodes a CFI for URI escape characters', function () {

        var cfi = "epubcfi(/2[%20%25%22af]/4/1:4)";
        var decodedCFI = decodeURI(cfi);
        expect(decodedCFI).toEqual('epubcfi(/2[ %"af]/4/1:4)');
    });

    it('returns the href of a content document for the first indirection step of a cfi', function () {

        var result = EPUBcfi.Interpreter.getContentDocHref(CFI, $packageDocument);
        expect(result).toEqual("chapter_001.xhtml");
    });

    describe('The hack zone! Interpretation of partial CFIs', function () {

        it('can interpret a partial CFI for a content document', function () {

            var CFI = "epubcfi(/4/2/14)";
            var expectedResult = 'c01p0006';
            var $result = EPUBcfi.Interpreter.getTargetElementWithPartialCFI(CFI, contentDocument);
            expect($result.attr("id")).toBe(expectedResult);
        });

        it('finds a text node and offset for a partial terminus CFI', function () {

            var CFI = "epubcfi(/4/2/14/1:4)";
            var textNodeType = 3;
            var expectedTextOffset = 4;
            var textTerminusInfo = EPUBcfi.Interpreter.getTextTerminusInfoWithPartialCFI(CFI, contentDocument);
            var $textNode = textTerminusInfo.textNode;
            var textOffset = textTerminusInfo.textOffset;

            expect($textNode[0].nodeType).toBe(textNodeType); 
            expect(textOffset).toBe(4);
        });
    });
});

describe('CFI INTERPRETER ERROR HANDLING', function () {
    
    describe('ERROR HANDLING FOR "NODE TYPE" ERRORS', function () {

        var CFIAST;
        var $packageDocument;
        var $contentDocument;

        beforeEach(function () {

            // Generate CFI AST to reference a paragraph in the Moby Dick test features
            CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4/2/14/1:4)");
        });

        it('detects an index step "node type" error', function () {

            expect(function () {
                EPUBcfi.Interpreter.interpretIndexStepNode(undefined, undefined)}
            ).toThrow(
                EPUBcfi.NodeTypeError(undefined, "expected index step node")
                );
        });

        it('detects an indirection step "node type" error', function () {

            expect(function () {
                EPUBcfi.Interpreter.interpretIndirectionStepNode(
                    undefined, 
                    $('<itemref linear="yes" idref="xchapter_001"/>'))}
            ).toThrow(
                EPUBcfi.NodeTypeError(undefined, "expected indirection step node")
                );
        });

        it('detects a text terminus "node type" error', function () {

            expect(function () {
                EPUBcfi.Interpreter.interpretTextTerminusNode(
                undefined,
                undefined)}
            ).toThrow(
                EPUBcfi.NodeTypeError(undefined, "expected text terminus node")
                );
        });
    });

describe('ERROR HANDLING FOR ID AND TEXT ASSERTIONS', function () {

        var CFIAST;
        var $packageDocument;
        var $contentDocument;

        beforeEach(function () {

            // Set up package document
            var domParser = new window.DOMParser();
            var packageDocXML = jasmine.getFixtures().read("moby_dick_package.opf");
            $packageDocument = $(domParser.parseFromString(packageDocXML, "text/xml"));

            // Set up content document
            var contentDocXHTML = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
            $contentDocument = $(domParser.parseFromString(contentDocXHTML, 'text/xml'));

            spyOn($, "ajax").andCallFake(function (params) {

                params.success(domParser.parseFromString(contentDocXHTML, 'text/xml'));
            });
        });

        it('detects a mis-match between an id assertion and a target element id, for an index step', function () {

            // Generate CFI AST to reference a paragraph in the Moby Dick test features
            CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4/2/14[c01p0002]/1:4)");

            expect(function () {
                EPUBcfi.Interpreter.interpretIndexStepNode(
                CFIAST.cfiString.localPath.steps[3],
                $("section", $contentDocument))}
            ).toThrow(
                EPUBcfi.CFIAssertionError("c01p0002", "c01p0006", "Id assertion failed")
                );
        });

        it('does not throw an error when the id assertion matches the target element id, for an index step', function () {

            // Generate CFI AST to reference a paragraph in the Moby Dick test features
            CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4/2/14[c01p0006]/1:4)");

            // Expecting that no error is thrown; if one is, it'll cause this test to fail
            EPUBcfi.Interpreter.interpretIndexStepNode(
                CFIAST.cfiString.localPath.steps[3],
                $("section", $contentDocument));
        });

        it('detects a mis-match between an id assertion and a target element id, for an indirection step', function () {

            // Generate CFI AST to reference a paragraph in the Moby Dick test features
            CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4[body2]/2/14[c01p0006]/1:4)");

            // Faking the follow indirection step, it'll return an element with an id that doesn't match the assertion
            spyOn(EPUBcfi.CFIInstructions, "followIndirectionStep").andCallFake(function (params) {

                return $('<body></body>').attr("id", "body1");
            });

            expect(function () {
                EPUBcfi.Interpreter.interpretIndirectionStepNode(
                CFIAST.cfiString.localPath.steps[1],
                undefined)}
            ).toThrow(
                EPUBcfi.CFIAssertionError("body2", "body1", "Id assertion failed")
                );
        });

        it('does not throw an error when the id assertion matches the target element id, for an indirection step', function () {

            // Generate CFI AST to reference a paragraph in the Moby Dick test features
            CFIAST = EPUBcfi.Parser.parse("epubcfi(/6/14!/4[body1]/2/14[c01p0002]/1:4)");

            // Faking the follow indirection step, it'll return an element with an id that matches the assertion
            spyOn(EPUBcfi.CFIInstructions, "followIndirectionStep").andCallFake(function (params) {

                return $('<body></body>').attr("id", "body1");
            });

            // Expecting that no error is thrown; if one is, it'll cause this test to fail
            EPUBcfi.Interpreter.interpretIndirectionStepNode(
                CFIAST.cfiString.localPath.steps[1],
                undefined);
        });
    });
});