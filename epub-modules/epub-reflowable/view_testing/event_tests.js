var bindEventTests = function (reflowablePageSet) {

    reflowablePageSet.on("atNextPage", function () {
        console.log("atNextPage triggered");
    });

    reflowablePageSet.on("atPreviousPage", function () {
        console.log("atPrevious triggered");
    });

    reflowablePageSet.on("layoutChanged", function (isSynthetic) {
        console.log("layoutChanged triggered:" + isSynthetic);
    });

    reflowablePageSet.on("atFirstPage", function () {
        console.log("atFirstPage triggered");
    });

    reflowablePageSet.on("atLastPage", function () {
        console.log("atLastPage triggered");
    });

    reflowablePageSet.on("displayedContentChanged", function () {
        console.log("displayedContentChanged triggered");
    });
};