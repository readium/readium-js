
var requirejs = {

    baseUrl: '.',

    paths: {

        jquery: 'lib/jquery-1.9.1',
        underscore: 'lib/underscore-1.4.4',
        backbone: 'lib/backbone-0.9.10',
        bootstrap: 'lib/bootstrap.min',

//        URIjs: 'lib/URIjs/URI',
//        punycode: 'lib/URIjs/punycode',
//        SecondLevelDomains: 'lib/URIjs/SecondLevelDomains',
//        IPv6: 'lib/URIjs/IPv6',

        epub_ers: 'epub-modules/epub-ers/src',
        iframe_load_interceptor: 'epub-modules/epub-renderer/src/iframe_load_interceptor',

        jquerySizes: 'epub-modules/epub-renderer/src/readium-shared-js/lib/jquery.sizes',
        readiumSDK: 'epub-modules/epub-renderer/src/readium-shared-js/js/readium_sdk',
        helpers: 'epub-modules/epub-renderer/src/readium-shared-js/js/helpers',
        style: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/style',
        styleCollection: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/style_collection',
        triggers: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/trigger',
        smilModel: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/smil_model',
        mediaOverlay: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/media_overlay',
        viewerSettings: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/viewer_settings',
        bookmarkData: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/bookmark_data',
        spineItem: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/spine_item',
        spine: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/spine',
        fixedPageSpread: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/fixed_page_spread',
        package: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/package',
        currentPagesInfo: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/current_pages_info',
        pageOpenRequest: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/page_open_request',
        smilIterator: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/smil_iterator',
        epubCfi: 'epub-modules/epub-renderer/src/readium-shared-js/lib/epub_cfi',
        cfiNavigationLogic: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/cfi_navigation_logic',
        reflowableView: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/reflowable_view',
        onePageView: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/one_page_view',
        fixedView: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/fixed_view',
        readerView: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/reader_view',
        mediaOverlayElementHighlighter: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/media_overlay_element_highlighter',
        audioPlayer: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/audio_player',
        mediaOverlayPlayer: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/media_overlay_player',

    },

    packages: [
        {
            name: 'epub-fetch',
            location: 'epub-modules/epub-fetch/src/models',
            main: 'resource_fetcher'
        },

        {
            name: 'emub-model',
            location: 'epub-modules/epub/src/models'
        },

        {
            name: 'URIjs',
            location: 'lib/URIjs',
            main: 'URI'
        }
    ],


    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        bootstrap: {
            deps: ['jquery'],
            exports: 'bootstrap'
        },

        helpers: {
            deps: ['readiumSDK', 'jquerySizes'],
            exports: 'helpers'
        },

        readiumSDK: {
            deps: ['backbone'],
            exports:'readiumSDK'
        },

        viewerSettings: {
            deps: ['readiumSDK'],
            exports: 'viewerSettings'
        },

        styleCollection: {
            deps:['readiumSDK'],
            exports: 'styleCollection'
        },

        spineItem: {
            deps:['readiumSDK'],
            exports:'spineItem'
        },

        spine: {
            deps:['readiumSDK', 'spineItem'],
            exports: 'spine'
        },

        smilModel: {
            deps: ['readiumSDK'],
            exports: 'smilModel'
        },

        mediaOverlayPlayer: {
            deps:['readiumSDK', 'mediaOverlay', 'audioPlayer', 'mediaOverlayElementHighlighter'],
            exports:'mediaOverlayPlayer'
        },

        mediaOverlay: {
            deps:['readiumSDK', 'smilModel'],
            exports: 'mediaOverlay'
        },

        package: {
            deps:['readiumSDK', 'spine', 'mediaOverlay'],
            exports:'package'
        },

        audioPlayer: {
            deps:['readiumSDK'],
            exports: 'audioPlayer'
        },

        mediaOverlayElementHighlighter: {
            deps:['readiumSDK'],
            exports: 'mediaOverlayElementHighlighter'
        },

        pageOpenRequest: {
            deps:['readiumSDK'],
            exports: 'pageOpenRequest'
        },

        onePageView: {
            deps:['readiumSDK', 'cfiNavigationLogic'],
            exports:'onePageView'
        },


        cfiNavigationLogic: {
            deps: ['readiumSDK', 'epubCfi'],
            exports:'cfiNavigationLogic'
        },

        epubCFI: {
            deps: ['jquery'],
            exports: ['epubCFI']
        },

        jquerySizes: {
            deps: ['jquery'],
            exports: 'jquerySizes'
        },

        style: {
            deps: ['readiumSDK'],
            exports: 'style'
        },

        triggers: {
            deps: ['readiumSDK'],
            exports: 'triggers'
        },

        bookmarkData: {
            deps: ['readiumSDK'],
            exports: 'bookmarkData'
        },

        fixedPageSpread: {
            deps: ['readiumSDK'],
            exports: 'fixedPageSpread'
        },

        currentPagesInfo: {
            deps: ['readiumSDK'],
            exports: 'currentPagesInfo'
        },

        smilIterator: {
            deps: ['readiumSDK'],
            exports: 'smilIterator'
        },

        reflowableView: {
            deps: ['readiumSDK', 'cfiNavigationLogic', 'bookmarkData'],
            exports: 'reflowableView'
        },

        fixedView: {
            deps: ['readiumSDK', 'onePageView', 'currentPagesInfo', 'fixedPageSpread', 'bookmarkData'],
            exports: 'fixedView'
        },

        readerView : {
            deps: [ 'backbone','readiumSDK', 'helpers', 'viewerSettings', 'styleCollection', 'package',
                'mediaOverlayPlayer', 'pageOpenRequest', 'fixedView', 'reflowableView'],
            exports:'readerView'
        }

    },

    exclude: ['jquery', 'underscore', 'backbone', 'URIjs']

//});
}