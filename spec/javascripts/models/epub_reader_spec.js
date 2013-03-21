describe("EPUB READER", function () {

    // Before each 
    beforeEach(function () {

        // spyOn(this.pages.pageNumberDisplayLogic, "displayedPageIsRight").andCallFake(
        //                 function (pageNum) { return pageNum % 2 === 0 ? true : false; } 
        //             );

        this.reader = Readium.Models.EpubReader(
            { 
                model : book.epub.getPackageDocument().get("res_spine")
            },
            { 
                epubController : undefined, // This can be removed, eventually
                viewerSettings : undefined // We're not actually instantiating views
            });
    });

    describe("initialization", function () {

        // It sets the spine
        it ("sets the spine", function () {
            
            
        });
        // renders spine items
        // goes to the first page view
    });

    describe("page navigation", function () {

        // describe next page

            // it sets current page view
            // it renders the new page view
            // does not exceed the number of page views

        // describe previous page

            // it sets current page view
            // it renders the new page view
            // current page view is not less than 0

    });

});