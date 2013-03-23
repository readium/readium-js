describe("EpubReflowable.ReflowablePaginationView", function () {

    describe("initialization", function () {

        beforeEach(function () {

            var spineItem = {
                contentDocumentUri : "",
                title : "an epub", 
                firstPageIsOffset : false,
                pageProgressionDirection : "ltr", 
                spineIndex : 1 
            };

            var viewerSettings = {
                fontSize : 3,
                syntheticLayout : false,
                currentMargin : 3,
                tocVisible : false,
                currentTheme : "default"
            };

            var contentDocumentCFIs = [
                {
                    cfi : "/2/2/2:1",
                    payload : "payload 1",
                    callback : undefined,
                    callbackContext : undefined
                },
                {
                    cfi : "/3/2/3:2",
                    payload : "payload 2",
                    callback : undefined,
                    callbackContext : undefined 
                },
                {
                    cfi : "/4/2/2:1",
                    payload : "payload 3",
                    callback : undefined,
                    callbackContext : undefined
                }
            ];

            var bindings = [{
                    handler : "figure-gallery-impl",
                    media_type : "application/xhtml+xml"
                }
            ];

            this.view = new EpubReflowable.ReflowablePaginationView({
                spineItem : spineItem,
                viewerSettings : viewerSettings,
                contentDocumentCFIs : contentDocumentCFIs,
                bindings : bindings
            });
        });

        it("can be initialized", function () {

            debugger;

        });
    });
});