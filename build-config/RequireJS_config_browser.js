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

    /* http://requirejs.org/docs/api.html#config-waitSeconds */
    waitSeconds: 1,

    baseUrl: '..',


    //    map:
    //    {
    //        '*': {
    //            "readium_cfi_js":
    //                '../js'
    //        }
    //    },

    packages: [

        {
            name: 'epub_fetch',
            location:
                readium_js_PATH_PREFIX + 'js/epub-fetch',

            main: 'publication_fetcher'
        },

        {
            name: 'epub_model',
            location:
                readium_js_PATH_PREFIX + 'js/epub-model',

            main: 'package_document_parser'
        },

        {
            name: 'cryptoJs',
            location:
                readium_js_PATH_PREFIX + 'node_modules/crypto-js',

            main: 'core'
        }
    ],

    paths:
    {
        "version":
            readium_js_PATH_PREFIX + 'build-output/version',

        "readium-js":
            readium_js_PATH_PREFIX + 'build-config/readium-js',

        "Readium":
            readium_js_PATH_PREFIX + 'js/Readium',

        // ------ NPM MODULEs

        text:
            readium_js_PATH_PREFIX + 'node_modules/requirejs-text/text',

        zip:
            readium_js_PATH_PREFIX + 'node_modules/zip-js/WebContent/zip',

        'mime-types':
            readium_js_PATH_PREFIX + 'node_modules/zip-js/WebContent/mime-types',

        'zip-fs':
            readium_js_PATH_PREFIX + 'node_modules/zip-js/WebContent/zip-fs',

        'zip-ext':
            readium_js_PATH_PREFIX + 'node_modules/zip-js/WebContent/zip-ext',

        // deflate:
            // readium_js_PATH_PREFIX + 'node_modules/zip-js/WebContent/deflate',

        // inflate:
            // readium_js_PATH_PREFIX + 'node_modules/zip-js/WebContent/inflate',

        // 'z-worker':
            // readium_js_PATH_PREFIX + 'node_modules/zip-js/WebContent/z-worker'
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
        }
    }
});
