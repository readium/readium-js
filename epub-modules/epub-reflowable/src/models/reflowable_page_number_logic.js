// Description: This model is responsible determining page numbers to display for reflowable EPUBs.
// Rationale: This model exists to abstract and encapsulate the logic for determining which pages numbers should be
//   dispalyed in the viewer.
define(['require', 'module', 'jquery', 'underscore', 'backbone'], function (require, module, $, _, Backbone) {

    var ReflowablePageNumberLogic = Backbone.Model.extend({

        // ------------------------------------------------------------------------------------ //
        //  "PUBLIC" METHODS (THE API)                                                          //
        // ------------------------------------------------------------------------------------ //

        initialize: function () {
        },

        // Description: This method determines the page numbers to display, given a single page number to "go to"
        // Arguments (
        //   gotoPageNumber (integer): The page number to "go to"
        //   twoUp (boolean): Are two pages currently displayed in the reader?
        //  )
        getPageNumbers: function (gotoPageNumber, twoUp, firstPageOffset) {

            if (twoUp) {

                if (firstPageOffset) {

                    // EVEN_PAGE |spine| ODD_PAGE
                    if (gotoPageNumber % 2 === 1) {
                        return [gotoPageNumber - 1, gotoPageNumber];
                    } else {
                        return [gotoPageNumber, gotoPageNumber + 1];
                    }
                } else {
                    // ODD_PAGE |spine| EVEN_PAGE
                    if (gotoPageNumber % 2 === 1) {
                        return [gotoPageNumber, gotoPageNumber + 1];
                    } else {
                        return [gotoPageNumber - 1, gotoPageNumber];
                    }
                }
            } else {
                return [gotoPageNumber];
            }
        },

        // Description: Get the pages numbers to display when moving in reverse reading order
        // Arguments (
        //  )
        getPreviousPageNumbers: function (currentPages, twoUp) {

            var previousVisiblePageNumber = currentPages[0] - 1;

            if (!twoUp) {

                return [previousVisiblePageNumber];
            } else {

                return [previousVisiblePageNumber - 1, previousVisiblePageNumber];
            }
        },

        // Description: Get the pages to display when moving in reading order
        // Arguments (
        //  )
        getNextPageNumbers: function (currentPages, twoUp) {

            // Rationale: The length will be 1 or 2.
            var highestVisiblePageNumber = currentPages[currentPages.length - 1];
            var firstVisiblePageNumber = highestVisiblePageNumber + 1;

            if (!twoUp) {

                return [firstVisiblePageNumber];
            } else {

                return [firstVisiblePageNumber, firstVisiblePageNumber + 1];
            }
        },

        // Description: This method determines which page numbers to display when switching
        //   between a single page and side-by-side page views and vice versa.
        // Arguments (
        //   displayedPageNumbers (array of integers): An array of page numbers that are currently displayed
        //   firstPageOffset: Is the first page of a reflowable EPUB offset, to create a blank page for the first page?
        //  )
        getToggledLayoutPageNumbers: function (displayedPageNumbers, firstPageOffset) {

            var displayed = displayedPageNumbers;
            var twoPagesDisplayed = displayed.length === 2 ? true : false;
            var newPages = [];

            // Two pages are currently displayed; find the single page number to display
            if (twoPagesDisplayed) {

                // Rationale: I think this check is a bit of a hack, for the case in which a set of pages is [0, 1]. Pages are
                //   1-indexed, so the "0" in the 0 index position of the array is not valid.
                if (displayed[0] === 0) {
                    newPages[0] = 1;
                } else {
                    newPages[0] = displayed[0];
                }
            }
            // A single reflowable page is currently displayed; find two pages to display
            else if (firstPageOffset) {

                if (displayed[0] % 2 === 1) {

                    newPages[0] = displayed[0] - 1;
                    newPages[1] = displayed[0];
                } else {

                    newPages[0] = displayed[0];
                    newPages[1] = displayed[0] + 1;
                }
            } else {

                if (displayed[0] % 2 === 1) {

                    newPages[0] = displayed[0];
                    newPages[1] = displayed[0] + 1;
                } else {

                    newPages[0] = displayed[0] - 1;
                    newPages[1] = displayed[0];
                }
            }

            return newPages;
        },

        // ------------------------------------------------------------------------------------ //
        //  "PRIVATE" HELPERS                                                                   //
        // ------------------------------------------------------------------------------------ //
    });
    return ReflowablePageNumberLogic;
});