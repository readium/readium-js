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


define(['require', 'text!version.json', 'console_shim', 'jquery', 'underscore', 'readerView', 'epub-fetch', 'epub-model/package_document_parser', 'epub-fetch/iframe_zip_loader', 'URIjs'],
    function (require, versionText, console_shim, $, _, readerView, PublicationFetcher, PackageParser, IframeZipLoader, URI) {

    //hack to make URI object global for readers consumption.
    window.URI = URI;

    //polyfill to support Safari 6
    if ('URL' in window === false) {
        if ('webkitURL' in window === false) {
            throw Error('Browser does not support window.URL');
        }

        window.URL = window.webkitURL;
    }

    var Readium = function(readiumOptions, readerOptions){

        var self = this;

        var _currentPublicationFetcher;

        var jsLibRoot = readiumOptions.jsLibRoot;

        if (!readiumOptions.useSimpleLoader){
            readerOptions.iframeLoader = new IframeZipLoader(ReadiumSDK, function() { return _currentPublicationFetcher; }, { mathJaxUrl: readerOptions.mathJaxUrl });;
        }
        else{
            readerOptions.iframeLoader = new ReadiumSDK.Views.IFrameLoader();
        }
        

        this.reader = new ReadiumSDK.Views.ReaderView(readerOptions);

        this.openPackageDocument = function(bookRoot, callback, openPageRequest)  {

            _currentPublicationFetcher = new PublicationFetcher(bookRoot, jsLibRoot);

            _currentPublicationFetcher.initialize(function() {

                var _packageParser = new PackageParser(bookRoot, _currentPublicationFetcher);

                _packageParser.parse(function(packageDocument){
                    var openBookOptions = readiumOptions.openBookOptions || {};
                    var openBookData = $.extend(packageDocument.getSharedJsPackageData(), openBookOptions);

                    if (openPageRequest) {
                        openBookData.openPageRequest = openPageRequest;
                    }
                    self.reader.openBook(openBookData);

                    var options = {
                        packageDocumentUrl : _currentPublicationFetcher.getPackageUrl(),
                        metadata: packageDocument.getMetadata()
                    };

                    if (callback){
                        // gives caller access to document metadata like the table of contents
                        callback(packageDocument, options);
                    }
                });
            });
        }


        //we need global access to the reader object for automation test being able to call it's APIs
        ReadiumSDK.reader = this.reader;

        ReadiumSDK.trigger(ReadiumSDK.Events.READER_INITIALIZED, this.reader);
    };
    
    Readium.version = JSON.parse(versionText);

    return Readium;

});
