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
		jquery: 'epub-modules/epub-renderer/src/readium-shared-js/lib/jquery',
        underscore: 'lib/underscore-1.4.4',
        eventEmitter: 'lib/eventemitter3',
        jquerySizes: 'epub-modules/epub-renderer/src/readium-shared-js/lib/jquery.sizes',

        epubCfi: 'epub-modules/epub-renderer/src/readium-shared-js/lib/epub_cfi',
        domReady : 'lib/domReady',
        cryptoJs: 'lib/2.5.3-crypto-sha1',
        
        rangy : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy',
        "rangy-core" : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy-core',
        "rangy-textrange" : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy-textrange',
        "rangy-highlighter" : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy-highlighter',
        "rangy-cssclassapplier" : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy-cssclassapplier',
        "rangy-position" : 'epub-modules/epub-renderer/src/readium-shared-js/lib/rangy/rangy-position',
        
        Readium: 'epub-modules/Readium',
        Bootstrapper: 'epub-modules/Bootstrapper'
    },

    packages: [

        {
            name: 'epub-fetch',
            location: 'epub-modules/epub-fetch/src/models',
            main: 'publication_fetcher'
        },

        {
            name: 'readium-plugins',
            location: 'epub-modules/epub-renderer/src/readium-shared-js/plugins',
            main: '_loader'
        },

        {
            name: 'epub-model',
            location: 'epub-modules/epub/src/models'
        },
        {
            name: 'epub-renderer',
            location: 'epub-modules/epub-renderer/src/readium-shared-js/js'
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

        epubCFI: {
            deps: ['jquery'],
            exports: ['epubCFI']
        },

        jquerySizes: {
            deps: ['jquery'],
            exports: 'jquerySizes'
        },

    },

    exclude: ['jquery', 'underscore', 'URIjs']
};
