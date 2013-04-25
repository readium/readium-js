var initializationTest = function () {
    
    var spineItem = {
        contentDocumentURI : "epub_content/accessible_epub_3/EPUB/ch01.xhtml",
        title : "Test from Accessible Epub 3.0", 
        firstPageIsOffset : false,
        pageProgressionDirection : "ltr", 
        spineIndex : 1,
        isFixedLayout : false
    };

    var packageDoc = "<package></package>";

    var viewerSettings = {
        fontSize : 12,
        syntheticLayout : false,
        currentMargin : 3,
        tocVisible : false,
        currentTheme : "default",
        twoUp : true
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

    this.view = new EpubReflowableModule(
        spineItem,
        viewerSettings,
        contentDocumentCFIs,
        bindings
    );

    var testCallback = function () { 
        // alert('pwe pew content document loaded event fires'); 
        };

    this.view.on("contentDocumentLoaded", testCallback, this);

    $("#reader").html(this.view.render(false, undefined));
};