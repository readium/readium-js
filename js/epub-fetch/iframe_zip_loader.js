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

define(['URIjs', 'readium_shared_js/views/iframe_loader', 'underscore', './discover_content_type', 'bowser'], function(URI, IFrameLoader, _, ContentTypeDiscovery, bowser) {

    var zipIframeLoader = function( getCurrentResourceFetcher, contentDocumentTextPreprocessor) {

        var isIE = (window.navigator.userAgent.indexOf("Trident") > 0 || window.navigator.userAgent.indexOf("Edge") > 0);
            
        var basicIframeLoader = new IFrameLoader();

        var self = this;

        var _contentDocumentTextPreprocessor = contentDocumentTextPreprocessor;

        this.addIFrameEventListener = function (eventName, callback, context) {
            basicIframeLoader.addIFrameEventListener(eventName, callback, context);
        };

        this.updateIframeEvents = function (iframe) {
            basicIframeLoader.updateIframeEvents(iframe);
        };

        this.loadIframe = function(iframe, src, callback, caller, attachedData) {

            if (!iframe.baseURI) {
                
                if (isIE && iframe.ownerDocument.defaultView.frameElement) {
                    
                    //console.debug(iframe.ownerDocument.defaultView.location);
                    iframe.baseURI = iframe.ownerDocument.defaultView.frameElement.getAttribute("data-loadUri");
                    
                    console.log("EPUB doc iframe src (BEFORE):");
                    console.log(src);
                    src = new URI(src).absoluteTo(iframe.baseURI).search('').hash('').toString();
                }
                else if (typeof location !== 'undefined') {
                    iframe.baseURI = location.href + "";
                }
                
                console.error("!iframe.baseURI => " + iframe.baseURI);
            }
            
            console.log("EPUB doc iframe src:");
            console.log(src);
            iframe.setAttribute("data-src", src);
            
            console.log("EPUB doc iframe base URI:");
            console.log(iframe.baseURI);
            iframe.setAttribute("data-baseUri", iframe.baseURI);
            

            var loadedDocumentUri = new URI(src).absoluteTo(iframe.baseURI).search('').hash('').toString();

            console.log("EPUB doc iframe LOAD URI:");
            console.log(loadedDocumentUri);
            iframe.setAttribute("data-loadUri", loadedDocumentUri);
            
            var shouldConstructDomProgrammatically = getCurrentResourceFetcher().shouldConstructDomProgrammatically();
            if (shouldConstructDomProgrammatically) {
                
                console.log("shouldConstructDomProgrammatically...");

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
                fetchContentDocument(loadedDocumentUri, function (contentDocumentHtml) {
                      if (!contentDocumentHtml) {
                          //failed to load content document
                          callback.call(caller, false, attachedData);
                      } else {
                          self._loadIframeWithDocument(iframe, attachedData, contentDocumentHtml, function () {
                              callback.call(caller, true, attachedData);
                          });
                      }
                });
            }
        };

        this._loadIframeWithDocument = function (iframe, attachedData, contentDocumentData, callback) {
            var documentDataUri, blob;

            var chromeIOS = bowser.ios && bowser.chrome;
            // IE and Safari 6 for iOS don't handle Blobs correctly
            // Chrome on iOS fails to access iframe.contentWindow with BlobURI and data URL :(
            var isBlobHandled = !chromeIOS // fallback to srcdoc
                && !bowser.msie
                && !(bowser.ios && (parseInt(bowser.version, 10) < 7))
                && !bowser.samsungBrowser;

            if (isBlobHandled) {
                var contentType = 'text/html';
                if (attachedData.spineItem.media_type && attachedData.spineItem.media_type.length) {
                    contentType = attachedData.spineItem.media_type;
                }

                // prefer BlobBuilder as some browser supports Blob constructor but fails using it
                if (window.BlobBuilder) {
                    var builder = new BlobBuilder();
                    builder.append(contentDocumentData);
                    blob = builder.getBlob(contentType);
                } else {
                    blob = new Blob([contentDocumentData], {'type': contentType});
                }
                documentDataUri = window.URL.createObjectURL(blob);
                
                //Chrome on iOS:
                //data URL as substitute to BlobURI ... still iframe.contentWindow silent crash :(
                // var reader = new FileReader();
                // reader.onload = function(e){
                //     documentDataUri = reader.result;
                //     iframe.setAttribute("src", documentDataUri);
                //     // iframe.src = documentDataUri;
                // }
                // reader.readAsDataURL(blob);
                
            } else if (!chromeIOS) {
                // Note that this does not support CSS selectors with XHTML namespaces (e.g. epub:type)
                iframe.contentWindow.document.open();

                // Currently not handled automatically by winstore-jscompat,
                // so we're doing it manually. See:
                // https://github.com/MSOpenTech/winstore-jscompat/
                if (window.MSApp && window.MSApp.execUnsafeLocalFunction) {
                    window.MSApp.execUnsafeLocalFunction(function() {
                        iframe.contentWindow.document.write(contentDocumentData);
                    });
                } else {
                    iframe.contentWindow.document.write(contentDocumentData);
                }
            }

            iframe.onload = function () {
                var doc = iframe.contentDocument || iframe.contentWindow.document;

                // $('iframe', doc).each(function(i, child_iframe){
                //     console.debug(child_iframe);
                //     console.log(child_iframe.attr("data-src"));
                // });
                
                if (iframe.contentWindow.frames) {
                    for (var i = 0; i < iframe.contentWindow.frames.length; i++) {
                        var child_iframe = iframe.contentWindow.frames[i];
                        // console.debug(child_iframe);
                        
                        // console.log(child_iframe.frameElement.baseURI);
                        
                        // console.log(child_iframe.location);
                        
                        var childSrc = undefined;
                        
                        try{
                            childSrc = child_iframe.frameElement.getAttribute("data-src");
                        } catch(err) {
                            // HTTP(S) cross-origin access?
                            console.warn(err);
                            continue;
                        }
                        // console.log(childSrc);
                        
                        if (!childSrc) {
                            if (child_iframe.frameElement.localName == "iframe") {
                                console.error("IFRAME data-src missing?!");
                            }
                            continue;
                        }
                            
                        // console.debug(attachedData);
                        var contentDocumentPathRelativeToPackage = attachedData.spineItem.href; 
                            
                        var publicationFetcher = getCurrentResourceFetcher();
                            
                        var contentDocumentPathRelativeToBase = publicationFetcher.convertPathRelativeToPackageToRelativeToBase(contentDocumentPathRelativeToPackage);
                        // console.log("contentDocumentPathRelativeToBase: " + contentDocumentPathRelativeToBase);
    
                        var refAttrOrigVal_RelativeToBase = (new URI(childSrc)).absoluteTo(contentDocumentPathRelativeToBase).toString();
                        // console.log("refAttrOrigVal_RelativeToBase: " + refAttrOrigVal_RelativeToBase);
    
                        var packageFullPath = publicationFetcher.getPackageFullPathRelativeToBase();
                        // console.log("packageFullPath: " + packageFullPath);
    
    
                        var refAttrOrigVal_RelativeToPackage = (new URI("/"+refAttrOrigVal_RelativeToBase)).relativeTo("/"+packageFullPath).toString();
                        // console.log("refAttrOrigVal_RelativeToPackage: " + refAttrOrigVal_RelativeToPackage);

                        var mimetype = ContentTypeDiscovery.identifyContentTypeFromFileName(refAttrOrigVal_RelativeToPackage);
                        
                        var childIframeLoader = new zipIframeLoader(getCurrentResourceFetcher, contentDocumentTextPreprocessor);
                        childIframeLoader.loadIframe(
                            child_iframe.frameElement,
                            childSrc,
                            function() {
                                console.log("CHILD IFRAME LOADED.");
                            },
                            self,
                            {
                                spineItem:
                                {
                                  media_type: mimetype, //attachedData.spineItem.media_type,
                                  href: refAttrOrigVal_RelativeToPackage
                                }
                            }
                        );
                    }
                }
                
                $('svg', doc).on("load", function(){
                    console.log('SVG loaded');
                });
                
                self.updateIframeEvents(iframe);
                
                var mathJax = iframe.contentWindow.MathJax;
                if (mathJax) {
                    
                    console.log("MathJax VERSION: " + mathJax.cdnVersion + " // " + mathJax.fileversion + " // " + mathJax.version);
                    
                    var useFontCache = true; // default in MathJax
                    
                    // Firefox fails to render SVG otherwise
                    if (mathJax.Hub.Browser.isFirefox) {
                        useFontCache = false;
                    }
                    
                    // Chrome 49+ fails to render SVG otherwise
                    // https://github.com/readium/readium-js/issues/138
                    if (mathJax.Hub.Browser.isChrome) {
                        useFontCache = false;
                    }
                    
                    // Edge fails to render SVG otherwise
                    // https://github.com/readium/readium-js-viewer/issues/394#issuecomment-185382196
                    if (window.navigator.userAgent.indexOf("Edge") > 0) {
                        useFontCache = false;
                    }
                    
                    mathJax.Hub.Config({showMathMenu:false, messageStyle: "none", showProcessingMessages: true, SVG:{useFontCache:useFontCache}});
                
                    // If MathJax is being used, delay the callback until it has completed rendering
                    var mathJaxCallback = _.once(callback);
                    
                    try {
                        mathJax.Hub.Queue(mathJaxCallback);
                    } catch (err) {
                        console.error("MathJax fail!");
                        callback();
                    }
                    
                    // Or at an 8 second timeout, which ever comes first
                    // window.setTimeout(mathJaxCallback, 8000);
                } else {
                    callback();
                }

                if (isBlobHandled) {
                    window.URL.revokeObjectURL(documentDataUri);
                }
            };

            if (isBlobHandled) {
                iframe.setAttribute("src", documentDataUri);
            } else if (!chromeIOS) {
                iframe.contentWindow.document.close();
            } else { // chromeIOS
                iframe.setAttribute("srcdoc", contentDocumentData);
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

                if (_contentDocumentTextPreprocessor) {
                    contentDocumentHtml = _contentDocumentTextPreprocessor(src, contentDocumentHtml);
                }

                callback(contentDocumentHtml);
            });
        }
    };

    return zipIframeLoader;
});
