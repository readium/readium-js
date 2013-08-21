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
        jquery: '../../lib/jquery-1.9.1',
        underscore: '../../lib/underscore-1.4.4',
        backbone: '../../lib/backbone-0.9.10',
        URIjs: '../../lib/URIjs',
        epubCfi: 'readium-shared-js/lib/epub_cfi',
        readiumSDK: 'readium-shared-js/js/readium_sdk',
        helpers: 'readium-shared-js/js/helpers',
        triggers: 'readium-shared-js/js/models/trigger',
        bookmarkData: 'readium-shared-js/js/models/bookmark_data',
        spineItem: 'readium-shared-js/js/models/spine_item',
        spine: 'readium-shared-js/js/models/spine',
        fixedPageSpread: 'readium-shared-js/js/models/fixed_page_spread',
        package: 'readium-shared-js/js/models/package',
        viewerSettings: 'readium-shared-js/js/models/viewer_settings',
        currentPagesInfo: 'readium-shared-js/js/models/current_pages_info',
        pageOpenRequest: 'readium-shared-js/js/models/page_open_request',
        cfiNavigationLogic: 'readium-shared-js/js/views/cfi_navigation_logic',
        reflowableView: 'readium-shared-js/js/views/reflowable_view',
        onePageView: 'readium-shared-js/js/views/one_page_view',
        fixedView: 'readium-shared-js/js/views/fixed_view',
        readerView: 'readium-shared-js/js/views/reader_view'
    },
    exclude: ['jquery', 'underscore', 'backbone', 'URIjs/URI'],
    wrap : {
        startFile : "start.frag",
        endFile : "end.frag"
    }
})
