
describe ('The CFI interpreter', function () {

    var CFIAST;
    var $packageDocument;
    var $contentDocument;

    beforeEach(function () {

        // Generate CFI AST to reference a paragraph in the Moby Dick test features
        CFIAST = {

            type: "CFIAST",
            cfiString : {

                type : "cfiString",
                path: {

                    type: "indexStep",
                    stepLength: "6"
                },

                localPath : {

                    steps : [
                        {
                            type : "indexStep",
                            stepLength : "14"
                        },
                        {
                            type : "indirectionStep",
                            stepLength : "4"
                        },
                        {
                            type : "indexStep",
                            stepLength : "2" 
                        },
                        {
                            type : "indexStep",
                            stepLength : "14"
                        }
                    ]
                }
            }
        };

        // Set up package document
        var domParser = new window.DOMParser();
        var packageDocXML = jasmine.getFixtures().read("moby_dick_package.opf");
        $packageDocument = $(domParser.parseFromString(packageDocXML, "text/xml"));

        // Set up content document
        var contentDocXHTML = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
        $contentDocument = $(domParser.parseFromString(contentDocXHTML, 'text/xml'));

        spyOn($, "ajax").andCallFake(function (params) {

            params.success(contentDocXHTML);
        });
    });

    it ('interprets the cfi string node', function () {

        var $expectedResult = $('#c01p0006', $contentDocument);
        var $result = EPUBcfi.Interpreter.interpretCFIStringNode(CFIAST.cfiString, $packageDocument);

        expect($result.html()).toEqual($expectedResult.html());
    });

    it ('interprets an index step node', function () {

        var $expectedResult = $($('spine')[0]);
        var $result = EPUBcfi.Interpreter.interpretIndexStepNode(CFIAST.cfiString.path, $packageDocument);

        expect($result.html()).toEqual($expectedResult.html());
    });

    it ('interprets an indirection step node', function () {

        // The spy will return the correct content document, so this is more a test of whether this
        // method executes without error, given the starting element.
        var $expectedResult = $contentDocument;
        var $result = EPUBcfi.Interpreter.interpretIndirectionStepNode(
            CFIAST.cfiString.localPath.steps[0], 
            $('<itemref linear="yes" idref="xchapter_001"/>'), 
            $packageDocument);

        expect($result.html()).toEqual($expectedResult.html());
    });

});