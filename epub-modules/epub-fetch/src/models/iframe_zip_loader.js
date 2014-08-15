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

        var basicIframeLoader = new ReadiumSDK.Views.IFrameLoader();
        var eventListeners = {},
            self = this;


        this.addIFrameEventListener = function (eventName, callback, context) {

            if (eventListeners[eventName] == undefined) {
                eventListeners[eventName] = [];
            }

            eventListeners[eventName].push({callback: callback, context: context});
        };

        this.updateIframeEvents = function (iframe) {

            _.each(eventListeners, function (value, key) {
                for (var i = 0, count = value.length; i < count; i++) {
                    $(iframe.contentWindow).off(key);
                    $(iframe.contentWindow).on(key, value[i].callback, value[i].context);
                }
            });
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
                            self._loadIframeWithDocument(iframe,
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

        this._loadIframeWithDocument = function (iframe, attachedData, contentDocumentData, callback) {

            var isIE = (window.navigator.userAgent.indexOf("Trident") > 0);
            if (!isIE) {
                var contentType = 'text/html';
                if (attachedData.spineItem.media_type && attachedData.spineItem.media_type.length) {
                    contentType = attachedData.spineItem.media_type;
                }

                var documentDataUri = window.URL.createObjectURL(
                    new Blob([contentDocumentData], {'type': contentType})
                );
            } else {
                // Internet Explorer doesn't handle loading documents from Blobs correctly.
                // TODO: Currently using the document.write() approach only for IE, as it breaks CSS selectors
                // with namespaces for some reason (e.g. the childrens-media-query sample EPUB)
                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(contentDocumentData);
            }

            iframe.onload = function () {

                self.updateIframeEvents(iframe);

                var mathJax = iframe.contentWindow.MathJax;
                if (mathJax) {
                    // If MathJax is being used, delay the callback until it has completed rendering
                    var mathJaxCallback = _.once(callback);
                    mathJax.Hub.Queue(mathJaxCallback);
                    // Or at an 8 second timeout, which ever comes first
                    // window.setTimeout(mathJaxCallback, 8000);
                } else {
                    callback();
                }

                if (!isIE) {
                    window.URL.revokeObjectURL(documentDataUri);
                }
            };

            if (!isIE) {
                iframe.setAttribute("src", documentDataUri);
            } else {
                iframe.contentWindow.document.close();
            }
        };

        function fetchHtmlAsText(path, callback) {

            $.ajax({
                url: path,
                dataType: 'html',
                async: true,
                success: function (result) {

                    callback(result);
                },
                error: function (xhr, status, errorThrown) {
                    console.error('Error when AJAX fetching ' + path);
                    console.error(status);
                    console.error(errorThrown);
                    callback();
                }
            });
        }

        function fetchContentDocument(src, callback) {

            fetchHtmlAsText(src, function (contentDocumentHtml) {

                if (!contentDocumentHtml) {
                    callback();
                    return;
                }

                var sourceParts = src.split("/");
                sourceParts.pop(); //remove source file name

                var base = "<base href=\"" + sourceParts.join("/") + "/" + "\"/>";

                var scripts = "<script type=\"text/javascript\">(" + injectedScript.toString() + ")()<\/script>";

                if (options && options.mathJaxUrl && contentDocumentHtml.indexOf("<math") >= 0) {
                    scripts += "<script type=\"text/javascript\" src=\"" + options.mathJaxUrl + "\"><\/script>";
                }

                var mangledContent = contentDocumentHtml.replace(/(<head.*?>)/, "$1" + base + scripts);
                callback(mangledContent);
            });
        }

        function injectedScript() {

            navigator.epubReadingSystem = window.parent.navigator.epubReadingSystem;
            window.parent = window.self;
            window.top = window.self;
        }
    };

    return zipIframeLoader;
});
