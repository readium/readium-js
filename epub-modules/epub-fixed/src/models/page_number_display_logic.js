// Description: This model is responsible determining page numbers to display for both reflowable and fixed layout pubs.
// Rationale: This model exists to abstract and encapsulate the logic for determining which pages numbers should be
//   dispalyed in the viewer. The logic for this is reasonably complex, as there a number of different factors that must be
//   taken into account in various cases. These include: The type of the pub (reflowable or fixed layout), the page progression direction, 
//   the reading order of pages, the number of pages displayed on the screen and author preferences 
//   for the location of pages (left/right/centre). 

Readium.Models.PageNumberDisplayLogic = Backbone.Model.extend({

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize: function () {},

    // Description: This method determines the page numbers to display, given a single page number to "go to"
    // Arguments (
    //   gotoPageNumber (integer): The page number to "go to"
    //   twoUp (boolean): Are two pages currently displayed in the reader?
    //   isFixedLayout (boolean): Are the current set of pages fixed layout pages? 
    //   pageProgDirection ("rtl" or "ltr): The page progression direction
    //	)
	// REFACTORING CANDIDATE: This might be better named as getPageNumsToDisplay; the "goto" is confusing; also some
	//   deep nesting here that could be refactored for clarity.
	getGotoPageNumsToDisplay: function(gotoPageNumber, twoUp, isFixedLayout, pageProgDirection, firstPageOffset) {

		if (twoUp) {
			
			// Fixed layout page
			if (isFixedLayout) {

				if (pageProgDirection === "rtl") {

					if (this.displayedPageIsLeft(gotoPageNumber)) {

						if (this.displayedPageIsRight(gotoPageNumber - 1)) {
							return [gotoPageNumber - 1, gotoPageNumber];
						}
						else {
							return [gotoPageNumber];
						}
					}
					else if (this.displayedPageIsRight(gotoPageNumber)) {

						if (this.displayedPageIsLeft(gotoPageNumber + 1)) {
							return [gotoPageNumber, gotoPageNumber + 1];	
						}
						else {
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

					if (this.displayedPageIsLeft(gotoPageNumber)) {

						if (this.displayedPageIsRight(gotoPageNumber + 1)) {
							return [gotoPageNumber, gotoPageNumber + 1];
						}
						else {
							return [gotoPageNumber];
						}
					}
					else if (this.displayedPageIsRight(gotoPageNumber)) {

						if (this.displayedPageIsLeft(gotoPageNumber - 1)) {
							return [gotoPageNumber - 1, gotoPageNumber];
						}
						else {
							return [gotoPageNumber];
						}
					}
					// A center page
					else {
						return [gotoPageNumber];
					}
				}
			}
			// This is a reflowable page
			else {

				if (firstPageOffset) {

					if (gotoPageNumber % 2 === 1) {
						return [gotoPageNumber - 1, gotoPageNumber];
					}
					else {
						return [gotoPageNumber, gotoPageNumber + 1];
					}
				}
				else {
					// in reflowable format, we want this config always:
					// ODD_PAGE |spine| EVEN_PAGE
					if (gotoPageNumber % 2 === 1) {
						return [gotoPageNumber, gotoPageNumber + 1];	
					} 
					else {
						return [gotoPageNumber - 1, gotoPageNumber];
					}
				}	
			}
		}
		else {	
			return [gotoPageNumber];
		}
	},

    // Description: Get the pages numbers to display when moving in reverse reading order
    // Arguments (
    //   prevPageNumberToDisplay (integer): The page to move to; this page must be one of the displayed pages
    //   isFixedLayout (boolean): Are the current set of pages fixed layout pages? 
    //   pageProgDirection ("rtl" or "ltr): The page progression direction    	
    //	)
	getPrevPageNumsToDisplay: function (prevPageNumberToDisplay, isFixedLayout, pageProgDirection) {

		// If fixed layout
		if (isFixedLayout) {

			if (pageProgDirection === "rtl") {

				// If the first page is a left page in rtl progression, only one page 
				// can be displayed, even in two-up mode
				if (this.displayedPageIsLeft(prevPageNumberToDisplay) && 
					this.displayedPageIsRight(prevPageNumberToDisplay - 1)) {

					return [prevPageNumberToDisplay - 1, prevPageNumberToDisplay];
				}
				else {

					return [prevPageNumberToDisplay];
				}
			}
			// Left-to-right progresion
			else {

				if (this.displayedPageIsRight(prevPageNumberToDisplay) &&
					this.displayedPageIsLeft(prevPageNumberToDisplay - 1)) {

					return [prevPageNumberToDisplay - 1, prevPageNumberToDisplay];
				}
				else {

					return [prevPageNumberToDisplay];
				}
			}
		}
		// A reflowable text
		else {

			return [prevPageNumberToDisplay - 1, prevPageNumberToDisplay];
		}
	},

	// Description: Get the pages to display when moving in reading order
    // Arguments (
    //   nextPageNumberToDisplay (integer): The page to move to; this page must be one of the displayed pages
    //   isFixedLayout (boolean): Are the current set of pages fixed layout pages? 
    //   pageProgDirection ("rtl" or "ltr): The page progression direction    	
    //	)
	getNextPageNumsToDisplay: function (nextPageNumberToDisplay, isFixedLayout, pageProgDirection) {

		// If fixed layout
		if (isFixedLayout) {

			if (pageProgDirection === "rtl") {

				// If the first page is a left page in rtl progression, only one page 
				// can be displayed, even in two-up mode
				if (this.displayedPageIsRight(nextPageNumberToDisplay) &&
					this.displayedPageIsLeft(nextPageNumberToDisplay + 1)) {

					return [nextPageNumberToDisplay, nextPageNumberToDisplay + 1];
				}
				else {

					return [nextPageNumberToDisplay];
				}
			}
			else {

				if (this.displayedPageIsLeft(nextPageNumberToDisplay) && 
					this.displayedPageIsRight(nextPageNumberToDisplay + 1)) {

					return [nextPageNumberToDisplay, nextPageNumberToDisplay + 1];
				}
				else {

					return [nextPageNumberToDisplay];
				}
			}
		}
		// Reflowable section
		else {

			return [nextPageNumberToDisplay, nextPageNumberToDisplay + 1];
		}
	},

	// Description: This method determines which page numbers to display when switching
	//   between a single page and side-by-side page views and vice versa.
	// Arguments (
	//   twoUp (boolean): Are two pages currently displayed in the reader?
	//   displayedPageNumbers (array of integers): An array of page numbers that are currently displayed	
	//   isFixedLayout (boolean): Are the current set of pages fixed layout pages? 
	//   pageProgDirection ("rtl" or "ltr): The page progression direction
	//	)
	// Notes: Authors can specify a fixed layout page as a "center" page, which prevents more than one page
	//   being displayed. This case is not handled yet.
	getPageNumbersForTwoUp: function(twoUp, displayedPageNumbers, pageProgDirection, isFixedLayout, firstPageOffset) {

		var displayed = displayedPageNumbers;
		var twoPagesDisplayed = displayed.length === 2 ? true : false;
		var newPages = [];

		// Two pages are currently displayed; find the single page number to display
		if (twoPagesDisplayed) {

			// Rationale: I think this check is a bit of a hack, for the case in which a set of pages is [0, 1]. Pages are
			//   1-indexed, so the "0" in the 0 index position of the array is not valid.
			if (displayed[0] === 0) {
				
				newPages[0] = 1;
			} 
			else {
				
				newPages[0] = displayed[0];
			}
		}
		// A single reflowable page is currently displayed; find two pages to display
		else if (!isFixedLayout) {

			if (firstPageOffset) {

				if (displayed[0] % 2 === 1) {
					
					newPages[0] = displayed[0] - 1;
					newPages[1] = displayed[0];
				}
				else {
					
					newPages[0] = displayed[0];
					newPages[1] = displayed[0] + 1;
				}				
			}
			else {

				if (displayed[0] % 2 === 1) {
					
					newPages[0] = displayed[0];
					newPages[1] = displayed[0] + 1;
				}
				else {
					
					newPages[0] = displayed[0] - 1;
					newPages[1] = displayed[0];
				}
			}
		}
		// A single fixed layout page is displayed
		else {

			// page progression is right-to-left
			if (pageProgDirection === "rtl") {

				// and the previous one is right, then display both, otherwise, just display one
				if (this.displayedPageIsLeft(displayed[0])) {
					
					if (this.displayedPageIsRight(displayed[0] - 1)) {

						newPages[0] = displayed[0] - 1;
						newPages[1] = displayed[0];
					}
					else {

						newPages[0] = displayed[0];
					}
				}
				// if the next page is left, display both, otherwise, just display one
				else if (this.displayedPageIsRight(displayed[0])) {
					
					if (this.displayedPageIsLeft(displayed[0] + 1)) {
						
						newPages[0] = displayed[0];
						newPages[1] = displayed[0] + 1;
					}
					else {

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
				if (this.displayedPageIsLeft(displayed[0])) {
					
					if (this.displayedPageIsRight(displayed[0] + 1)) {
						
						newPages[0] = displayed[0];
						newPages[1] = displayed[0] + 1;
					}
					else {

						newPages[0] = displayed[0];
					}
				}
				else if (this.displayedPageIsRight(displayed[0])) {
					
					if (this.displayedPageIsLeft(displayed[0] - 1)) {
						
						newPages[0] = displayed[0] - 1;
						newPages[1] = displayed[0];
					}
					else {

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
	//
	// Rationale: This is not an ideal approach, as we're pulling properties directly out of the dom, rather than
	//   out of our models. The rationale is that as of Readium 0.4.1, the page-spread-* value
	//   is not maintained in the model hierarchy accessible from an ebook object. An alternative
	//   would be to infer the left/right/center value from model attributes on ebook, or other objects in
	//   ebook's object hierarchy. However, this would duplicate the logic that exists elsewhere for determining right/left/center
	//   for a page, which is probably worse than pulling out of the dom. This approach also avoids having to convert
	//   from the page number (based on what is rendered on the screen) to spine index. 
	displayedPageIsRight: function (displayedPageNum) {

		return $("#page-" + displayedPageNum).hasClass("right_page") ? true : false;
	},

	displayedPageIsLeft: function (displayedPageNum) {

		return $("#page-" + displayedPageNum).hasClass("left_page") ? true : false;
	},

	displayedPageIsCenter: function (displayedPageNum) {

		return $("#page-" + displayedPageNum).hasClass("center_page") ? true : false;
	}
});