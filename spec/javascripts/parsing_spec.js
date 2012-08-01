describe('parsing of EPUB CFIs', function () {

    it ('returns an AST for simple cfi steps', function () {

        var cfi = "epubcfi(/4/6/4/8)";
        
        var ast = EPUBcfi.Parser.parse(cfi);
        
    });


});