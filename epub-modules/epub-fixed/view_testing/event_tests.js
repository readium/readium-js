var bindEventTests = function (fixedPageSet) {

    fixedPageSet.on("atNextPage", function () {
        console.log("atNextPage triggered");
    });

    fixedPageSet.on("atPreviousPage", function () {
        console.log("atPreviousPage triggered");
    });

    fixedPageSet.on("layoutChanged", function (isSynthetic) {
        console.log("layoutChanged triggered:" + isSynthetic);
    });

    fixedPageSet.on("atFirstPage", function () {
        console.log("atFirstPage triggered");
    });

    fixedPageSet.on("atLastPage", function () {
        console.log("atLastPage triggered");
    });

    fixedPageSet.on("displayedContentChanged", function () {
        console.log("displayedContentChanged triggered");
    });
};