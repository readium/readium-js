describe('parsing of EPUB CFIs', function () {

    it ('parses a CFI with index steps', function () {

        var cfi = "epubcfi(/4/6/4)";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "cfiString",
            cfiString : {

                type: "packageDocPath",
                step: {

                    type: "indexStep",
                    stepLength: "4"
                },

                localPath : {

                    type : "localPath",
                    step : [
                        {
                            type: "indexStep",
                            stepLength: "6"
                        },
                        {
                            type: "indexStep",
                            stepLength: "4"
                        }
                    ]
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it ('parses a CFI with index steps and indirection steps', function () {

        var cfi = "epubcfi(/4/6!/4)";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "cfiString",
            cfiString : {

                type: "packageDocPath",
                step: {

                    type: "indexStep",
                    stepLength: "4"
                },

                localPath : {

                    type : "localPath",
                    step : [
                        {
                            type: "indexStep",
                            stepLength: "6"
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4"
                        }
                    ]
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });
});