// REFACTORING CANDIDATE: Spies are used to return fake values for the "pageIs..." methods. This was the approach used when 
//   these methods pulled this property off class values of DOM objects in the original Readium. A better approach for 
//   the version of page number logic being tested would be to pass a mock spineInfo collection. This should be done 
//   at some point. 

describe("EpubFixed.FixedPageNumberLogic", function () {

    var getSpineObjects = function () {

        var packageDocumentXML = jasmine.getFixtures().read("FXL_package_document.xml");
        var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
        var packageDocumentObject = epubParser.parse();
        var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
        var spineInfo = epub.getSpineInfo();
        return spineInfo.spine;
    };

    describe("initialization", function () {

        it("exists in namespace", function () {

            expect(EpubFixed.PageNumberDisplayLogic).toBeDefined();
        });

        it("can be instantiated", function () {

            this.pageNumSelector = new EpubFixed.PageNumberDisplayLogic(getSpineObjects());
            expect(this.pageNumSelector).toBeDefined();
        });
    });

    describe("public interface", function () {
        
        describe("getPageNumbers()", function () {

            beforeEach(function () {

                this.pageNumSelector = new EpubFixed.PageNumberDisplayLogic(getSpineObjects());

                // Rationale: This function will make these sets of repetitive tests clearer - as in, the conditions of the 
                //   EPUB, the page to go to and the expected result.
                this.testGetPageNumber = function (params) {

                    var selectedPageNums = this.pageNumSelector.getPageNumbers(
                        params.goToPage, 
                        params.twoUp, // two pages displayed?
                        params.pageProgDir // page prog. direction
                        );

                    return selectedPageNums;
                };
            });

            describe("1 page displayed", function () {

                it ("gets selected page number when LTR", function () {
                    var pageNums = this.testGetPageNumber({ twoUp : false, pageProgDir : "ltr", goToPage : 1});
                    expect(pageNums).toEqual([1]);
                });

                it ("gets selected page number when RTL", function () {
                    var pageNums = this.testGetPageNumber({ twoUp : false, pageProgDir : "rtl", goToPage : 1});
                    expect(pageNums).toEqual([1]);
                });
            });

            describe("2 pages displayed", function () {

                describe("FXL", function () {

                    describe("LTR", function () {

                        it("gets page numbers; go to p, p is left, p+1 is right", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "ltr", goToPage : 1});
                            expect(pageNums).toEqual([1, 2]);
                        });

                        it("gets page numbers; go to p, p is left, p+1 is left", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 || pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "ltr", goToPage : 1});
                            expect(pageNums).toEqual([1]);
                        });

                        it("gets page numbers; go to p, p is left, p+1 is center", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "ltr", goToPage : 1});
                            expect(pageNums).toEqual([1]);
                        });

                        it("gets page numbers; go to p, p is right, p-1 is left", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "ltr", goToPage : 2});
                            expect(pageNums).toEqual([1, 2]);
                        });
                    
                        it("gets page numbers; go to p, p is right, p-1 is right", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 || pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);
                            spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "ltr", goToPage : 2});
                            expect(pageNums).toEqual([2]);
                        });

                        it("gets page numbers; go to p, p is right, p-1 is center", function () {

                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 3 ? true : false; });

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "ltr", goToPage : 2});
                            expect(pageNums).toEqual([2]);
                        });

                        it("gets page numbers; go to p, p is center", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 3 ? true : false; });

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "ltr", goToPage : 2});
                            expect(pageNums).toEqual([2]);
                        });
                    });

                    describe("RTL", function () {

                        it("gets page numbers; go to p, p is right, p+1 is left", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "rtl", goToPage : 1});
                            expect(pageNums).toEqual([1, 2]);
                        });

                        it("gets page numbers; go to p, p is right, p+1 is right", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 || pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "rtl", goToPage : 1});
                            expect(pageNums).toEqual([1]);
                        });

                        it("gets page numbers; go to p, p is right, p+1 is center", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "rtl", goToPage : 1});
                            expect(pageNums).toEqual([1]);
                        });

                        it("gets page numbers; go to p, p is left, p-1 is right", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "rtl", goToPage : 2});
                            expect(pageNums).toEqual([1, 2]);
                        });

                        it("gets page numbers; go to p, p is left, p-1 is left", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 || pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);
                            spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "rtl", goToPage : 2});
                            expect(pageNums).toEqual([2]);
                        });

                        it("gets page numbers; go to p, p is left, p-1 is center", function () {

                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "rtl", goToPage : 2});
                            expect(pageNums).toEqual([2]);
                        });

                        it("gets page numbers; go to p, p is center", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 3 ? true : false; });

                            var pageNums = this.testGetPageNumber({ twoUp : true, pageProgDir : "rtl", goToPage : 2});
                            expect(pageNums).toEqual([2]);
                        });
                    });
                });
            });
        });

        describe("getPreviousPageNumbers()", function () {

            beforeEach(function () {

                this.pageNumSelector = new EpubFixed.PageNumberDisplayLogic(getSpineObjects());

                // Rationale: This function will make these sets of repetitive tests clearer - as in, the conditions of the 
                //   EPUB, the page to navigate to, and the expected result.
                this.testPrevPage = function (params) {

                    var selectedPageNums = this.pageNumSelector.getPreviousPageNumbers(
                        params.currentPages,
                        params.twoUp,
                        params.pageProgDir
                        );

                    return selectedPageNums;
                };
            });

            describe("FXL", function () {

                describe("RTL", function () {

                    it("gets page numbers; Going to p in [p, p-1], p is left, p-1 is right", function () {

                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 2 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 1 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                        var pageNums = this.testPrevPage({currentPages : [3, 4], twoUp : true, pageProgDir : "rtl"});
                        expect(pageNums).toEqual([1, 2]);
                    });

                    it("gets page numbers; Going to p in [p, p-1], p is left, p-1 is left", function () {

                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 1 || pageNum === 2 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);
                        spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                        var pageNums = this.testPrevPage({currentPages : [3, 4], twoUp : true, pageProgDir : "rtl"});
                        expect(pageNums).toEqual([2]);
                    });

                    it("gets page numbers; Going to p in [p, p-1], p is left, p-1 is center", function () {

                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 2 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                            return pageNum === 1 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                        var pageNums = this.testPrevPage({currentPages : [3, 4], twoUp : true, pageProgDir : "rtl"});
                        expect(pageNums).toEqual([2]);
                    });

                    it("gets page numbers; Going to p in [p, p-1], p is right", function () {

                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 2 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 1 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                        var pageNums = this.testPrevPage({currentPages : [3, 4], twoUp : true, pageProgDir : "rtl"});
                        expect(pageNums).toEqual([2]);
                    });

                    it("gets page numbers; Going to p in [p, p-1], p is center", function () {

                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 1 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                            return pageNum === 2 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 3 ? true : false; });

                        var pageNums = this.testPrevPage({currentPages : [3, 4], twoUp : true, pageProgDir : "rtl"});
                        expect(pageNums).toEqual([2]);
                    });
                });

                describe("LTR", function () {

                    it("gets page numbers; Going to p in [p-1, p], p is right, p-1 is left", function () {

                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 2 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 1 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                        var pageNums = this.testPrevPage({currentPages : [3, 4], twoUp : true, pageProgDir : "ltr"});
                        expect(pageNums).toEqual([1, 2]);
                    });

                    it("gets page numbers; Going to p in [p-1, p], p is right, p-1 is right", function () {

                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 1 || pageNum === 2 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                        var pageNums = this.testPrevPage({currentPages : [3, 4], twoUp : true, pageProgDir : "ltr"});
                        expect(pageNums).toEqual([2]);
                    });

                    it("gets page numbers; Going to p in [p-1, p], p is right, p-1 is center", function () {

                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 2 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                            return pageNum === 1 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);

                        var pageNums = this.testPrevPage({currentPages : [3, 4], twoUp : true, pageProgDir : "ltr"});
                        expect(pageNums).toEqual([2]);
                    });

                    it("gets page numbers; Going to p in [p-1, p], p is left", function () {

                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 2 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 1 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                        var pageNums = this.testPrevPage({currentPages : [3, 4], twoUp : true, pageProgDir : "ltr"});
                        expect(pageNums).toEqual([2]);
                    });

                    it("gets page numbers; Going to p in [p-1, p], p is center", function () {

                        spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                            return pageNum === 2 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 1 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                        var pageNums = this.testPrevPage({currentPages : [3, 4], twoUp : true, pageProgDir : "ltr"});
                        expect(pageNums).toEqual([2]);
                    });
                });
            });
        });

        describe("getNextPageNumbers()", function () {

            beforeEach(function () {

                this.pageNumSelector = new EpubFixed.PageNumberDisplayLogic(getSpineObjects());

                // Rationale: This function will make these sets of repetitive tests clearer - as in, the conditions of the 
                //   EPUB, the page to navigate to, and the expected result.
                this.testNextPage = function (params) {

                    var selectedPageNums = this.pageNumSelector.getNextPageNumbers(
                        params.currentPages,
                        params.twoUp, 
                        params.pageProgDir
                        );

                    return selectedPageNums;
                };
            });

            describe("FXL", function () {

                describe("RTL", function () {

                    it("gets page numbers; Going to p in [p+1, p], p is right, p+1 is left", function () {

                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 3 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 4 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                        var pageNums = this.testNextPage({currentPages : [1, 2], twoUp : true, pageProgDir : "rtl"});
                        expect(pageNums).toEqual([3, 4]);
                    });

                    it("gets page numbers; Going to p in [p+1, p], p is right, p+1 is right", function () {

                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 3 || pageNum === 4 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                        var pageNums = this.testNextPage({currentPages : [1, 2], twoUp : true, pageProgDir : "rtl"});
                        expect(pageNums).toEqual([3]);
                    });

                    it("gets page numbers; Going to p in [p+1, p], p is right, p+1 is center", function () {

                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 3 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                            return pageNum === 4 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);

                        var pageNums = this.testNextPage({currentPages : [1, 2], twoUp : true, pageProgDir : "rtl"});
                        expect(pageNums).toEqual([3]);
                    });

                    it("gets page numbers; Going to p in [p+1, p], p is left", function () {

                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 3 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 4 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                        var pageNums = this.testNextPage({currentPages : [1, 2], twoUp : true, pageProgDir : "rtl"});
                        expect(pageNums).toEqual([3]);
                    });

                    it("gets page numbers; Going to p in [p+1, p], p is center", function () {

                        spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                            return pageNum === 3 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 4 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);

                        var pageNums = this.testNextPage({currentPages : [1, 2], twoUp : true, pageProgDir : "rtl"});
                        expect(pageNums).toEqual([3]);
                    });
                });

                describe("LTR", function () {

                    it("gets page numbers; Going to p in [p, p+1], p is left, p+1 is right", function () {

                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 3 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 4 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                        var pageNums = this.testNextPage({currentPages : [1, 2], twoUp : true, pageProgDir : "ltr"});
                        expect(pageNums).toEqual([3, 4]);
                    });

                    it("gets page numbers; Going to p in [p, p+1], p is left, p+1 is left", function () {

                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 3 || pageNum === 4 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);
                        spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                        var pageNums = this.testNextPage({currentPages : [1, 2], twoUp : true, pageProgDir : "ltr"});
                        expect(pageNums).toEqual([3]);
                    });

                    it("gets page numbers; Going to p in [p, p+1], p is left, p+1 is center", function () {

                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 3 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                            return pageNum === 4 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                        var pageNums = this.testNextPage({currentPages : [1, 2], twoUp : true, pageProgDir : "ltr"});
                        expect(pageNums).toEqual([3]);
                    });

                    it("gets page numbers; Going to p in [p, p+1], p is right", function () {

                        spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                            return pageNum === 3 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 4 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                        var pageNums = this.testNextPage({currentPages : [1, 2], twoUp : true, pageProgDir : "ltr"});
                        expect(pageNums).toEqual([3]);
                    });

                    it("gets page numbers; Going to p in [p, p+1], p is center", function () {

                        spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                            return pageNum === 3 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                            return pageNum === 4 ? true : false; });
                        spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                        var pageNums = this.testNextPage({currentPages : [1, 2], twoUp : true, pageProgDir : "ltr"});
                        expect(pageNums).toEqual([3]);
                    });
                });
            });
        });

        describe("getPageNumbersForTwoUp()", function () {

            beforeEach(function () {
                
                this.pageNumSelector = new EpubFixed.PageNumberDisplayLogic(getSpineObjects());

                // Rationale: This function will make these sets of repetitive tests clearer - as in, the conditions of the 
                //   EPUB, the page to navigate to, and the expected result.
                this.testGotoPageNums = function (params) {

                    var selectedPageNums = this.pageNumSelector.getPageNumbersForTwoUp(
                        params.currentPages, 
                        params.twoUp, // the pages currently displayed 
                        params.pageProgDir // page progression direction
                        );

                    return selectedPageNums;
                };
            });

            describe("2 pages up", function () {

                describe("FXL", function () {

                    describe("LTR", function () {

                        it("gets 1 page number", function () {

                            // Page left/right shouldn't matter

                            var pageNums = this.testGotoPageNums({twoUp : true, pageProgDir : "ltr", currentPages : [1, 2]});
                            expect(pageNums).toEqual([1]);
                        });
                    });

                    describe("RTL", function () {

                        it("gets 1 page number", function () {

                            // Page left/right shouldn't matter

                            var pageNums = this.testGotoPageNums({twoUp : true, pageProgDir : "rtl", currentPages : [1, 2]});
                            expect(pageNums).toEqual([1]);
                        });
                    });
                });
            });

            describe("1 page up", function () {

                describe("FXL", function () {

                    describe("RTL", function () {

                        it("gets 2 page numbers; start p is right, p+1 is left", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "rtl", currentPages : [1]});
                            expect(pageNums).toEqual([1, 2]);
                        });

                        it("gets 1 page number; start p is right, p+1 is right", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 || pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "rtl", currentPages : [1]});
                            expect(pageNums).toEqual([1]);
                        });

                        it("gets 1 page number; start p is right, p+1 is center", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "rtl", currentPages : [1]});
                            expect(pageNums).toEqual([1]);
                        });

                        it("gets 2 page numbers; start p is left, p-1 is right", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "rtl", currentPages : [2]});
                            expect(pageNums).toEqual([1, 2]);
                        });

                        it("gets 1 page number; start p is left, p-1 is left", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 || pageNum === 2? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);
                            spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "rtl", currentPages : [2]});
                            expect(pageNums).toEqual([2]);
                        });

                        it("gets 1 page number; start p is left, p-1 is center", function () {

                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "rtl", currentPages : [2]});
                            expect(pageNums).toEqual([2]);
                        });

                        it("gets 1 page number; start p is center", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 3 ? true : false; });

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "rtl", currentPages : [2]});
                            expect(pageNums).toEqual([2]);
                        });
                    });

                    describe("LTR", function () {

                        it("gets 2 page numbers; start p left, p+1 is right", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "ltr", currentPages : [1]});
                            expect(pageNums).toEqual([1, 2]);
                        });

                        it("gets 1 page number; start p left, p+1 is left", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 || pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);
                            spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "ltr", currentPages : [1]});
                            expect(pageNums).toEqual([1]);
                        });

                        it("gets 1 page number; start p left, p+1 is center", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "ltr", currentPages : [1]});
                            expect(pageNums).toEqual([1]);
                        });

                        it("gets 2 page numbers; start p right, p-1 is left", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "ltr", currentPages : [2]});
                            expect(pageNums).toEqual([1, 2]);
                        });

                        it("gets 1 page number; start p right, p-1 is right", function () {

                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 1 || pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);
                            spyOn(this.pageNumSelector, "pageIsCenter").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "ltr", currentPages : [2]});
                            expect(pageNums).toEqual([2]);
                        });

                        it("gets 1 page number; start p right, p-1 is center", function () {

                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsLeft").andReturn(false);

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "ltr", currentPages : [2]});
                            expect(pageNums).toEqual([2]);
                        });

                        it("gets 1 page number; start p center", function () {

                            spyOn(this.pageNumSelector, "pageIsLeft").andCallFake(function (pageNum) {
                                return pageNum === 1 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsCenter").andCallFake(function (pageNum) {
                                return pageNum === 2 ? true : false; });
                            spyOn(this.pageNumSelector, "pageIsRight").andCallFake(function (pageNum) {
                                return pageNum === 3 ? true : false; });

                            var pageNums = this.testGotoPageNums({twoUp : false, pageProgDir : "ltr", currentPages : [2]});
                            expect(pageNums).toEqual([2]);
                        });
                    });
                });
            });
        });
    });

    describe("private helpers", function () {

        var pageNumSelector;
        beforeEach(function () {

            // A mocked spine info collection, with the required attribute
            spineObjects = [{
                    pageSpread : "left"
                },
                {
                    pageSpread : "right"
                },
                {
                    pageSpread : "center"
                }
            ]

            pageNumSelector = new EpubFixed.PageNumberDisplayLogic({spineObjects : spineObjects});
        });

        describe("pageIsRight()", function () {

            it("is true for a right page", function () {
                expect(pageNumSelector.pageIsRight(2)).toBe(true);
            });

            it("is false for a left page", function () {
                expect(pageNumSelector.pageIsRight(1)).toBe(false);
            });

            it("is false for a center page", function () {
                expect(pageNumSelector.pageIsRight(3)).toBe(false);
            });
        });

        describe("pageIsLeft()", function () {

            it("is true for a left page", function () {
                expect(pageNumSelector.pageIsLeft(1)).toBe(true);
            });

            it("is false for a right page", function () {
                expect(pageNumSelector.pageIsLeft(2)).toBe(false);
            });

            it("is false for a center page", function () {
                expect(pageNumSelector.pageIsLeft(3)).toBe(false);
            });
        });

        describe("pageIsCenter()", function () {

            it("is true for a center page", function () {
                expect(pageNumSelector.pageIsCenter(3)).toBe(true);
            });

            it("is false for a left page", function () {
                expect(pageNumSelector.pageIsCenter(1)).toBe(false);
            });

            it("is false for a right page", function () {
                expect(pageNumSelector.pageIsCenter(2)).toBe(false);
            });
        });
    });
});