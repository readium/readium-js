({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        readiumSDK: "readiumSDK",
        helpers: "helpers",
        triggers: "triggers",
        bookmarkData: "bookmarkData",
        spineItem: "spineItem",
        spine: "spine",
        fixedPageSpread: "fixedPageSpread",
        package: "package",
        viewerSettings: "viewerSettings",
        currentPagesInfo: "currentPagesInfo",
        pageOpenRequest: "openPageRequest",
        epubCfi: "epubCfi",
        cfiNavigationLogic: "cfiNavigationLogic",
        reflowableView: "reflowableView",
        onePageView: "onePageView",
        fixedView: "fixedView",
        readerView: "readerView"
    },
    paths: {
        jquery: 'lib/jquery-1.9.1',
        underscore: 'lib/underscore-1.4.4',
        backbone: 'lib/backbone-0.9.10',
        URIjs: 'lib/URIjs',
        readiumSDK: 'epub-renderer/js/readium_sdk',
        helpers: 'epub-renderer/js/helpers',
        triggers: 'epub-renderer/js/models/trigger',
        bookmarkData: 'epub-renderer/js/models/bookmark_data',
        spineItem: 'epub-renderer/js/models/spine_item',
        spine: 'epub-renderer/js/models/spine',
        fixedPageSpread: 'epub-renderer/js/models/fixed_page_spread',
        package: 'epub-renderer/js/models/package',
        viewerSettings: 'epub-renderer/js/models/viewer_settings',
        currentPagesInfo: 'epub-renderer/js/models/current_pages_info',
        pageOpenRequest: 'epub-renderer/js/models/page_open_request',
        epubCfi: 'epub-renderer/lib/epub_cfi',
        cfiNavigationLogic: 'epub-renderer/js/views/cfi_navigation_logic',
        reflowableView: 'epub-renderer/js/views/reflowable_view',
        onePageView: 'epub-renderer/js/views/one_page_view',
        fixedView: 'epub-renderer/js/views/fixed_view',
        readerView: 'epub-renderer/js/views/reader_view'
    },
    exclude: ['jquery', 'underscore', 'backbone', 'URIjs/URI'],
    wrap : {
        startFile : "start.frag",
        endFile : "end.frag"
    }
})
