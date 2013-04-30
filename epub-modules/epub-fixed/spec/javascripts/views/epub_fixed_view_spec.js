describe("EpubFixed.FixedPaginationView", function () {

    describe("initialization", function () {
        beforeEach(function () {

            var spineItems = [{
                contentDocumentUri : "",
                title : "an epub", 
                firstPageIsOffset : false,
                pageProgressionDirection : "ltr", 
                spineIndex : 1 
            },
                contentDocumentUri : "",
                title : "an epub", 
                firstPageIsOffset : false,
                pageProgressionDirection : "ltr", 
                spineIndex : 1 
            },
                contentDocumentUri : "",
                title : "an epub", 
                firstPageIsOffset : false,
                pageProgressionDirection : "ltr", 
                spineIndex : 1 
            }];

            var viewerSettings = {
                fontSize : 3,
                syntheticLayout : false,
                currentMargin : 3,
                tocVisible : false,
                currentTheme : "default"
            };

            this.view = new EpubReflowable.FixedPaginationView({
                spineItems : spineItems,
                viewerSettings : viewerSettings
            });
        });
    });
});