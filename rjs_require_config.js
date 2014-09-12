//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without modification, 
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this 
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice, 
//  this list of conditions and the following disclaimer in the documentation and/or 
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be 
//  used to endorse or promote products derived from this software without specific 
//  prior written permission.


var requirejs = {

    paths: {

        text: 'lib/text/text',
        console_shim: 'lib/console_shim',
        jquery: 'lib/jquery-1.11.0',
        underscore: 'lib/underscore-1.4.4',
        backbone: 'lib/backbone-0.9.10',
        bootstrap: 'lib/bootstrap.min',
        jquerySizes: 'epub-modules/epub-renderer/src/readium-shared-js/lib/jquery.sizes',
        readiumSDK: 'epub-modules/epub-renderer/src/readium-shared-js/js/readium_sdk',
        helpers: 'epub-modules/epub-renderer/src/readium-shared-js/js/helpers',
        style: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/style',
        styleCollection: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/style_collection',
        triggers: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/trigger',
        switches: 'epub-modules/epub-renderer/src/readium-shared-js/js/models/switches',
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
        scrollView: 'epub-modules/epub-renderer/src/readium-shared-js/js/views/scroll_view',
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
        

        domReady : 'lib/domReady',
        
        rangy : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy',
        "rangy-core" : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy-core',
        "rangy-textrange" : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy-textrange',
        "rangy-highlighter" : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy-highlighter',
        "rangy-cssclassapplier" : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy-cssclassapplier',
        "rangy-position" : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy-position',
        
        Readium: 'epub-modules/Readium'
    },

    packages: [

        {
            name: 'epub-fetch',
            location: 'epub-modules/epub-fetch/src/models',
            main: 'publication_fetcher'
        },

        {
            name: 'epub-model',
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

        'rangy-core': {
             deps: ["domReady"],
             exports: "rangy", // global.rangy
             init: function(domReady) {
                 var rangi = this.rangy;
            domReady(function(){
                rangi.init();
            });
            return this.rangy;
        }
       },
       'rangy-textrange': {
         deps: ["rangy-core"],
         exports: "rangy.modules.TextRange"
       },
       'rangy-highlighter': {
         deps: ["rangy-core"],
         exports: "rangy.modules.Highlighter"
       },
       'rangy-cssclassapplier': {
         deps: ["rangy-core"],
         exports: "rangy.modules.ClassApplier"
       },
       'rangy-position': {
         deps: ["rangy-core"],
         exports: "rangy.modules.Position"
       },
        
       /*
       'rangy/rangy-serializer': {
         deps: ["rangy/rangy-core"],
         exports: "rangy.modules.Serializer"
       },
       'rangy/rangy-selectionsaverestore': {
         deps: ["rangy/rangy-core"],
         exports: "rangy.modules.SaveRestore"
       },
       */
       /*
        console_shim: {
            exports: 'console_shim'
        },
       */
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
            deps:['readiumSDK', 'mediaOverlay', 'audioPlayer', 'mediaOverlayElementHighlighter', 'rangy'],
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
            deps:['readiumSDK', 'rangy'],
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

        switches: {
            deps: ['readiumSDK'],
            exports: 'switches'
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

        scrollView: {
            deps: ['readiumSDK', 'cfiNavigationLogic', 'bookmarkData', 'triggers', 'onePageView'],
            exports: 'scrollView'
        },

        fixedView: {
            deps: ['readiumSDK', 'onePageView', 'currentPagesInfo', 'fixedPageSpread', 'bookmarkData'],
            exports: 'fixedView'
        },

        mediaOvelayDataInjector: {
          deps: ['readiumSDK', 'mediaOverlay', 'mediaOverlayPlayer', 'smilModel', 'spineItem', 'smilIterator', 'rangy'],
          exports: 'mediaOvelayDataInjector'
        },

        internalLinksSupport: {
            deps:['readiumSDK', 'URIjs'],
            exports: 'internalLinksSupport'
        },

        iframeLoader: {
            deps:['readiumSDK'],
            exports: 'iframeLoader'
        },

        readerView : {
            deps: [ 'backbone','readiumSDK', 'helpers', 'viewerSettings', 'styleCollection', 'package',
                'mediaOverlayPlayer', 'pageOpenRequest', 'fixedView', 'reflowableView', 'mediaOvelayDataInjector',
                'internalLinksSupport', 'iframeLoader', 'annotationsManager', 'scrollView', 'URIjs', 'triggers', 'switches'],
            exports:'readerView'
        },

        annotations_module: {
            deps: ['epubCfi'],
            exports:'annotations_module'
        },

        annotationsManager: {
            deps: ['epubCfi', 'annotations_module'],
            exports:'annotationsManager'
        }

    },

    exclude: ['jquery', 'underscore', 'backbone', 'URIjs']
};
