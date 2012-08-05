describe('EPUB CFI generated parser', function () {

    it ('parses a CFI with index steps', function () {

        var cfi = "epubcfi(/4/6/4)";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "cfiString",
                path: {

                    type: "indexStep",
                    stepLength: "4"
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6"
                        },
                        {
                            type: "indexStep",
                            stepLength: "4"
                        }
                    ],
                    termStep : ""
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it ('parses a CFI with index steps and indirection steps', function () {

        var cfi = "epubcfi(/4/6!/4:9)";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "cfiString",
                path: {

                    type: "indexStep",
                    stepLength: "4"
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6"
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4"
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9"
                    }
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });
});