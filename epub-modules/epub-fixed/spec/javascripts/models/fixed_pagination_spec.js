describe("Readium.Models.FixedPagination", function () {

    describe("Fixed layout pagination", function () { 

        beforeEach(function () {            
            this.pages = new EpubFixed.FixedPagination();
        });

        describe('toggling synthetic spread', function () {

            describe("left-to-right page progression", function () {

                beforeEach(function () {

                    spyOn(this.pages.pageNumberDisplayLogic, "displayedPageIsRight").andCallFake(
                        function (pageNum) { return pageNum % 2 === 0 ? true : false; } 
                    );
                    spyOn(this.pages.pageNumberDisplayLogic, "displayedPageIsLeft").andCallFake(
                        function (pageNum) { return pageNum % 2 === 0 ? false : true; } 
                    );
                });

                it('1 page -> 2 pages', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [2]
                    });

                    this.pages.toggleTwoUp(false, "ltr");

                    expect(this.pages.get('current_page')).toEqual([1, 2]);
                });

                it('2 pages -> 1 page', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [1, 2]
                    });

                    this.pages.toggleTwoUp(true, "ltr");

                    expect(this.pages.get('current_page')).toEqual([1]);
                });
            });

            describe("right-to-left page progression", function () {

                beforeEach(function () {
                    spyOn(this.pages.pageNumberDisplayLogic, "displayedPageIsRight").andCallFake(
                        function (pageNum) { return pageNum % 2 === 0 ? false : true; } 
                    );
                    spyOn(this.pages.pageNumberDisplayLogic, "displayedPageIsLeft").andCallFake(
                        function (pageNum) { return pageNum % 2 === 0 ? true : false; } 
                    );
                });

                it('1 page -> 2 pages', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [2]
                    });

                    this.pages.toggleTwoUp(false, "rtl");

                    expect(this.pages.get('current_page')).toEqual([1, 2]);
                });

                it('2 pages -> 1 page', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [1, 2]
                    });

                    this.pages.toggleTwoUp(true, "rtl");

                    expect(this.pages.get('current_page')).toEqual([1]);
                });
            });
        });

        describe('1 page navigation', function () {
        
            describe("left-to-right page progression", function () {

                it('increments the page number if there are more pages', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [2]
                    });

                    this.pages.goRight(false, "ltr");
                    expect(this.pages.get("current_page")).toEqual([3]);
                });

                it('does nothing if there are no more pages', function () {

                    this.pages.set({
                        num_pages: 2,
                        current_page: [2]
                    });

                    this.pages.goRight(false, "ltr");
                    expect(this.pages.get("current_page")).toEqual([2]);
                });

                it('decrements the page number if there are more pages', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [2]
                    });

                    this.pages.goLeft(false, "ltr");
                    expect(this.pages.get("current_page")).toEqual([1]);
                });

                it('does nothing from page one', function () {
                    
                    this.pages.set({
                        num_pages: 2,
                        current_page: [1]
                    });

                    this.pages.goLeft(false, "ltr");
                    expect(this.pages.get("current_page")).toEqual([1]);
                });
            });

            describe("right-to-left page progression", function () {

                it('decrements the page number if there are more pages', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [2]
                    });

                    this.pages.goRight(false, "rtl");
                    expect(this.pages.get("current_page")).toEqual([1]);
                });

                it('does nothing if there are no more pages', function () {

                    this.pages.set({
                        num_pages: 2,
                        current_page: [1]
                    });

                    this.pages.goRight(false, "rtl");
                    expect(this.pages.get("current_page")).toEqual([1]);
                });

                it('increments the page number if there are more pages', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [2]
                    });

                    this.pages.goLeft(false, "rtl");
                    expect(this.pages.get("current_page")).toEqual([3]);
                });

                it('does nothing from last page', function () {

                    this.pages.set({
                        num_pages: 2,
                        current_page: [2]
                    });                    

                    this.pages.goLeft(false, "rtl");
                    expect(this.pages.get("current_page")).toEqual([2]);
                });
            });
        });

        describe('2 page navigation', function () {

            describe("left-to-right page progression", function () {

                beforeEach(function () {

                    // A simple case for the ltr test: An odd page will be determined as a left page, while 
                    //   an even page will be a right page
                    spyOn(this.pages.pageNumberDisplayLogic, "displayedPageIsRight").andCallFake(
                        function (pageNum) { return pageNum % 2 === 0 ? true : false; } 
                    );
                    spyOn(this.pages.pageNumberDisplayLogic, "displayedPageIsLeft").andCallFake(
                        function (pageNum) { return pageNum % 2 === 0 ? false : true; } 
                    );
                });

                it('increments the page number if there are more pages', function () {
                    
                    this.pages.set({
                        num_pages: 10,
                        current_page: [3, 4]
                    });

                    this.pages.goRight(true, "ltr");
                    expect(this.pages.get("current_page")).toEqual([5, 6]);
                });

                it('does nothing if there are no more pages', function () {

                    this.pages.set({
                        num_pages: 4,
                        current_page: [3, 4]
                    });

                    this.pages.goRight(true, "ltr");
                    expect(this.pages.get("current_page")).toEqual([3, 4]);
                });

                it('decrements the page number if there are more pages', function () {
                    
                    this.pages.set({
                        num_pages: 10,
                        current_page: [3, 4]
                    });

                    this.pages.goLeft(true, "ltr");
                    expect(this.pages.get("current_page")).toEqual([1, 2]);
                });

                it('does nothing from page one', function () {
                    
                    this.pages.set({
                        num_pages: 10,
                        current_page: [1, 2]
                    });

                    this.pages.goLeft(true, "ltr");
                    expect(this.pages.get("current_page")).toEqual([1, 2]);
                });
            });

            describe("right-to-left page progression", function () {

                beforeEach(function () {

                    // A simple case for the rtl test: An odd page will be determined as a right page, while 
                    //   an even page will be a left page
                    spyOn(this.pages.pageNumberDisplayLogic, "displayedPageIsRight").andCallFake(
                        function (pageNum) { return pageNum % 2 === 0 ? false : true; } 
                    );
                    spyOn(this.pages.pageNumberDisplayLogic, "displayedPageIsLeft").andCallFake(
                        function (pageNum) { return pageNum % 2 === 0 ? true : false; } 
                    );
                });

                it('decrements the page number if there are more pages', function () {
                    
                    this.pages.set({
                        num_pages: 10,
                        current_page: [1, 2]
                    });

                    this.pages.goRight(true, "rtl");
                    expect(this.pages.get("current_page")).toEqual([1, 2]);
                });

                it('does nothing if there are no more pages', function () {
                    
                    this.pages.set({
                        num_pages: 2,
                        current_page: [1, 2]
                    });

                    this.pages.goRight(true, "rtl");
                    expect(this.pages.get("current_page")).toEqual([1, 2]);
                });

                it('increments the page number if there are more pages', function () {

                    this.pages.set({
                        num_pages: 10,
                        current_page: [1, 2]
                    });

                    this.pages.goLeft(true, "rtl");
                    expect(this.pages.get("current_page")).toEqual([3, 4]);
                });

                it('does nothing from last page', function () {
                    
                    this.pages.set({
                        num_pages: 2,
                        current_page: [1, 2]
                    });

                    this.pages.goLeft(true, "rtl");
                    expect(this.pages.get("current_page")).toEqual([1, 2]);
                });
            });
        });
    });
});
