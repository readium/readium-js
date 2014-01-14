
var requirejs = {

    paths: {

        jquery: 'lib/jquery-1.9.1',
        underscore: 'lib/underscore-1.4.4',
        backbone: 'lib/backbone-0.9.10',
        bootstrap: 'lib/bootstrap.min',
        jquery_hammer: 'lib/jquery.hammer',
        hammer: 'lib/hammer',
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
        annotations_module: 'epub-modules/epub-renderer/src/readium-shared-js/lib/annotations_module',
        annotationsManager: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/annotations_manager',
        mediaOvelayDataInjector: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/media_overlay_data_injector',
        internalLinksSupport: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/internal_links_support',
        iframeLoader: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/iframe_loader',

        Readium: 'epub-modules/Readium'
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
            name: 'epub-ui',
            location: 'epub-modules/epub-ui/src/models'
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
            deps:['readiumSDK', 'style'],
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

        mediaOvelayDataInjector: {
          deps: ['readiumSDK', 'mediaOverlay', 'mediaOverlayPlayer', 'smilModel', 'spineItem'],
          exports: 'mediaOvelayDataInjector'
        },

        internalLinksSupport: {
            deps:['readiumSDK'],
            exports: 'internalLinksSupport'
        },

        iframeLoader: {
            deps:['readiumSDK'],
            exports: 'iframeLoader'
        },

        readerView : {
            deps: [ 'backbone','readiumSDK', 'helpers', 'viewerSettings', 'styleCollection', 'package',
                'mediaOverlayPlayer', 'pageOpenRequest', 'fixedView', 'reflowableView', 'mediaOvelayDataInjector',
                'internalLinksSupport', 'iframeLoader', 'annotationsManager'],
            exports:'readerView'
        },

        annotations_module: {
            deps: ['epubCfi'],
            exports:'annotations_module'
        },

        annotationsManager: {
            deps: ['epubCfi', 'annotations_module'],
            exports:'annotationsManager'
        },





    },

    exclude: ['jquery', 'underscore', 'backbone', 'URIjs']
};
