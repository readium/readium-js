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


define(['text!version.json', 'jquery', 'underscore', 'readium_shared_js/views/reader_view', 'readium_js/epub-fetch/publication_fetcher',
        'readium_js/epub-model/package_document_parser', 'readium_js/epub-fetch/iframe_zip_loader', 'readium_shared_js/views/iframe_loader'
        ],
    function (versionText, $, _, ReaderView, PublicationFetcher,
              PackageParser, IframeZipLoader, IframeLoader) {

    var Readium = function(readiumOptions, readerOptions){

        var _options = { mathJaxUrl: readerOptions.mathJaxUrl };

        var _contentDocumentTextPreprocessor = function(src, contentDocumentHtml) {

            function injectedScript() {

                navigator.epubReadingSystem = window.parent.navigator.epubReadingSystem;
            }

            var sourceParts = src.split("/");
            //sourceParts.pop(); //remove source file name
            var baseHref = sourceParts.join("/"); // + "/";
            
            console.log("EPUB doc base href:");
            console.log(baseHref);
            var base = "<base href=\"" + baseHref + "\"/>";

            var scripts = "<script type=\"text/javascript\">(" + injectedScript.toString() + ")()<\/script>";

            if (_options && _options.mathJaxUrl && contentDocumentHtml.indexOf("<math") >= 0) {
                scripts += "<script type=\"text/javascript\" src=\"" + _options.mathJaxUrl + "\"> <\/script>";
            }

            contentDocumentHtml = contentDocumentHtml.replace(/(<head[\s\S]*?>)/, "$1" + base + scripts);
                        
            contentDocumentHtml = contentDocumentHtml.replace(/(<iframe[\s\S]+?)src[\s\S]*?=[\s\S]*?(["'])([^"']+?)(["'])([\s\S]*?>)/g, '$1data-src=$2$3$4$5');
//console.debug(contentDocumentHtml);
            
            return contentDocumentHtml;
        };

        var self = this;

        var _currentPublicationFetcher;

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

        this.openPackageDocument = function(bookRoot, callback, openPageRequest)  {
            if (_currentPublicationFetcher) {
                _currentPublicationFetcher.flushCache();
            }

            var cacheSizeEvictThreshold = null;
            if (readiumOptions.cacheSizeEvictThreshold) {
                cacheSizeEvictThreshold = readiumOptions.cacheSizeEvictThreshold;
            }

            _currentPublicationFetcher = new PublicationFetcher(bookRoot, jsLibRoot, window, cacheSizeEvictThreshold, _contentDocumentTextPreprocessor);

            _currentPublicationFetcher.initialize(function(resourceFetcher) {

                var _packageParser = new PackageParser(bookRoot, _currentPublicationFetcher);

                _packageParser.parse(function(packageDocument){
                    var openBookOptions = readiumOptions.openBookOptions || {};
                    var openBookData = $.extend(packageDocument.getSharedJsPackageData(), openBookOptions);

                    if (openPageRequest) {
                        openBookData.openPageRequest = openPageRequest;
                    }
                    self.reader.openBook(openBookData);

                    var options = {
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

        ReadiumSDK.emit(ReadiumSDK.Events.READER_INITIALIZED, ReadiumSDK.reader);
    };

    Readium.version = JSON.parse(versionText);

    Readium.getVersion = function(callback) {

        var version = Readium.version;

        if (version.needsPopulating) {

            console.log("version.json needsPopulating ...");

            var nextRepo = function(i) {
                if (i >= version.repos.length) {
                    delete version.needsPopulating;
                    delete version.repos;

                    console.log("version");
                    console.debug(version);

                    Readium.version = version;
                    callback(version);
                    return;
                }

                var repo = version.repos[i];

                console.log("##########################");

                console.log("repo.name");
                console.debug(repo.name);

                console.log("repo.path");
                console.debug(repo.path);

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

                    console.log("version");
                    console.debug(data.version);

                    version[repo.name].version = data.version;
                    version[repo.name].chromeVersion = '2.' + data.version.substring(2);

                    var getRef = function(gitFolder, repo, ref) {
                        var url = gitFolder + '/' + ref;

                        console.log("getRef");
                        console.debug(url);

                        $.get(url, function(data) {

                            console.log("getRef OKAY");
                            console.debug(url);

                            console.log(data);

                            version[repo.name].branch = ref;
                            console.log("branch");
                            console.debug(ref);

                            var sha = data.substring(0, data.length - 1);
                            version[repo.name].sha = sha;
                            console.log("sha");
                            console.debug(sha);

                            nextRepo(++i);

                        }).fail(function(err) {

                            console.log("getRef ERROR");
                            console.debug(url);

                            nextRepo(++i);
                        });
                    };

                    var getGit = function(repo) {
                        var url = repo.path + '/.git';

                        console.log("getGit");
                        console.debug(url);

                        $.get(url, function(data) {

                            console.log("getGit OKAY");
                            console.debug(url);

                            console.log(data);

                            if (data.indexOf('gitdir: ') == 0) {

                                var gitDir = repo.path + "/" + data.substring('gitdir: '.length).trim();

                                console.log("gitdir: OKAY");
                                console.log(gitDir);

                                getHead(gitDir, repo);

                            } else {
                                console.log("gitdir: ERROR");

                                nextRepo(++i);
                            }

                        }).fail(function(err) {

                            console.log("getGit ERROR");
                            console.debug(url);

                            nextRepo(++i);
                        });
                    };

                    var getHead = function(gitFolder, repo, first) {
                        var url = gitFolder + "/HEAD";

                        console.log("getHead");
                        console.debug(url);

                        $.get(url, function(data) {

                            console.log("getHead OKAY");
                            console.debug(url);

                            console.log(data);

                            var ref = data.substring(5, data.length - 1);
                            getRef(gitFolder, repo, ref);

                        }).fail(function(err) {

                            console.log("getHead ERROR");
                            console.debug(url);

                            if (first) {
                                getGit(repo);
                            } else {
                                console.log("getHead ABORT");
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
