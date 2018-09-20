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

    baseUrl: process._RJS_baseUrl(1),

    packages: [

        {
            name: 'readium_js',
            location:
                process._RJS_rootDir(1) + '/js',

            main: 'Readium'
        },

        // {
        //     name: 'epub_fetch',
        //     location:
        //         process._RJS_rootDir(1) + '/js/epub-fetch',
        //
        //     main: 'publication_fetcher'
        // },
        //
        // {
        //     name: 'epub_model',
        //     location:
        //         process._RJS_rootDir(1) + '/js/epub-model',
        //
        //     main: 'package_document_parser'
        // },

        {
            name: 'cryptoJs',
            location:
                process._RJS_rootDir(1) + '/node_modules/crypto-js',

            main: 'core'
        }
    ],

    paths:
    {
        // ------ NPM MODULEs

        text:
            process._RJS_rootDir(1) + '/node_modules/requirejs-text/text',

        zip:
            process._RJS_rootDir(1) + '/node_modules/zip-js/WebContent/zip',

        'mime-types':
            process._RJS_rootDir(1) + '/node_modules/zip-js/WebContent/mime-types',

        'zip-fs':
            process._RJS_rootDir(1) + '/node_modules/zip-js/WebContent/zip-fs',

        'zip-ext':
            process._RJS_rootDir(1) + '/node_modules/zip-js/WebContent/zip-ext',

        'inflate':
            process._RJS_rootDir(1) + '/node_modules/zip-js/WebContent/inflate',

        'deflate':
            process._RJS_rootDir(1) + '/node_modules/zip-js/WebContent/deflate',

        'z-worker':
            process._RJS_rootDir(1) + '/node_modules/zip-js/WebContent/z-worker',

        'bowser':
            process._RJS_rootDir(1) + '/node_modules/bowser/bowser'
    },


    shim:
    {
        zip : {
            exports: 'zip'
        },
        'mime-types' : {
            deps: ['zip'],
            exports: 'zip'
        },
        'zip-fs' : {
            deps: ['mime-types'],
            exports: 'zip'
        },
        'zip-ext' : {
            deps: ['zip-fs'],
            exports: 'zip'
        },
        'inflate' : {
            exports: 'zip'
        },
        'deflate' : {
            exports: 'zip'
        },
        'bowser' : {
            exports: 'bowser'
        }
    }
});
