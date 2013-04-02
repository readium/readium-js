var initializationTest = function () {
    
    var spine = [{
            contentDocumentURI : "epub_content/accessible_epub_3/EPUB/ch01.xhtml",
            title : "Chapter 1", 
            firstPageIsOffset : false,
            pageProgressionDirection : "ltr", 
            spineIndex : 0
        },
        {
            contentDocumentURI : "epub_content/accessible_epub_3/EPUB/ch01s02.xhtml",
            title : "Chapter 2", 
            firstPageIsOffset : false,
            pageProgressionDirection : "ltr", 
            spineIndex : 1 
        },
        {
            contentDocumentURI : "epub_content/accessible_epub_3/EPUB/ch02.xhtml",
            title : "Chapter 3", 
            firstPageIsOffset : false,
            pageProgressionDirection : "ltr", 
            spineIndex : 2 
        },
        {
            contentDocumentURI : "epub_content/accessible_epub_3/EPUB/ch02s02.xhtml",
            title : "Chapter 4", 
            firstPageIsOffset : false,
            pageProgressionDirection : "ltr", 
            spineIndex : 3 
        },
        {
            contentDocumentURI : "epub_content/accessible_epub_3/EPUB/ch02s03.xhtml",
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
        currentTheme : "default"
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

    return new EpubReaderModule(
        $("#reader"),
        epubSpineInfo,
        viewerSettings
    );
};