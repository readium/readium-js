// REFACTORING CANDIDATE: You can infer whether the layout is one or two pages based on the length of the 
//   the current_page array. However, the possibility exists that this could become out of sync with the
//   viewer settings (this state would be maintained in two places). Perhaps better still that the paramater
//   is passed to the public methods? 

EpubReflowable.ReflowablePagination = Backbone.Model.extend({ 

    defaults: {
        "num_pages" : 0,
        "current_page" : [1]
    },

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    initialize: function () {

        // Instantiate an object responsible for deciding which pages to display
        this.pageNumberDisplayLogic = new EpubReflowable.ReflowablePageNumberLogic();
        
        // if content reflows and the number of pages in the section changes
        // we need to adjust the the current page
        // Probably a memory leak here, should add a destructor
        this.on("change:num_pages", this.adjustCurrentPage, this);
    },

    // Description: This method determines which page numbers to display when switching
    //   between a single page and side-by-side page views and vice versa.
    toggleTwoUp: function (twoUp, firstPageIsOffset) {

        // if (this.epubController.epub.get("can_two_up")) {

            var newPages = this.pageNumberDisplayLogic.getPageNumbersForTwoUp (
                twoUp, 
                this.get("current_page"),
                firstPageIsOffset
                );

            if (!twoUp) {
                newPages = this.adjustForMaxPageNumber(newPages);
            }

            this.set({current_page: newPages});
        // }   
    },

    // REFACTORING CANDIDATE: prevPage and nextPage are public but not sure it should be; it's called from the navwidget and viewer.js.
    //   Additionally the logic in this method, as well as that in nextPage(), could be refactored to more clearly represent that 
    //   multiple different cases involved in switching pages.
    prevPage: function(twoUp) {

        var previousPage = this.get("current_page")[0] - 1;

        // Single page navigation
        if (!twoUp){

            this.set("current_page", [previousPage]);
        }
        // Move to previous page with two side-by-side pages
        else {

            var pagesToDisplay = this.pageNumberDisplayLogic.getPrevPageNumsToDisplay(
                                previousPage
                                );
            this.set("current_page", pagesToDisplay);
        }
    },

    nextPage: function(twoUp) {

        var curr_pg = this.get("current_page");
        var firstPage = curr_pg[curr_pg.length - 1] + 1;

        // Single page is up
        if (!twoUp) {

            this.set("current_page", [firstPage]);
        }
        // Two pages are being displayed
        else {

            var pagesToDisplay = this.pageNumberDisplayLogic.getNextPageNumsToDisplay(
                                firstPage
                                );
            this.set("current_page", pagesToDisplay);
        }
    },

    goToPage: function(gotoPageNumber, twoUp, firstPageIsOffset) {

        var pagesToGoto = this.pageNumberDisplayLogic.getGotoPageNumsToDisplay(
                            gotoPageNumber,
                            twoUp,
                            firstPageIsOffset
                            );
        this.set("current_page", pagesToGoto);
    },

    // Description: Return true if the pageNum argument is a currently visible 
    //   page. Return false if it is not; which will occur if it cannot be found in 
    //   the array.
    isPageVisible: function(pageNum) {
        return this.get("current_page").indexOf(pageNum) !== -1;
    },

    // ------------------------------------------------------------------------------------ //  
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //

    adjustForMaxPageNumber : function (newPageNumbers) {

        var currentPages = this.get("current_page");
        var numberOfPages = this.get("num_pages");

        if (newPageNumbers[0] > numberOfPages) {
            return [numberOfPages];
        }
        else {
            return newPageNumbers;
        }
    }
});