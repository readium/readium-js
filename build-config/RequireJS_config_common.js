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
    //xhtml: true, //document.createElementNS()
    
    /* http://requirejs.org/docs/api.html#config-waitSeconds */
    waitSeconds: 0,
    
    baseUrl: "../epub-modules",
    
    removeCombined: true,
    
    //findNestedDependencies: true,
            
    wrap: false,
    
    inlineText: true,
    stubModules: [], //['text'],
    
    bundles: {
        'readium-external-libs': [ 'jquery', 'underscore', 'backbone', 'URIjs', 'punycode', 'SecondLevelDomains', 'IPv6', 'jquerySizes', 'domReady', 'eventEmitter', 'console_shim', 'rangy', 'rangy-core', 'rangy-textrange', 'rangy-highlighter', 'rangy-cssclassapplier', 'rangy-position' ],
        'readium-shared-js': ['views/reader_view']
    },
    
    paths:
    {
        "readium-js": 'Readium',
        
        'readium-external-libs': "../build-output/readium-shared-js/build-output/_multiple-bundles/readium-external-libs",
        
        'readium-shared-js': "../build-output/readium-shared-js/build-output/_multiple-bundles/readium-shared-js",
        
        'readium-plugin-annotations': "../build-output/readium-shared-js/build-output/_multiple-bundles/readium-plugin-annotations",
        'readium-plugin-example': "../build-output/readium-shared-js/build-output/_multiple-bundles/readium-plugin-example",
        
        // ------ NPM MODULEs
        
        zip: '../node_modules/zip-js/WebContent/zip',
        'zip-fs': '../node_modules/zip-js/WebContent/zip-fs',
        'zip-ext': '../node_modules/zip-js/WebContent/zip-ext',
        deflate: '../node_modules/zip-js/WebContent/deflate',
        inflate: '../node_modules/zip-js/WebContent/inflate',
        'z-worker': '../node_modules/zip-js/WebContent/z-worker',
        
        sha1: '../node_modules/crypto-js/sha1',
        
        text: '../node_modules/requirejs-text/text'
    },
    
    map: {
        '*': {
            'epub-renderer/views': 'views'
        }
    },
    
    packages: [

        {
            name: 'epub-fetch',
            location: 'epub-modules/epub-fetch/src/models',
            main: 'publication_fetcher'
        },

        {
            name: 'epub-model',
            location: 'epub-modules/epub/src/models',
            main: 'package_document_parser'
        }
    ],
    
    wrapShim: false,

    shim:
    {
        zip : {
            exports: 'zip'
        },
        'zip-fs' : {
            deps: ['zip'],
            exports: 'zip-fs'
        },
        'zip-ext' : {
            deps: ['zip-fs'],
            exports: 'zip-ext'
        },
    }
});