describe('GENERATED CFI PARSER', function () {

    it ('parses a CFI with index steps', function () {

        var cfi = "epubcfi(/4/6/4)";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "path",
                path: {

                    type: "indexStep",
                    stepLength: "4",
                    idAssertion: undefined
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        },
                        {
                            type: "indexStep",
                            stepLength: "4",
                            idAssertion: undefined
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

                type : "path",
                path: {

                    type: "indexStep",
                    stepLength: "4",
                    idAssertion: undefined
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9",
                        textAssertion: undefined
                    }
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it ('parses a CFI with an id assertion on an index step', function () {

        var cfi = "epubcfi(/4[abc]/6!/4:9)";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "path",
                path: {

                    type: "indexStep",
                    stepLength: "4",
                    idAssertion: "abc"
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9",
                        textAssertion: undefined
                    }
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it ('parses a CFI with an id assertion on an indirection step', function () {

        var cfi = "epubcfi(/4/6!/4[abc]:9)";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "path",
                path: {

                    type: "indexStep",
                    stepLength: "4",
                    idAssertion: undefined
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4",
                            idAssertion: "abc"
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9",
                        textAssertion: undefined
                    }
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it ('parses a CFI with a csv-only text location assertion on a character terminus', function () {

        var cfi = "epubcfi(/4/6!/4:9[aaa,bbb])";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "path",
                path: {

                    type: "indexStep",
                    stepLength: "4",
                    idAssertion: undefined
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9",
                        textAssertion: {

                            type: "textLocationAssertion",
                            csv: {

                                type: "csv",
                                preAssertion: "aaa",
                                postAssertion: "bbb"
                            },
                            parameter: ""
                        }
                    }
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it ('parses a CFI with a csv-only text location assertion, with preceeding text only, on a character terminus', function () {

        var cfi = "epubcfi(/4/6!/4:9[aaa,])";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "path",
                path: {

                    type: "indexStep",
                    stepLength: "4",
                    idAssertion: undefined
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9",
                        textAssertion: {

                            type: "textLocationAssertion",
                            csv: {

                                type: "csv",
                                preAssertion: "aaa",
                                postAssertion: ""
                            },
                            parameter: ""
                        }
                    }
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it ('parses a CFI with a csv-only text location assertion, with subsequent text only, on a character terminus', function () {

        var cfi = "epubcfi(/4/6!/4:9[,bbb])";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "path",
                path: {

                    type: "indexStep",
                    stepLength: "4",
                    idAssertion: undefined
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9",
                        textAssertion: {

                            type: "textLocationAssertion",
                            csv: {

                                type: "csv",
                                preAssertion: "",
                                postAssertion: "bbb"
                            },
                            parameter: ""
                        }
                    }
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it ('parses a CFI with a csv and parameter text location assertion on a character terminus', function () {

        var cfi = "epubcfi(/4/6!/4:9[aaa,bbb;s=b])";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "path",
                path: {

                    type: "indexStep",
                    stepLength: "4",
                    idAssertion: undefined
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9",
                        textAssertion: {

                            type: "textLocationAssertion",
                            csv: {

                                type: "csv",
                                preAssertion: "aaa",
                                postAssertion: "bbb"
                            },
                            parameter: {

                                type: "parameter",
                                LHSValue: "s",
                                RHSValue: "b"
                            }
                        }
                    }
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it ('parses a CFI with parameter-only text location assertion on a character terminus', function () {

        var cfi = "epubcfi(/4/6!/4:9[;s=b])";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "path",
                path: {

                    type: "indexStep",
                    stepLength: "4",
                    idAssertion: undefined
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9",
                        textAssertion: {

                            type: "textLocationAssertion",
                            csv: "",
                            parameter: {

                                type: "parameter",
                                LHSValue: "s",
                                RHSValue: "b"
                            }
                        }
                    }
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it ('parses a cfi with all the CFI escape characters', function () {

        var cfi = "epubcfi(/4[4^^^[^]^(^)^,^;^=]/6!/4:9)";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "path",
                path: {

                    type: "indexStep",
                    stepLength: "4",
                    idAssertion: "4^[](),;="
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        },
                        {
                            type: "indirectionStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9",
                        textAssertion: undefined
                    }
                }
            }
        }

        expect(parsedAST).toEqual(expectedAST);
    });

    it("parses a range CFI with element targets", function () {

        var cfi = "epubcfi(/2/2/4,/2/4,/4/6)";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "range",
                path: {

                    type: "indexStep",
                    stepLength: "2",
                    idAssertion: undefined
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "2",
                            idAssertion: undefined
                        },
                        {
                            type: "indexStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : ""
                },

                range1 : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "2",
                            idAssertion: undefined
                        },
                        {
                            type: "indexStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : ""
                },

                range2 : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "4",
                            idAssertion: undefined
                        },
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        }
                    ],
                    termStep : ""
                }
            }
        };

        expect(parsedAST).toEqual(expectedAST);
    });

    it("parses a range CFI with a text offset terminus", function () {

        var cfi = "epubcfi(/2/2/4,/2/4:3,/4/6:9)";
        var parsedAST = EPUBcfi.Parser.parse(cfi);

        var expectedAST = {

            type : "CFIAST",
            cfiString : {

                type : "range",
                path: {

                    type: "indexStep",
                    stepLength: "2",
                    idAssertion: undefined
                },

                localPath : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "2",
                            idAssertion: undefined
                        },
                        {
                            type: "indexStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : ""
                },

                range1 : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "2",
                            idAssertion: undefined
                        },
                        {
                            type: "indexStep",
                            stepLength: "4",
                            idAssertion: undefined
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "3",
                        textAssertion: undefined
                    }
                },
                
                range2 : {

                    steps : [
                        {
                            type: "indexStep",
                            stepLength: "4",
                            idAssertion: undefined
                        },
                        {
                            type: "indexStep",
                            stepLength: "6",
                            idAssertion: undefined
                        }
                    ],
                    termStep : {

                        type: "textTerminus",
                        offsetValue: "9",
                        textAssertion: undefined
                    }
                }
            }
        };

        expect(parsedAST).toEqual(expectedAST);
    });
});