describe("EpubReflowable.ReflowablePageNumberLogic", function () {

    describe("getGotoPageNumsToDisplay()", function () {

        beforeEach(function () {
            this.pageNumSelector = new EpubReflowable.ReflowablePageNumberLogic();

            // Rationale: This function will make these sets of repetitive tests clearer - as in, the conditions of the 
            //   EPUB, the page to go to and the expected result.
            this.testGetPageNumber = function (params) {

                var selectedPageNums = this.pageNumSelector.getGotoPageNumsToDisplay(
                    params.goToPage, 
                    params.twoUp, // two pages displayed?
                    params.firstPageOffset // first page offset
                    );

                return selectedPageNums;
            };
        });

        describe("1 page displayed", function () {

            it ("gets selected page number when LTR", function () {
                var pageNums = this.testGetPageNumber({ twoUp : false, firstPageOffset : false, goToPage : 1});
                expect(pageNums).toEqual([1]);
            });

            it ("gets selected page number when RTL", function () {
                var pageNums = this.testGetPageNumber({ twoUp : false, firstPageOffset : false, goToPage : 1});
                expect(pageNums).toEqual([1]);
            });
        });

        describe("2 pages displayed", function () {

            describe("LTR", function () {

                it("gets 2 page numbers; go to p, p is odd", function () {
                    var pageNums = this.testGetPageNumber({ twoUp : true, firstPageOffset : false, goToPage : 1});
                    expect(pageNums).toEqual([1, 2]);
                });

                it("gets 2 page numbers; go to p, p is odd, offset", function () {
                    var pageNums = this.testGetPageNumber({ twoUp : true, firstPageOffset : true, goToPage : 3});
                    expect(pageNums).toEqual([2, 3]);
                });

                it("gets 2 page numbers; go to p, p is even", function () {
                    var pageNums = this.testGetPageNumber({ twoUp : true, firstPageOffset : false, goToPage : 2});
                    expect(pageNums).toEqual([1, 2]);
                });

                it("gets 2 page numbers; go to p, p is even, offset", function () {
                    var pageNums = this.testGetPageNumber({ twoUp : true, firstPageOffset : true, goToPage : 2});
                    expect(pageNums).toEqual([2, 3]);
                });
            });

            describe("RTL", function () {

                it("gets 2 page numbers; go to p, p is odd", function () {
                    var pageNums = this.testGetPageNumber({ twoUp : true, firstPageOffset : false, goToPage : 1});
                    expect(pageNums).toEqual([1, 2]);
                });

                it("gets 2 page numbers; go to p, p is odd, offset", function () {
                    var pageNums = this.testGetPageNumber({ twoUp : true, firstPageOffset : true, goToPage : 3});
                    expect(pageNums).toEqual([2, 3]);
                });

                it("gets 2 page numbers; go to p, p is even", function () {
                    var pageNums = this.testGetPageNumber({ twoUp : true, firstPageOffset : false, goToPage : 2});
                    expect(pageNums).toEqual([1, 2]);
                });

                it("gets 2 page numbers; go to p, p is even, offset", function () {
                    var pageNums = this.testGetPageNumber({ twoUp : true, firstPageOffset : true, goToPage : 2});
                    expect(pageNums).toEqual([2, 3]);
                });
            });
        });
    });

    describe("getPrevPageNumsToDisplay()", function () {

        beforeEach(function () {
            this.pageNumSelector = new EpubReflowable.ReflowablePageNumberLogic();

            // Rationale: This function will make these sets of repetitive tests clearer - as in, the conditions of the 
            //   EPUB, the page to navigate to, and the expected result.
            this.testPrevPage = function (params) {

                var selectedPageNums = this.pageNumSelector.getPrevPageNumsToDisplay(
                    params.prevPageNum, 
                    params.firstPageOffset // first page offset
                    );

                return selectedPageNums;
            };
        });

        describe("LTR", function () {

            it("go to p in [p-1, p]", function () {

                var pageNums = this.testPrevPage({firstPageOffset : false, prevPageNum : 2});
                expect(pageNums).toEqual([1, 2]);
            });

            it("go to p in [p-1, p]; offset", function () {

                var pageNums = this.testPrevPage({firstPageOffset : true, prevPageNum : 3});
                expect(pageNums).toEqual([2, 3]);
            });
        });

        describe("RTL", function () {

            it("go to p in [p, p-1]", function () {

                var pageNums = this.testPrevPage({firstPageOffset : false, prevPageNum : 2});
                expect(pageNums).toEqual([1, 2]);
            });

            it("go to p in [p, p-1]; offset", function () {

                var pageNums = this.testPrevPage({firstPageOffset : true, prevPageNum : 3});
                expect(pageNums).toEqual([2, 3]);
            });
        });
    });

    describe("getNextPageNumsToDisplay()", function () {

        beforeEach(function () {
            this.pageNumSelector = new EpubReflowable.ReflowablePageNumberLogic();

            // Rationale: This function will make these sets of repetitive tests clearer - as in, the conditions of the 
            //   EPUB, the page to navigate to, and the expected result.
            this.testNextPage = function (params) {

                var selectedPageNums = this.pageNumSelector.getNextPageNumsToDisplay(
                    params.prevPageNum, 
                    params.firstPageOffset // first page offset
                    );

                return selectedPageNums;
            };
        });

        describe("LTR", function () {

            it("go to p in [p, p+1]", function () {

                var pageNums = this.testNextPage({firstPageOffset : false, prevPageNum : 3});
                expect(pageNums).toEqual([3, 4]);
            });

            it("go to p in [p, p+1]; offset", function () {

                var pageNums = this.testNextPage({firstPageOffset : true, prevPageNum : 2});
                expect(pageNums).toEqual([2, 3]);
            });
        });

        describe("RTL", function () {

            it("go to p in [p+1, p]", function () {

                var pageNums = this.testNextPage({firstPageOffset : false, prevPageNum : 3});
                expect(pageNums).toEqual([3, 4]);
            });

            it("go to p in [p+1, p]; offset", function () {

                var pageNums = this.testNextPage({firstPageOffset : true, prevPageNum : 2});
                expect(pageNums).toEqual([2, 3]);
            });
        });
    });

    describe("getPageNumsForTwoUp()", function () {

        beforeEach(function () {
            this.pageNumSelector = new EpubReflowable.ReflowablePageNumberLogic();

            // Rationale: This function will make these sets of repetitive tests clearer - as in, the conditions of the 
            //   EPUB, the page to navigate to, and the expected result.
            this.testGotoPageNums = function (params) {

                var selectedPageNums = this.pageNumSelector.getPageNumbersForTwoUp(
                    params.twoUp, 
                    params.current_pages, // the pages currently displayed 
                    params.firstPageOffset // first page is offset
                    );

                return selectedPageNums;
            };
        });

        describe("2 pages up", function () {

            describe("LTR", function () {

                it("gets 1 page number", function () {

                    var pageNums = this.testGotoPageNums({twoUp : true, firstPageOffset : false, current_pages : [1, 2]});
                    expect(pageNums).toEqual([1]);
                });

                it("gets 1 page number at page num boundary", function () {

                    var pageNums = this.testGotoPageNums({twoUp : true, firstPageOffset : false, current_pages : [0, 1]});
                    expect(pageNums).toEqual([1]);
                });
            });

            describe("RTL", function () {

                it("gets 1 page number", function () {

                    var pageNums = this.testGotoPageNums({twoUp : true, firstPageOffset : false, current_pages : [1, 2]});
                    expect(pageNums).toEqual([1]);
                });

                it("gets 1 page number at page num boundary", function () {

                    var pageNums = this.testGotoPageNums({twoUp : true, firstPageOffset : false, current_pages : [0, 1]});
                    expect(pageNums).toEqual([1]);
                });
            });
        });

        describe("1 page up", function () {

            it("gets 2 page numbers; odd page", function () {

                var pageNums = this.testGotoPageNums({twoUp : false, firstPageOffset : false, current_pages : [1]});
                expect(pageNums).toEqual([1, 2]);
            });

            it("gets 2 page numbers; odd page, offset", function () {

                var pageNums = this.testGotoPageNums({twoUp : false, firstPageOffset : true, current_pages : [3]});
                expect(pageNums).toEqual([2, 3]);
            });

            it("gets 2 page numbers; even page", function () {

                var pageNums = this.testGotoPageNums({twoUp : false, firstPageOffset : false, current_pages : [2]});
                expect(pageNums).toEqual([1, 2]);
            });

            it("gets 2 page numbers; even page, offset", function () {

                var pageNums = this.testGotoPageNums({twoUp : false, firstPageOffset : true, current_pages : [2]});
                expect(pageNums).toEqual([2, 3]);
            });
        });
    });
});