// Description: This model is responsible determining page numbers to display for fixed layout EPUBs.
// Rationale: This model exists to abstract and encapsulate the logic for determining which pages numbers should be
//   dispalyed in the viewer. The logic for this is reasonably complex, as there a number of different factors that must be
//   taken into account in various cases. These include: The page progression direction, 
//   the reading order of pages, the number of pages displayed on the screen, and author preferences 
//   for the location of pages (left/right/center). 
define(['require', 'module', 'jquery', 'underscore', 'backbone'], function (require, module, $, _, Backbone) {

    var PageNumberDisplayLogic = Backbone.Model.extend({

        // ------------------------------------------------------------------------------------ //
        //  "PUBLIC" METHODS (THE API)                                                          //
        // ------------------------------------------------------------------------------------ //

        initialize: function () {
        },

        // Description: This method determines the page numbers to display, given a single page number to "go to"
        // Arguments (
        //   gotoPageNumber (integer): The page number to "go to"
        //   twoUp (boolean): Are two pages currently displayed in the reader?
        //   pageProgressionDirection ("rtl" or "ltr): The page progression direction
        //	)
        getPageNumbers: function (gotoPageNumber, twoUp, pageProgressionDirection) {

            if (twoUp) {

                if (pageProgressionDirection === "rtl") {

                    if (this.pageIsLeft(gotoPageNumber)) {

                        if (this.pageIsRight(gotoPageNumber - 1)) {
                            return [gotoPageNumber - 1, gotoPageNumber];
                        } else {
                            return [gotoPageNumber];
                        }
                    } else if (this.pageIsRight(gotoPageNumber)) {

                        if (this.pageIsLeft(gotoPageNumber + 1)) {
                            return [gotoPageNumber, gotoPageNumber + 1];
                        } else {
                            return [gotoPageNumber];
                        }
                    }
                    // A center page
                    else {
                        return [gotoPageNumber];
                    }
                }
                // Left-to-right page progression
                else {

                    if (this.pageIsLeft(gotoPageNumber)) {

                        if (this.pageIsRight(gotoPageNumber + 1)) {
                            return [gotoPageNumber, gotoPageNumber + 1];
                        } else {
                            return [gotoPageNumber];
                        }
                    } else if (this.pageIsRight(gotoPageNumber)) {

                        if (this.pageIsLeft(gotoPageNumber - 1)) {
                            return [gotoPageNumber - 1, gotoPageNumber];
                        } else {
                            return [gotoPageNumber];
                        }
                    }
                    // A center page
                    else {
                        return [gotoPageNumber];
                    }
                }
            } else {
                return [gotoPageNumber];
            }
        },

        // Description: Get the pages numbers to display when moving in reverse reading order
        // Arguments (
        //   currentPages (array of integers): An array of page numbers that are currently displayed
        //   twoUp (boolean): Are two pages currently displayed in the reader?
        //   pageProgressionDirection ("rtl" or "ltr): The page progression direction
        //	)
        getPreviousPageNumbers: function (currentPages, twoUp, pageProgressionDirection) {

            var curr_pg = currentPages;
            var lastPage = curr_pg[0] - 1;

            // Single page navigation
            if (!twoUp) {
                return [lastPage];
            } else if (pageProgressionDirection === "rtl") {

                // If the first page is a left page in rtl progression, only one page
                // can be displayed, even in two-up mode
                if (this.pageIsLeft(lastPage) && this.pageIsRight(lastPage - 1)) {

                    return [lastPage - 1, lastPage];
                } else {

                    return [lastPage];
                }
            }
            // Left-to-right progresion
            else {

                if (this.pageIsRight(lastPage) && this.pageIsLeft(lastPage - 1)) {

                    return [lastPage - 1, lastPage];
                } else {

                    return [lastPage];
                }
            }
        },

        // Description: Get the pages to display when moving in reading order
        // Arguments (
        //   currentPages (array of integers): An array of page numbers that are currently displayed
        //   twoUp (boolean): Are two pages currently displayed in the reader?
        //   pageProgressionDirection ("rtl" or "ltr): The page progression direction
        //	)
        getNextPageNumbers: function (currentPages, twoUp, pageProgressionDirection) {

            var curr_pg = currentPages;
            var firstPage = curr_pg[curr_pg.length - 1] + 1;

            if (!twoUp) {
                return [firstPage];
            } else if (pageProgressionDirection === "rtl") {

                // If the first page is a left page in rtl progression, only one page
                // can be displayed, even in two-up mode
                if (this.pageIsRight(firstPage) && this.pageIsLeft(firstPage + 1)) {

                    return [firstPage, firstPage + 1];
                } else {

                    return [firstPage];
                }
            } else {

                if (this.pageIsLeft(firstPage) && this.pageIsRight(firstPage + 1)) {

                    return [firstPage, firstPage + 1];
                } else {

                    return [firstPage];
                }
            }
        },

        // Description: This method determines which page numbers to display when switching
        //   between a single page and side-by-side page views and vice versa.
        // Arguments (
        //   currentPages (array of integers): An array of page numbers that are currently displayed
        //   twoUp (boolean): Are two pages currently displayed in the reader?
        //   pageProgressionDirection ("rtl" or "ltr): The page progression direction
        //	)
        // Notes: Authors can specify a fixed layout page as a "center" page, which prevents more than one page
        //   being displayed. This case is not handled yet.
        getPageNumbersForTwoUp: function (currentPages, twoUp, pageProgressionDirection) {

            var displayed = currentPages;
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
            // A single fixed layout page is displayed
            else {

                // page progression is right-to-left
                if (pageProgressionDirection === "rtl") {

                    // and the previous one is right, then display both, otherwise, just display one
                    if (this.pageIsLeft(displayed[0])) {

                        if (this.pageIsRight(displayed[0] - 1)) {

                            newPages[0] = displayed[0] - 1;
                            newPages[1] = displayed[0];
                        } else {

                            newPages[0] = displayed[0];
                        }
                    }
                    // if the next page is left, display both, otherwise, just display one
                    else if (this.pageIsRight(displayed[0])) {

                        if (this.pageIsLeft(displayed[0] + 1)) {

                            newPages[0] = displayed[0];
                            newPages[1] = displayed[0] + 1;
                        } else {

                            newPages[0] = displayed[0];
                        }
                    }
                    // It is a center page
                    else {

                        newPages[0] = displayed[0];
                    }
                }
                // page progression is left-to-right
                else {

                    // If next page is a right page, display both, otherwise just display this one
                    if (this.pageIsLeft(displayed[0])) {

                        if (this.pageIsRight(displayed[0] + 1)) {

                            newPages[0] = displayed[0];
                            newPages[1] = displayed[0] + 1;
                        } else {

                            newPages[0] = displayed[0];
                        }
                    } else if (this.pageIsRight(displayed[0])) {

                        if (this.pageIsLeft(displayed[0] - 1)) {

                            newPages[0] = displayed[0] - 1;
                            newPages[1] = displayed[0];
                        } else {

                            newPages[0] = displayed[0];
                        }
                    }
                    // It is a center page
                    else {

                        newPages[0] = displayed[0];
                    }
                }
            }

            return newPages;
        },

        // ------------------------------------------------------------------------------------ //
        //  "PRIVATE" HELPERS                                                                   //
        // ------------------------------------------------------------------------------------ //

        // Description: The `displayedPageIs...` methods determine if a fixed layout page is right, left or center.
        pageIsRight: function (pageNumber) {

            var pageIndex = pageNumber - 1;
            var spineObject = this.get("spineObjects")[pageIndex];
            if (spineObject !== undefined && spineObject.pageSpread === "right") {
                return true;
            } else {
                return false;
            }
        },

        pageIsLeft: function (pageNumber) {

            var pageIndex = pageNumber - 1;
            var spineObject = this.get("spineObjects")[pageIndex];
            if (spineObject !== undefined && spineObject.pageSpread === "left") {
                return true;
            } else {
                return false;
            }
        },

        pageIsCenter: function (pageNumber) {

            var pageIndex = pageNumber - 1;
            var spineObject = this.get("spineObjects")[pageIndex];
            if (spineObject !== undefined && spineObject.pageSpread === "center") {
                return true;
            } else {
                return false;
            }
        }
    });
    return PageNumberDisplayLogic;
});