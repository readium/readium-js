EpubFixed.FixedPagination = Backbone.Model.extend({ 

	defaults: {
		"num_pages" : 0,
		"current_page" : [1]
	},

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	initialize : function () {

		// Instantiate an object responsible for deciding which pages to display
		this.pageNumberDisplayLogic = new EpubFixed.PageNumberDisplayLogic();
	},

	// Description: This method determines which page numbers to display when switching
	//   between a single page and side-by-side page views and vice versa.
	toggleTwoUp : function (twoUp, pageProgressionDirection) {

		// if (this.epubController.epub.get("can_two_up")) {

		var newPages = this.pageNumberDisplayLogic.getPageNumbersForTwoUp(
			twoUp, 
			this.get("current_page"),
			pageProgressionDirection
			);

		this.set({current_page: newPages});
		// }	
	},

	// REFACTORING CANDIDATE: This needs to be investigated, but I bet if the prevPage and nextPage methods were 
	//   called directly (goRight and goLeft were removed), the new page number display logic would account for the 
	//   page progression direction and that all this logic could be simplified in both this model and the 
	//   PageNumberDisplayLogic model
	// 
	// Description: turn pages in the rightward direction
	//   ie progression direction is dependent on 
	//   page progression dir
	goRight : function (twoUp, pageProgressionDirection) {
		if (pageProgressionDirection === "rtl") {
			this.prevPage(twoUp, pageProgressionDirection);
		}
		else {
			this.nextPage(twoUp, pageProgressionDirection);
		}
	},

	// Description: Turn pages in the leftward direction
	//   ie progression direction is dependent on 
	//   page progression dir
	goLeft : function (twoUp, pageProgressionDirection) {
		if (pageProgressionDirection === "rtl") {
			this.nextPage(twoUp, pageProgressionDirection);
		}
		else {
			this.prevPage(twoUp, pageProgressionDirection);
		}
	},

	goToPage: function(gotoPageNumber, twoUp) {

		var pagesToGoto = this.pageNumberDisplayLogic.getGotoPageNumsToDisplay(
							gotoPageNumber,
							twoUp
							);
		this.set("current_page", pagesToGoto);
	},

	// // Description: Return true if the pageNum argument is a currently visible 
	// //   page. Return false if it is not; which will occur if it cannot be found in 
	// //   the array.
	// isPageVisible: function(pageNum) {
	// 	return this.get("current_page").indexOf(pageNum) !== -1;
	// },

	// REFACTORING CANDIDATE: prevPage and nextPage are public but not sure it should be; it's called from the navwidget and viewer.js.
	//   Additionally the logic in this method, as well as that in nextPage(), could be refactored to more clearly represent that 
	//   multiple different cases involved in switching pages.
	prevPage : function (twoUp, pageProgressionDirection) {

		// Validation
		if (this.get("current_page")[0] <= 1) {
			return;
		}

		var curr_pg = this.get("current_page");
		var lastPage = curr_pg[0] - 1;

		// Single page navigation
		if (!twoUp){
			this.set("current_page", [lastPage]);
		}
		// Move to previous page with two side-by-side pages
		else {

			var pagesToDisplay = this.pageNumberDisplayLogic.getPrevPageNumsToDisplay(
								lastPage,
								pageProgressionDirection
								);
			this.set("current_page", pagesToDisplay);
		}
	},

	nextPage : function (twoUp, pageProgressionDirection) {

		// Validation
		if (twoUp) {
			if (this.get("current_page")[1] >= this.get("num_pages")) {
				return;
			}
		}
		else {
			if (this.get("current_page")[0] >= this.get("num_pages")) {
				return;
			}
		}

		var curr_pg = this.get("current_page");
		var firstPage = curr_pg[curr_pg.length - 1] + 1;

		if (!twoUp) {

			this.set("current_page", [firstPage]);
		}
		// Two pages are being displayed
		else {

			var pagesToDisplay = this.pageNumberDisplayLogic.getNextPageNumsToDisplay(
								firstPage,
								pageProgressionDirection
								);
			this.set("current_page", pagesToDisplay);
		}
	},

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //
});