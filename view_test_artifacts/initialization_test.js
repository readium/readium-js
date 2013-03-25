var initializationTest = function () {
    
    var spine = [{
            contentDocumentUri : "epub_content/accessible_epub_3/EPUB/ch01.xhtml",
            title : "Chapter 1", 
            firstPageIsOffset : false,
            pageProgressionDirection : "ltr", 
            spineIndex : 0
        },
        {
            contentDocumentUri : "epub_content/accessible_epub_3/EPUB/ch02.xhtml",
            title : "Chapter 2", 
            firstPageIsOffset : false,
            pageProgressionDirection : "ltr", 
            spineIndex : 1 
        },
        {
            contentDocumentUri : "epub_content/accessible_epub_3/EPUB/ch03.xhtml",
            title : "Chapter 3", 
            firstPageIsOffset : false,
            pageProgressionDirection : "ltr", 
            spineIndex : 2 
        },
        {
            contentDocumentUri : "epub_content/accessible_epub_3/EPUB/ch04.xhtml",
            title : "Chapter 4", 
            firstPageIsOffset : false,
            pageProgressionDirection : "ltr", 
            spineIndex : 3 
        },
        {
            contentDocumentUri : "epub_content/accessible_epub_3/EPUB/ch05.xhtml",
            title : "Chapter 5", 
            firstPageIsOffset : false,
            pageProgressionDirection : "ltr", 
            spineIndex : 4 
        }
    ];

    var viewerSettings = {
        fontSize : 12,
        syntheticLayout : false,
        currentMargin : 3,
        tocVisible : false,
        currentTheme : "default",
        twoUp : true
    };

    var annotations = [
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

    var epubSpineInfo = {

        spine : spine,
        bindings : bindings, 
        annotations : annotations,
    };

    this.view = new EpubReader(
        epubSpineInfo,
        viewerSettings,
    );

    $("#reader").html(this.view.render(false, undefined));
};