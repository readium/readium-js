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
    
    baseUrl: "../js",
    
    removeCombined: true,
    
    //findNestedDependencies: true,
            
    wrap: false,
    
    inlineText: true,
    stubModules: [], //['text'],
    
    paths:
    {
        //"Readium": 'Readium',
        
        "readium-js": '../build-config/readium-js',
        
        'readium-external-libs': "../readium-shared-js/build-output/_multiple-bundles/readium-external-libs",
        
        'readium-shared-js': "../readium-shared-js/build-output/_multiple-bundles/readium-shared-js",
        
        'readium-plugin-annotations': "../readium-shared-js/build-output/_multiple-bundles/readium-plugin-annotations",
        'readium-plugin-example': "../readium-shared-js/build-output/_multiple-bundles/readium-plugin-example",
        
        // ------ NPM MODULEs
        
        zip: '../node_modules/zip-js/WebContent/zip',
        'zip-fs': '../node_modules/zip-js/WebContent/zip-fs',
        'zip-ext': '../node_modules/zip-js/WebContent/zip-ext',
        
        deflate: '../node_modules/zip-js/WebContent/deflate',
        inflate: '../node_modules/zip-js/WebContent/inflate',
        'z-worker': '../node_modules/zip-js/WebContent/z-worker',
        
        text: '../node_modules/requirejs-text/text',
        
        
        
        
        
        
        //'plugins-controller': "../readium-shared-js/js/controllers/plugins_controller",
        
        
        // ------ NPM MODULEs
        
        RequireJS: '../readium-shared-js/node_modules/requirejs/require',
        
        //text: '../node_modules/requirejs-text/text',
        
        jquery: '../readium-shared-js/node_modules/jquery/dist/jquery',
        
        backbone: "../readium-shared-js/node_modules/backbone/backbone",
        
        underscore: '../readium-shared-js/node_modules/underscore/underscore',

        URIjs: '../readium-shared-js/node_modules/URIjs/src/URI',
        punycode: '../readium-shared-js/node_modules/URIjs/src/punycode',
        SecondLevelDomains: '../readium-shared-js/node_modules/URIjs/src/SecondLevelDomains',
        IPv6: '../readium-shared-js/node_modules/URIjs/src/IPv6',
        
        jquerySizes: '../readium-shared-js/node_modules/jquery-sizes/lib/jquery.sizes',

        domReady : '../readium-shared-js/node_modules/domReady/domReady',

        //eventEmitter: '../readium-shared-js/node_modules/eventemitter3/index',
        eventEmitter: '../readium-shared-js/node_modules/eventemitter3/_rjs/index',
        //see pre-build npm task to wrap CommonJS into AMD: define(function(require, exports, module) { .... });

        
        
        // ------ LIBs
        
        'console_shim': '../readium-shared-js/lib/console_shim',
        
        rangy : '../readium-shared-js/lib/rangy/rangy',
        "rangy-core" : '../readium-shared-js/lib/rangy/rangy-core',
        "rangy-textrange" : '../readium-shared-js/lib/rangy/rangy-textrange',
        "rangy-highlighter" : '../readium-shared-js/lib/rangy/rangy-highlighter',
        "rangy-cssclassapplier" : '../readium-shared-js/lib/rangy/rangy-cssclassapplier',
        "rangy-position" : '../readium-shared-js/lib/rangy/rangy-position',
        
        
        // TODO: move to an NPM package dependency (fetched directly from readium-cfi-js repository)
        epubCfi: '../readium-shared-js/lib/epub_cfi'
        
    },
    
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