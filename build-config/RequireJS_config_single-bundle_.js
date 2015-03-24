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


require.config({
    
    optimize: "none",
    generateSourceMaps: true,
    preserveLicenseComments: true,
    
    /*
    optimize: "uglify2",
    generateSourceMaps: true,
    preserveLicenseComments: false,

    // uglify2: {
    //   mangle: true,
    //   except: [
    //         'zzzzz'
    //   ],
    //   output: {
    //     beautify: true,
    //   },
    //   beautify: {
    //     semicolons: false
    //   }
    // },
    */

    name: "readium-js",
    include: [
        // "readium-external-libs",
        // "readium-shared-js",
        // "readium-plugin-example",
        // "readium-plugin-annotations"
        ],
    exclude: [
         "readium-external-libs",
         "readium-shared-js",
         "readium-plugin-example",
         "readium-plugin-annotations"
        ],
    out: "../build-output/_single-bundle/readium-js_all.js",
    
    insertRequire: [],
    
    map: {
        '*': {
            // 'shared-js/views': 'views',
            // 'shared-js/models': 'models',
            // 'shared-js/helpers': 'helpers',
            // 'shared-js/controllers': 'controllers',
            // 'shared-js/epubCfi': 'epubCfi',
            // 'shared-js/globals': 'globals',
            // 'shared-js/globalsSetup': 'globalsSetup',
            
            'version.json': '../build-output/version.json',
            
            'plugins-controller': 'shared-js/controllers/plugins_controller'
        }
    },
    
    
    packages: [

        {
            name: 'epub-fetch',
            location: '../js/epub-fetch',
            main: 'publication_fetcher'
        },

        {
            name: 'epub-model',
            location: '../js/epub-model',
            main: 'package_document_parser'
        },

        {
            name: 'shared-js',
            location: '../readium-shared-js/js',
            main: 'views/reader_view'
        },

        {
            name: 'sha1',
            location: '../node_modules/crypto-js',
            main: 'sha1'
        }
    ],
    
//     bundles: {
//         //'readium-external-libs':
//         "../build-output/readium-shared-js/build-output/_multiple-bundles/readium-external-libs":
//         [
//             'jquery',
//             'underscore',
//             'backbone',
//             'URIjs',
//             'punycode',
//             'SecondLevelDomains',
//             'IPv6',
//              'jquerySizes',
//             'domReady',
//              'eventEmitter',
//              'console_shim',
//              'rangy',
//             'rangy-core',
//             'rangy-textrange',
//             'rangy-highlighter',
//             'rangy-cssclassapplier',
//             'rangy-position'
//         ],
        
//         'readium-shared-js':
//         //"../build-output/readium-shared-js/build-output/_multiple-bundles/readium-shared-js":
//         [
// "epubCfi",
// "globals",
// "globalsSetup",
// "controllers/plugins_controller",
// "models/bookmark_data",
// "models/current_pages_info",
// "models/fixed_page_spread",
// "models/spine_item",
// "helpers",
// "views/cfi_navigation_logic",
// "models/viewer_settings",
// "views/one_page_view",
// "models/page_open_request",
// "views/fixed_view",
// "views/iframe_loader",
// "views/internal_links_support",
// "models/smil_iterator",
// "views/media_overlay_data_injector",
// "views/audio_player",
// "views/media_overlay_element_highlighter",
// "views/scroll_view",
// "views/media_overlay_player",
// "models/spine",
// "models/smil_model",
// "models/media_overlay",
// "models/package_data",
// "models/package",
// "views/reflowable_view",
// "models/style",
// "models/style_collection",
// "models/switches",
// "models/trigger",
//  "views/reader_view"
// ]
//     }
});