describe('CFI library', function () {

    it('injects cfis into some arbitrary epub', function () {

        // Get the package document
        var packageDocURL = "http://testepub.dev/moby_dick/ops/package.opf";
        var packageDocument;
        var domParser;
        var $packageDocument;
        var cfi;
        var ast;

        $.ajax({

            type: "GET",
            url: packageDocURL,
            dataType: "xml",
            async: "false",
            success: function (response) {

                packageDocument = response;
            }
        });

        domParser = new window.DOMParser();
        $packageDocument = $(domParser.parseFromString(packageDocument, "text/xml"));

        // Parse some cfi
        cfi = 'epubcfi(/6/4/4:9)';
        ast = EPUBcfi.Parser.parse(cfi);

        // inject!! 
        EPUBcfi.Interpreter.injectCFIReferenceElements(ast, $packageDocument);

        // Check that that shit worked. 
    });
});