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
        
        text: '../node_modules/requirejs-text/text'
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