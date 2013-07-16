define(['require', 'module', 'jquery', 'underscore', 'backbone', './reflowable_page_number_logic'],
    function (require, module, $, _, Backbone, ReflowablePageNumberLogic) {

        var ReflowablePagination = Backbone.Model.extend({

            defaults: {
                "numberOfPages": 0,
                "currentPages": [1]
            },

            // ------------------------------------------------------------------------------------ //
            //  "PUBLIC" METHODS (THE API)                                                          //
            // ------------------------------------------------------------------------------------ //

            initialize: function () {

                // Instantiate an object responsible for deciding which pages to display
                this.pageNumberDisplayLogic = new ReflowablePageNumberLogic();

                // Rationale: Need to adjust the page number to the last page if, when the number of pages changes, the current
                //   page is greater than the number of changes.
                // Probably a memory leak here, should add a destructor
                this.on("change:numberOfPages", this.adjustCurrentPage, this);
            },

            onFirstPage: function () {

                // Rationale: Need to check for both single and synthetic page spread
                var oneOfCurrentPagesIsFirstPage = this.get("currentPages")[0] === 1 ? true :
                    this.get("currentPages")[1] === 1 ? true : false;

                if (oneOfCurrentPagesIsFirstPage) {
                    return true;
                } else {
                    return false;
                }
            },

            onLastPage: function () {

                // Rationale: Need to check for both single and synthetic page spread
                var oneOfCurrentPagesIsLastPage = this.get("currentPages")[0] === this.get("numberOfPages") ? true :
                    this.get("currentPages")[1] === this.get("numberOfPages") ? true : false;

                if (oneOfCurrentPagesIsLastPage) {
                    return true;
                } else {
                    return false;
                }
            },

            toggleTwoUp: function (twoUp, firstPageIsOffset) {

                // if (this.epubController.epub.get("can_two_up")) {

                var layoutPageNumbers = this.pageNumberDisplayLogic.getToggledLayoutPageNumbers(this.get("currentPages"),
                    firstPageIsOffset);
                if (!twoUp) {
                    layoutPageNumbers = this.adjustForMaxPageNumber(layoutPageNumbers);
                }
                this.set("currentPages", layoutPageNumbers);
                // }
            },

            prevPage: function (twoUp) {

                var previousPageNumbers = this.pageNumberDisplayLogic.getPreviousPageNumbers(this.get("currentPages"),
                    twoUp);
                this.set("currentPages", previousPageNumbers);
            },

            nextPage: function (twoUp) {

                var nextPageNumbers = this.pageNumberDisplayLogic.getNextPageNumbers(this.get("currentPages"), twoUp);
                this.set("currentPages", nextPageNumbers);
            },

            goToPage: function (pageNumber, twoUp, firstPageIsOffset) {

                var gotoPageNumbers = this.pageNumberDisplayLogic.getPageNumbers(pageNumber, twoUp, firstPageIsOffset);
                this.set("currentPages", gotoPageNumbers);
            },

            resetCurrentPages: function () {

                var originalPageNumbers = this.get("currentPages");
                var adjustedPageNumbers = this.adjustForMaxPageNumber(originalPageNumbers);

                if (adjustedPageNumbers !== originalPageNumbers) {
                    this.set("currentPages", adjustedPageNumbers);
                }
            },

            // ------------------------------------------------------------------------------------ //
            //  "PRIVATE" HELPERS                                                                   //
            // ------------------------------------------------------------------------------------ //
            adjustForMaxPageNumber: function (newPageNumbers) {

                var currentPages = this.get("currentPages");
                var numberOfPages = this.get("numberOfPages");

                if (newPageNumbers[0] > numberOfPages) {
                    return [numberOfPages];
                } else {
                    return newPageNumbers;
                }
            }
        });
        return ReflowablePagination;
    });