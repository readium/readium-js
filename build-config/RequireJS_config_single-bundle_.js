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
    
    // Merges with readium-shared-js build config
    // Paths are relative to readium-shared-js baseUrl
    paths:
    {
        "readium-js": '../../build-config/readium-js',
        "Readium": '../../js/Readium',
        
        // ------ NPM MODULEs
        
        zip: '../../node_modules/zip-js/WebContent/zip',
        'zip-fs': '../../node_modules/zip-js/WebContent/zip-fs',
        'zip-ext': '../../node_modules/zip-js/WebContent/zip-ext',
        
        deflate: '../../node_modules/zip-js/WebContent/deflate',
        inflate: '../../node_modules/zip-js/WebContent/inflate',
        'z-worker': '../../node_modules/zip-js/WebContent/z-worker',
        
        text: '../../node_modules/requirejs-text/text',
        
        'version': '../../build-output/version'
    },
    
    // Merges with readium-shared-js build config
    include: [
        "readium-js"
    ],
    
    // Merges with readium-shared-js build config
    // Paths are relative to readium-shared-js baseUrl (defined in the common config file)
    packages: [

        {
            name: 'epub-fetch',
            location: '../../js/epub-fetch',
            main: 'publication_fetcher'
        },

        {
            name: 'epub-model',
            location: '../../js/epub-model',
            main: 'package_document_parser'
        },

        {
            name: 'cryptoJs',
            location: '../../node_modules/crypto-js',
            main: 'core'
        }
    ]
});