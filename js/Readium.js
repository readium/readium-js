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


define(['readium_shared_js/globals', 'text!version.json', 'jquery', 'underscore', 'readium_shared_js/views/reader_view', 'readium_js/epub-fetch/publication_fetcher',
        'readium_js/epub-model/package_document_parser', 'readium_js/epub-fetch/iframe_zip_loader', 'readium_shared_js/views/iframe_loader'
        ],
    function (Globals, versionText, $, _, ReaderView, PublicationFetcher,
              PackageParser, IframeZipLoader, IframeLoader) {

    var DEBUG_VERSION_GIT = false;

    //polyfill to support old versions of some browsers
    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;

    var Readium = function(readiumOptions, readerOptions){

        var _options = { mathJaxUrl: readerOptions.mathJaxUrl };

        var _contentDocumentTextPreprocessor = function(src, contentDocumentHtml) {

            function escapeMarkupEntitiesInUrl(url) {
                return url
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&apos;");
            }

            function injectedScript() {

                navigator.epubReadingSystem = window.parent.navigator.epubReadingSystem;
            }

            var sourceParts = src.split("/");
            //sourceParts.pop(); //remove source file name
            var baseHref = sourceParts.join("/"); // + "/";
            
            console.log("EPUB doc base href:");
            console.log(baseHref);
            var base = "<base href=\"" + encodeURI(escapeMarkupEntitiesInUrl(baseHref)) + "\"/>";

            var scripts = "<script type=\"text/javascript\">(" + injectedScript.toString() + ")()<\/script>";

            if (_options && _options.mathJaxUrl && contentDocumentHtml.search(/<(\w+:|)(?=math)/) >= 0) {
                scripts += "<script type=\"text/javascript\" src=\"" + _options.mathJaxUrl + "\"> <\/script>";
            }

            contentDocumentHtml = contentDocumentHtml.replace(/(<head[\s\S]*?>)/, "$1" + base + scripts);

            contentDocumentHtml = contentDocumentHtml.replace(/(<iframe[\s\S]+?)src[\s]*=[\s]*(["'])[\s]*(.*)[\s]*(["'])([\s\S]*?>)/g, '$1data-src=$2$3$4$5');

            contentDocumentHtml = contentDocumentHtml.replace(/(<iframe[\s\S]+?)data-src[\s]*=[\s]*(["'])[\s]*(http[s]?:\/\/.*)[\s]*(["'])([\s\S]*?>)/g, '$1src=$2$3$4$5');
            
            // Empty title in Internet Explorer blows the XHTML parser (document.open/write/close instead of BlobURI)
            contentDocumentHtml = contentDocumentHtml.replace(/<title>[\s]*<\/title>/g, '<title>TITLE</title>');
            contentDocumentHtml = contentDocumentHtml.replace(/<title[\s]*\/>/g, '<title>TITLE</title>');
            
            return contentDocumentHtml;
        };

        var self = this;

        var _currentPublicationFetcher = undefined;
        this.getCurrentPublicationFetcher = function() {
            return _currentPublicationFetcher;
        };
            

        var jsLibRoot = readiumOptions.jsLibRoot;

        if (!readiumOptions.useSimpleLoader){
            readerOptions.iframeLoader = new IframeZipLoader(function() { return _currentPublicationFetcher; }, _contentDocumentTextPreprocessor);
        }
        else{
            readerOptions.iframeLoader = new IframeLoader();
        }

        // Chrome extension and cross-browser cloud reader build configuration uses this scaling method across the board (no browser sniffing for Chrome)
        // See https://github.com/readium/readium-js-viewer/issues/313#issuecomment-101578284
        // true means: apply CSS scale transform to the root HTML element of spine item documents (fixed layout / pre-paginated)
        // and to any spine items in scroll view (both continuous and document modes). Scroll view layout includes reflowable spine items, but the zoom level is 1x so there is no impact.
        readerOptions.needsFixedLayoutScalerWorkAround = true;

        this.reader = new ReaderView(readerOptions);
        ReadiumSDK.reader = this.reader;

        var openPackageDocument_ = function(ebookURL, callback, openPageRequest, contentType)  {
            if (_currentPublicationFetcher) {
                _currentPublicationFetcher.flushCache();
            }

            var cacheSizeEvictThreshold = null;
            if (readiumOptions.cacheSizeEvictThreshold) {
                cacheSizeEvictThreshold = readiumOptions.cacheSizeEvictThreshold;
            }

            _currentPublicationFetcher = new PublicationFetcher(ebookURL, jsLibRoot, window, cacheSizeEvictThreshold, _contentDocumentTextPreprocessor, contentType);

            _currentPublicationFetcher.initialize(function(resourceFetcher) {

                if (!resourceFetcher) {
                    
                    callback(undefined);
                    return;
                }
                
                var _packageParser = new PackageParser(_currentPublicationFetcher);

                _packageParser.parse(function(packageDocument){
                    
                    if (!packageDocument) {
                        
                        callback(undefined);
                        return;
                    }
                    
                    var openBookOptions = readiumOptions.openBookOptions || {};
                    var openBookData = $.extend(packageDocument.getSharedJsPackageData(), openBookOptions);

                    if (openPageRequest) {
                        // resolve package CFI (targeting a spine item ref) to an idref value if provided
                        if (openPageRequest.spineItemCfi) {
                            openPageRequest.idref = packageDocument.getSpineItemIdrefFromCFI(openPageRequest.spineItemCfi);
                        }
                        openBookData.openPageRequest = openPageRequest;
                    }
                    self.reader.openBook(openBookData);

                    var options = {
                        metadata: packageDocument.getMetadata()
                    };

                    callback(packageDocument, options);
                });
            });
        };


        this.openPackageDocument = function(ebookURL, callback, openPageRequest)  {
                        
            if (!(ebookURL instanceof Blob)
                && !(ebookURL instanceof File)
                // && ebookURL.indexOf("file://") != 0
                // && ebookURL.indexOf("filesystem://") != 0
                // && ebookURL.indexOf("filesystem:chrome-extension://") != 0
            ) {
            
                console.debug("-------------------------------");
                
                var origin = window.location.origin; 
                if (!origin) {
                    origin = window.location.protocol + '//' + window.location.host;
                }
                var thisRootUrl = origin + window.location.pathname;
                
                console.debug("BASE URL: " + thisRootUrl);
                console.debug("RELATIVE URL: " + ebookURL);
                
                try {
                    ebookURL = new URI(ebookURL).absoluteTo(thisRootUrl).toString();
                } catch(err) {
                    console.error(err);
                    console.log(ebookURL);
                }
                
                console.debug("==>");
                console.debug("ABSOLUTE URL: " + ebookURL);
                
                console.debug("-------------------------------");
                
                // We don't use URI.is("absolute") here, as we really need HTTP(S) (excludes e.g. "data:" URLs)
                if (ebookURL.indexOf("http://") == 0 || ebookURL.indexOf("https://") == 0) {
                        
                    var xhr = new XMLHttpRequest();
                    xhr.onreadystatechange = function(){
                        
                        if (this.readyState != 4) return;
                        
                        var contentType = undefined;
                        
                        var success = xhr.status >= 200 && xhr.status < 300 || xhr.status === 304;
                        if (success) {
                            
                            var allResponseHeaders = '';
                            if (xhr.getAllResponseHeaders) {
                                allResponseHeaders = xhr.getAllResponseHeaders();
                                if (allResponseHeaders) {
                                    allResponseHeaders = allResponseHeaders.toLowerCase();
                                } else allResponseHeaders ='';
                                //console.debug(allResponseHeaders);
                            }
                            
                            if (allResponseHeaders.indexOf("content-type") >= 0) {
                                contentType = xhr.getResponseHeader("Content-Type") || xhr.getResponseHeader("content-type");
                                if (!contentType) contentType = undefined;
                                
                                console.debug("CONTENT-TYPE: " + ebookURL + " ==> " + contentType);
                            }
                            
                            var responseURL = xhr.responseURL;
                            if (!responseURL) {
                                if (allResponseHeaders.indexOf("location") >= 0) {
                                    responseURL = xhr.getResponseHeader("Location") || xhr.getResponseHeader("location");
                                }
                            }
                            
                            if (responseURL && responseURL !== ebookURL) {
                                console.debug("REDIRECT: " + ebookURL + " ==> " + responseURL);
    
                                ebookURL = responseURL;
                            }
                        }
                        
                        openPackageDocument_(ebookURL, callback, openPageRequest, contentType);
                    };
                    xhr.open('HEAD', ebookURL, true);
                    //xhr.responseType = 'blob';
                    xhr.send(null); 
                
                    return;
                }
            }
                    
            openPackageDocument_(ebookURL, callback, openPageRequest);
        };
        
        this.closePackageDocument = function() {
            if (_currentPublicationFetcher) {
                _currentPublicationFetcher.flushCache();
            }
        };

        Globals.logEvent("READER_INITIALIZED", "EMIT", "Readium.js");
        ReadiumSDK.emit(ReadiumSDK.Events.READER_INITIALIZED, ReadiumSDK.reader);
    };

    Readium.version = JSON.parse(versionText);

    Readium.getVersion = function(callback) {

        var version = Readium.version;

        if (version.needsPopulating) {

            if (DEBUG_VERSION_GIT) {
                console.log("version.json needsPopulating ...");
            }

            var nextRepo = function(i) {
                if (i >= version.repos.length) {
                    delete version.needsPopulating;
                    delete version.repos;

                    if (DEBUG_VERSION_GIT) {
                        console.log("version");
                        console.debug(version);
                    }

                    Readium.version = version;
                    callback(version);
                    return;
                }

                var repo = version.repos[i];

                if (DEBUG_VERSION_GIT) {
                
                    console.log("##########################");
    
                    console.log("repo.name");
                    console.debug(repo.name);
    
                    console.log("repo.path");
                    console.debug(repo.path);
                }

                version[repo.name] = {};
                version[repo.name].timestamp = new Date().getTime();

                  //
                  // "readiumJs":
                  // {
                  //   "sha":"xxx",
                  //   "clean":false,
                  //   "version":"yyy",
                  //   "chromeVersion":"yyy",
                  //   "tag":"zzz",
                  //   "branch":"fff",
                  //   "release":false,
                  //   "timestamp":000
                  // }

                $.getJSON(repo.path + '/package.json', function(data) {

                    if (DEBUG_VERSION_GIT) {
                        console.log("version");
                        console.debug(data.version);
                    }

                    version[repo.name].version = data.version;
                    version[repo.name].chromeVersion = '2.' + data.version.substring(2);

                    var getRef = function(gitFolder, repo, ref) {
                        var url = gitFolder + '/' + ref;

                        if (DEBUG_VERSION_GIT) {
                            console.log("getRef");
                            console.debug(url);
                        }

                        $.get(url, function(data) {

                            version[repo.name].branch = ref;
                            
                            var sha = data.substring(0, data.length - 1);
                            version[repo.name].sha = sha;
                            
                            if (DEBUG_VERSION_GIT) {
                                console.log("getRef OKAY");
                                console.debug(url);
    
                                console.log(data);
    
                                console.log("branch");
                                console.debug(ref);
                                
                                console.log("sha");
                                console.debug(sha);
                            }

                            nextRepo(++i);

                        }).fail(function(err) {

                            if (DEBUG_VERSION_GIT) {
                                console.log("getRef ERROR");
                                console.debug(url);
                            }

                            nextRepo(++i);
                        });
                    };

                    var getGit = function(repo) {
                        var url = repo.path + '/.git';

                        if (DEBUG_VERSION_GIT) {
                            console.log("getGit");
                            console.debug(url);
                        }

                        $.get(url, function(data) {
                            
                            if (DEBUG_VERSION_GIT) {
                                console.log("getGit OKAY");
                                console.debug(url);
                                
                                console.log(data);
                            }
                            
                            if (data.indexOf('gitdir: ') == 0) {

                                var gitDir = repo.path + "/" + data.substring('gitdir: '.length).trim();

                                if (DEBUG_VERSION_GIT) {
                                    console.log("gitdir: OKAY");
                                    console.log(gitDir);
                                }

                                getHead(gitDir, repo);

                            } else {
                                if (DEBUG_VERSION_GIT) {
                                    console.log("gitdir: ERROR");
                                }

                                nextRepo(++i);
                            }

                        }).fail(function(err) {

                            if (DEBUG_VERSION_GIT) {
                                console.log("getGit ERROR");
                                console.debug(url);
                            }

                            nextRepo(++i);
                        });
                    };

                    var getHead = function(gitFolder, repo, first) {
                        var url = gitFolder + "/HEAD";

                        if (DEBUG_VERSION_GIT) {
                            console.log("getHead");
                            console.debug(url);
                        }

                        $.get(url, function(data) {

                            if (DEBUG_VERSION_GIT) {
                                console.log("getHead OKAY");
                                console.debug(url);
                            
                                console.log(data);
                            }

                            var ref = data.substring(5, data.length - 1);
                            getRef(gitFolder, repo, ref);

                        }).fail(function(err) {

                            if (DEBUG_VERSION_GIT) {
                                console.log("getHead ERROR");
                                console.debug(url);
                            }

                            if (first) {
                                getGit(repo);
                            } else {
                                if (DEBUG_VERSION_GIT) {
                                    console.log("getHead ABORT");
                                }
                                nextRepo(++i);
                            }
                        });
                    };

                    getHead(repo.path + '/.git', repo, true);

                }).fail(function(err) { nextRepo(++i); });
            };


            nextRepo(0);

        } else { callback(version); }
    };

    return Readium;
});
