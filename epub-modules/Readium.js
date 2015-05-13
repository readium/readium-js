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


define(['require', 'text!version.json', 'console_shim', 'jquery', 'underscore', 'readerView', 'epub-fetch', 'epub-model/package_document_parser', 'epub-fetch/iframe_zip_loader', 'URIjs', 'cryptoJs'],
    function (require, versionText, console_shim, $, _, readerView, PublicationFetcher, PackageParser, IframeZipLoader, URI, cryptoJs) {

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

        var _options = { mathJaxUrl: readerOptions.mathJaxUrl };

        var _contentDocumentTextPreprocessor = function(src, contentDocumentHtml) {

            function injectedScript() {

                navigator.epubReadingSystem = window.parent.navigator.epubReadingSystem;
                window.parent = window.self;
                window.top = window.self;
            }

            var sourceParts = src.split("/");
            sourceParts.pop(); //remove source file name

            var base = "<base href=\"" + sourceParts.join("/") + "/" + "\"/>";

            var scripts = "<script type=\"text/javascript\">(" + injectedScript.toString() + ")()<\/script>";
            
            if (_options && _options.mathJaxUrl && contentDocumentHtml.indexOf("<math") >= 0) {
                scripts += "<script type=\"text/javascript\" src=\"" + _options.mathJaxUrl + "\"><\/script>";
            }

            return contentDocumentHtml.replace(/(<head.*?>)/, "$1" + base + scripts);
        };
        
        var self = this;

        var _currentPublicationFetcher;

        var jsLibRoot = readiumOptions.jsLibRoot;

        if (!readiumOptions.useSimpleLoader){
            readerOptions.iframeLoader = new IframeZipLoader(ReadiumSDK, function() { return _currentPublicationFetcher; }, _contentDocumentTextPreprocessor);
        }
        else{
            readerOptions.iframeLoader = new ReadiumSDK.Views.IFrameLoader();
        }
        
        // Chrome extension and cross-browser cloud reader build configuration uses this scaling method across the board (no browser sniffing for Chrome)
        // See https://github.com/readium/readium-js-viewer/issues/313#issuecomment-101578284
        // true means: apply CSS scale transform to the root HTML element of spine item documents (fixed layout / pre-paginated)
        // and to any spine items in scroll view (both continuous and document modes). Scroll view layout includes reflowable spine items, but the zoom level is 1x so there is no impact.
        readerOptions.needsFixedLayoutScalerWorkAround = true;
        
        this.reader = new ReadiumSDK.Views.ReaderView(readerOptions);

        this.openPackageDocument = function(bookRoot, callback, openPageRequest)  {
            if (_currentPublicationFetcher) {
                _currentPublicationFetcher.flushCache();
            }

            var cacheSizeEvictThreshold = null;
            if (readiumOptions.cacheSizeEvictThreshold) {
                cacheSizeEvictThreshold = readiumOptions.cacheSizeEvictThreshold;
            }

            _currentPublicationFetcher = new PublicationFetcher(bookRoot, jsLibRoot, window, cacheSizeEvictThreshold, _contentDocumentTextPreprocessor);

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
        };

        this.closePackageDocument = function() {
            if (_currentPublicationFetcher) {
                _currentPublicationFetcher.flushCache();
            }
        };


        //we need global access to the reader object for automation test being able to call it's APIs
        ReadiumSDK.reader = this.reader;

        ReadiumSDK.trigger(ReadiumSDK.Events.READER_INITIALIZED, this.reader);
    };
    
    Readium.version = JSON.parse(versionText);

    return Readium;

});
