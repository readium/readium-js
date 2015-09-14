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


define([//'jquery', 'underscore'
'zip-ext', 'inflate'
, './epub-fetch/discover_content_type'
],
    function (//$, _
    zip, zip2
, ContentTypeDiscovery
    ) {
    
    
    // Undefined XHR => importHttpContent fails :(
    //console.debug(XMLHttpRequest);
    // ...so we polyfill XHR using the Fetch API
    self.XMLHttpRequest = function() {
        console.debug("ServiceWorker:: XMLHttpRequest polyfill - NEW");
        
        this._callback_Load = undefined;
        this._callback_Error = undefined;
        
        this._method = "GET";
        this._url = undefined;
        
        this._headers = {};
        
        this._response = undefined;
        
        
        this.responseType = undefined;
        
        this.response = undefined;
    };

    self.XMLHttpRequest.prototype.addEventListener = function(eventName, callback, ignore) {
        console.debug("ServiceWorker:: XMLHttpRequest polyfill - addEventListener: " + eventName);
        
        if (eventName == "load") {
            this._callback_Load = callback;
        } else if (eventName == "error") {
            this._callback_Error = callback;
        } else {
            console.error("ServiceWorker:: XMLHttpRequest polyfill - eventName?! " + eventName);
        }
    };
    
    self.XMLHttpRequest.prototype.getResponseHeader = function(header) {
        console.debug("ServiceWorker:: XMLHttpRequest polyfill - getResponseHeader: " + header);
        
        //"Content-Length"
        //"Accept-Ranges"
            
        if (this._response) {
            var val = this._response.headers.get(header);
            
            console.debug(header + " => " + val);
            
            return val;
        }
        
        return undefined;
    };
    
    self.XMLHttpRequest.prototype.setRequestHeader = function(header, val) {
        console.debug("ServiceWorker:: XMLHttpRequest polyfill - setRequestHeader: " + header + " << " + val);
        
        //"Range"
        
        this._headers[header] = val;
    };
    
    
    self.XMLHttpRequest.prototype.open = function(method, url) {
        console.debug("ServiceWorker:: XMLHttpRequest polyfill - open");
        
        console.debug(method + " :: " + url);
        
        this._method = method;
        this._url = url;
    };
    
    self.XMLHttpRequest.prototype.send = function() {
        console.debug("ServiceWorker:: XMLHttpRequest polyfill - send");
        
        var that = this;
        
        fetch(
        this._url,
        {
            method: this._method,
            headers: this._headers,
            //mode: "cors"
        }).then(
        function(response) {
            if (response.ok) {
                
                console.debug(response);
                
                that._response = response;
                
                if (that.responseType == "arraybuffer") {
                    response.arrayBuffer().then(function(buffer) {
                        console.debug(buffer);
                        
                        that.response = buffer;
                        that._callback_Load();
                        //that._callback_Load.XHRRES = that.response;
                    }, function(e) {console.error(e); if (that._callback_Error) that._callback_Error(new Error(msg));});
                } else {
                    response.text().then(function(txt) {
                        console.debug(txt);
                        
                        that.response = txt;
                        that._callback_Load();
                        //that._callback_Load.XHRRES = that.response;
                    }, function(e) {console.error(e); if (that._callback_Error) that._callback_Error(new Error(msg));});
                }
            } else {
                var msg = "ServiceWorker:: XMLHttpRequest polyfill - bad response?! " + response.status;
                console.error(msg);
                if (that._callback_Error) that._callback_Error(new Error(msg));
            }
        },
        function(e) {
            console.error(e);
            if (that._callback_Error) that._callback_Error(e);
        }
        );
    };
    


    var _contentDocumentTextPreprocessor = function(contentDocumentHtml) {

        var mathJaxUrl = "/MathJax.js";
    
        function injectedScript() {

            navigator.epubReadingSystem = window.parent.navigator.epubReadingSystem;
        }

        var scripts = "<script type=\"text/javascript\">(" + injectedScript.toString() + ")()<\/script>";

        if (contentDocumentHtml.indexOf("<math") >= 0) {
            scripts += "<script type=\"text/javascript\" src=\"" + mathJaxUrl + "\"> <\/script>";
        }

        contentDocumentHtml = contentDocumentHtml.replace(/(<head[\s\S]*?>)/, "$1" + scripts);
                    
//console.debug(contentDocumentHtml);
        
        return contentDocumentHtml;
    };

    var getMimeType = function(event, url) {
        
        var acceptHeader = event.request.headers.get("Accept");
        var acceptHeaderContentType = acceptHeader;
        if (acceptHeaderContentType) {
            var iComma = acceptHeaderContentType.indexOf(',');
            if (iComma > 0) {
                acceptHeaderContentType = acceptHeaderContentType.substr(0, iComma);
                
                if (acceptHeaderContentType == "text/html") {
                    if (acceptHeader.indexOf("application/xhtml+xml") > 0) {
                        if ((typeof ContentTypeDiscovery) !== "undefined") {
                        
                            acceptHeaderContentType = ContentTypeDiscovery.identifyContentTypeFromFileName(url);
                        }
                    }
                }
            }
        } else {
            acceptHeaderContentType = "text/plain";
            
            if ((typeof ContentTypeDiscovery) !== "undefined") {
            
                acceptHeaderContentType = ContentTypeDiscovery.identifyContentTypeFromFileName(url);
            }
        }
        console.debug("acceptHeaderContentType: " + acceptHeaderContentType);
        
        return acceptHeaderContentType;
    };
    
    
    
    self.addEventListener('fetch', function(event) {
        
        console.debug("ServiceWorker FETCH: " + event.request.url);
        
        event.request.headers.forEach(function(){console.debug(arguments[1] + " :: " + arguments[0]);});
        
        console.debug(event.request.mode);
        console.debug(event.request.credentials);
        
        var delim = ".epub/";
        var i = event.request.url.indexOf(delim);
        var isEPUB = i > 0;
        
        if (!isEPUB) {

            var contentType = getMimeType(event, event.request.url);

            if (contentType == "text/html" || contentType == "application/xhtml+xml") {
                console.log("ServiceWorker:: pre-processing XHTML ... " + event.request.url);
                
                    
                event.respondWith(
                    fetch(event.request.clone()).then(function(response) {
                    
                        if (response.ok) {
                            return response.text().then(function(txt) {
                                    
                                    txt = _contentDocumentTextPreprocessor(txt);
                                    
                                    console.debug(txt);
                                    
                                    return new Response(txt, {
                                        statusText: "OK",
                                        status: 200,
                                        headers: {
                                            'Content-Type': contentType
                                        }
                                    });
                                }, function(e) {console.error(e); return undefined;});
                                
                        } else {
                            var msg = "ServiceWorker:: XMLHttpRequest polyfill - bad response?! " + response.status + " --- " + event.request.url;
                            console.error(msg);
                            return undefined;
                        }
                    })  
                );
            } else {
                event.respondWith(fetch(event.request.clone()));
            }
            
            return;
        }
        
        var epubUrl = event.request.url.substr(0, i+(delim.length-1));
        var epubInnerPath = event.request.url.substr(i+(delim.length));
        
        console.error("ServiceWorker FETCH epub: ");
        console.log(epubUrl);
        console.log(epubInnerPath);
      
        var zipResponsePromise = new Promise(function(resolve, reject) {
            
            // zip.useWebWorkers = true; // (true by default)
            // zip.workerScriptsPath = "../build-output/"; //var libDir = readiumOptions.jsLibRoot;
    
            zip.useWebWorkers = false; // (true by default)
            
            // TODO: cache this? Problem: ServiceWorker lifecycle
            var _zipFs = new zip.fs.FS();
        
            _zipFs.importHttpContent(
                epubUrl,
                true,
                function () {
                        
                    var entry = _zipFs.find(epubInnerPath);
    
                    if (typeof entry === 'undefined' || entry === null) {
                
                        var msg  = 'ServiceWorker:: Entry [' + epubInnerPath + '] in zip [' + epubUrl + '] was not found!';
                        
                        console.error(msg);
                        reject(new Error(msg));
                    } else {
                        if (entry.directory) {
                            
                            var msg  = 'ServiceWorker:: Entry [' + epubInnerPath + '] in zip [' + epubUrl + '] is a directory!';
                            
                            console.error(msg);
                            reject(new Error(msg));
                        } else {
                            console.debug(entry);
                            
                            var acceptHeaderContentType = getMimeType(event, epubInnerPath);
                            
                            if (acceptHeaderContentType.startsWith("text/") || acceptHeaderContentType.startsWith("application/xhtml") || acceptHeaderContentType.startsWith("application/xml")) {
                                
                                entry.getText(function(data) {
                                    
                                    if (acceptHeaderContentType == "text/html" || acceptHeaderContentType == "application/xhtml+xml") {
                                        console.log("ServiceWorker:: pre-processing XHTML" + epubInnerPath);
                                        data = _contentDocumentTextPreprocessor(data);
                                        
                                        console.debug(data);
                                    }
                                    
                                    resolve(new Response(data, {
                                        statusText: "OK",
                                        status: 200,
                                        headers: {
                                            'Content-Type': acceptHeaderContentType
                                        }
                                    }));
                                    
                                }, undefined, false);
                            
                            } else {
                                    console.debug("BLOB!!");
                                entry.getBlob(acceptHeaderContentType, function(data) {
                                    console.debug(data);
                                        
                                    resolve(new Response(data, {
                                        statusText: "OK",
                                        status: 200,
                                        headers: {
                                            'Content-Type': acceptHeaderContentType
                                        }
                                    }));
                                    // var fileReader = new FileReader();
                                    // fileReader.onload = function() {
                                    //     var arrayBuffer = this.result;
                                        
                                    //     console.debug(arrayBuffer);
                                        
                                    //     resolve(arrayBuffer);
                                    // };
                                    // fileReader.readAsArrayBuffer(data);
                                    
                                }, undefined, false);
                            }
                            
                        }
                    }
                },
                function () {
                    console.error('ServiceWorker:: EPUB UNZIP error!');
                    console.debug(arguments);
                    
                    reject(arguments);
                }
            );
        });
        
        event.respondWith(zipResponsePromise);
    });

});

require("readium_js/EpubServiceWorker");
