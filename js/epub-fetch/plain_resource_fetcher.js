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

define(['jquery', 'URIjs', './discover_content_type'], function ($, URI, ContentTypeDiscovery) {

    var PlainResourceFetcher = function(parentFetcher, baseUrl){

        var self = this;

        // INTERNAL FUNCTIONS

        function fetchFileContents(pathRelativeToPackageRoot, readCallback, onerror) {
            var fileUrl = self.resolveURI(pathRelativeToPackageRoot);

            if (typeof pathRelativeToPackageRoot === 'undefined') {
                throw 'Fetched file relative path is undefined!';
            }

            var xhr = new XMLHttpRequest();
            xhr.open('GET', fileUrl, true);
            xhr.responseType = 'arraybuffer';
            xhr.onerror = onerror;

            xhr.onload = function (loadEvent) {
                readCallback(xhr.response);
            };

            xhr.send();
        }


        // PUBLIC API

        this.resolveURI = function (pathRelativeToPackageRoot) {
            return baseUrl + "/" + pathRelativeToPackageRoot;
        };

        this.fetchFileContentsText = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
            var fileUrl = self.resolveURI(pathRelativeToPackageRoot);

            if (typeof fileUrl === 'undefined') {
                throw 'Fetched file URL is undefined!';
            }
            $.ajax({
                // encoding: "UTF-8",
                // mimeType: "text/plain; charset=UTF-8",
                // beforeSend: function( xhr ) {
                //     xhr.overrideMimeType("text/plain; charset=UTF-8");
                // },
                isLocal: fileUrl.indexOf("http") === 0 ? false : true,
                url: fileUrl,
                dataType: 'text', //https://api.jquery.com/jQuery.ajax/
                async: true,
                success: function (result) {
                    fetchCallback(result);
                },
                error: function (xhr, status, errorThrown) {
                    console.error('Error when AJAX fetching ' + fileUrl);
                    console.error(status);
                    console.error(errorThrown);

                    // // isLocal = false with custom URI scheme / protocol results in false fail on Firefox (Chrome okay)
                    // if (status === "error" && (!errorThrown || !errorThrown.length) && xhr.responseText && xhr.responseText.length)
                    // {
                    //     console.error(xhr);
                    //     if (typeof xhr.getResponseHeader !== "undefined") console.error(xhr.getResponseHeader("Content-Type"));
                    //     if (typeof xhr.getAllResponseHeaders !== "undefined") console.error(xhr.getAllResponseHeaders());
                    //     if (typeof xhr.responseText !== "undefined") console.error(xhr.responseText);
                    //     
                    //     // success
                    //     fetchCallback(xhr.responseText);
                    //     return;
                    // }
                    
                    onerror(errorThrown);
                }
            });
        };

        this.fetchFileContentsBlob = function(pathRelativeToPackageRoot, fetchCallback, onerror) {

            var decryptionFunction = parentFetcher.getDecryptionFunctionForRelativePath(pathRelativeToPackageRoot);
            if (decryptionFunction) {
                var origFetchCallback = fetchCallback;
                fetchCallback = function (unencryptedBlob) {
                    decryptionFunction(unencryptedBlob, function (decryptedBlob) {
                        origFetchCallback(decryptedBlob);
                    });
                };
            }
            fetchFileContents(pathRelativeToPackageRoot, function (contentsArrayBuffer) {
                var blob = new Blob([contentsArrayBuffer], {
                    type: ContentTypeDiscovery.identifyContentTypeFromFileName(pathRelativeToPackageRoot)
                });
                fetchCallback(blob);
            }, onerror);
        };
    };

    return PlainResourceFetcher;
});
