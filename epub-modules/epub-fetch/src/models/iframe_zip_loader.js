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

define(['URIjs'], function(URI){

    var zipIframeLoader = function(ReadiumSDK, getCurrentResourceFetcher, options) {

        var basicIframeLoader = new ReadiumSDK.Views.IFrameLoader(options);

        this.addIFrameEventListener = function(eventName, callback, context) {
            basicIframeLoader.addIFrameEventListener(eventName, callback, context);
        };

        this.updateIframeEvents = function (iframe) {
            basicIframeLoader.updateIframeEvents(iframe);
        };
        
        this.loadIframe = function(iframe, src, callback, caller, attachedData) {

            var loadedDocumentUri = new URI(src).absoluteTo(iframe.baseURI).search('').hash('').toString();

            var shouldConstructDomProgrammatically = getCurrentResourceFetcher().shouldConstructDomProgrammatically();
            if (shouldConstructDomProgrammatically) {

                    getCurrentResourceFetcher().fetchContentDocument(attachedData, loadedDocumentUri,
                        function (resolvedContentDocumentDom) {
                            basicIframeLoader._loadIframeWithDocument(iframe,
                                attachedData,
                                resolvedContentDocumentDom.documentElement.outerHTML,
                                function () {
                                    callback.call(caller, true, attachedData);
                                });
                        }, function (err) {
                            callback.call(caller, false, attachedData);
                        }
                    );
            } else {
                basicIframeLoader.loadIframe(iframe, src, callback, caller, attachedData);
            }
        };
    };

    return zipIframeLoader;
});
