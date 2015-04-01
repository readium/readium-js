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
    
    baseUrl: process._readium.baseUrl__readium_js_,
    
    stubModules: ['text'],
    
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

    name: "readium-js_all",
    
    out: "../build-output/_single-bundle/readium-js_all.js",
    
    paths:
    {
        'version':
            process._readium.path__readium_js + "/build-config/" + process._readium.baseUrl__readium_js + "/"
            + '../build-output/version'
    },
    
    include: [
        "readium-js"
    ],
    
    packages: [

        {
            name: 'epub-fetch',
            location: "../" +
            process._readium.path__readium_js + "/build-config/" + process._readium.baseUrl__readium_js + "/"
            + 'epub-fetch',
            
            main: 'publication_fetcher'
        },

        {
            name: 'epub-model',
            location: "../" +
            process._readium.path__readium_js + "/build-config/" + process._readium.baseUrl__readium_js + "/"
            + 'epub-model',
            
            main: 'package_document_parser'
        },

        {
            name: 'cryptoJs',
            location: "../" +
            process._readium.path__readium_js + "/build-config/" + process._readium.baseUrl__readium_js + "/"
            + '../node_modules/crypto-js',
            
            main: 'core'
        }
    ]
});