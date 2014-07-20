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

    var zipIframeLoader = function(ReadiumSDK, getCurrentResourceFetcher) {

        var emptyDocumentBlob = new Blob(['<html><body></body></html>'], {'type': 'text/html'});

        // Internet Explorer workaround - need to hold on to Blobs so that they aren't GC'd and their object URLs invalidated:
        // Must hold the blob in a hash so that IE doesn't optimize out the unused variable and GC the blob:
        var holderHash = {emptyDocumentBlob: emptyDocumentBlob};

        var basicIframeLoader = new ReadiumSDK.Views.IFrameLoader();

        this.addIFrameEventListener = function(eventName, callback, context) {
            basicIframeLoader.addIFrameEventListener(eventName, callback, context);
        };

        this.loadIframe = function(iframe, src, callback, caller, attachedData) {

            var loadedDocumentUri = new URI(src).absoluteTo(iframe.baseURI).search('').hash('').toString();

            var shouldConstructDomProgrammatically = getCurrentResourceFetcher().shouldConstructDomProgrammatically();
            if (shouldConstructDomProgrammatically) {
                console.log('loading [' + loadedDocumentUri + ']');

                var basicLoadCallback = function (success) {
                    getCurrentResourceFetcher().fetchContentDocument(attachedData, loadedDocumentUri,
                        function(resolvedContentDocumentDom) {

                            var uri = iframe.getAttribute("src");
                            iframe.setAttribute("src", "");
                            window.URL.revokeObjectURL(uri);

                            iframe.onload = function() {
                                iframe.onload = undefined;

                                callback.call(caller, success, attachedData);
                            };

                            var documentHtmlText = [resolvedContentDocumentDom.documentElement.outerHTML];

                            if (window.navigator.userAgent.indexOf("Trident") > 0) {
                                // Internet Explorer doesn't handle loading documents from Blobs correctly.
                                // TODO: Currently using the document.write() approach only for IE, as it breaks CSS selectors
                                // with namespaces for some reason (e.g. the childrens-media-query sample EPUB)
                                iframe.contentWindow.document.open();
                                //inject reading system object before writing to the iframe DOM
                                iframe.contentWindow.navigator.epubReadingSystem = navigator.epubReadingSystem;
                                iframe.contentWindow.document.write(documentHtmlText);
                                iframe.contentWindow.document.close();
                            } else {
                                var contentDocumentBlob = new Blob(documentHtmlText, {'type': 'application/xhtml+xml'});
                                var documentDataUri = window.URL.createObjectURL(contentDocumentBlob);
                                iframe.setAttribute("src", documentDataUri);
                            }

                        }, function (err) {
                            callback.call(caller, success, attachedData);
                        }
                    );
                };
                // Feed an artificial empty HTML document to the IFRAME, then let the wrapper onload function
                // take care of actual document loading (from zipped EPUB) and calling callbacks:
                var emptyDocumentDataUri = window.URL.createObjectURL(emptyDocumentBlob);
                // TODO: Need ideas on how to create an IE-supported empty document URI that doesn't use Blobs
                // and doesn't cause cross origin errors on Chrome (like plain data URLs do).
                basicIframeLoader.loadIframe(iframe, emptyDocumentDataUri, basicLoadCallback, caller, attachedData);
            } else {
                basicIframeLoader.loadIframe(iframe, src, callback, caller, attachedData);
            }
        };
    };

    return zipIframeLoader;
});
