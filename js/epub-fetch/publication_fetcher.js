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

define(['jquery', 'URIjs', './markup_parser', './plain_resource_fetcher', './zip_resource_fetcher',
    './content_document_fetcher', './resource_cache', './encryption_handler', './discover_content_type', 'readium_shared_js/helpers'],
    function ($, URI, MarkupParser, PlainResourceFetcher, ZipResourceFetcher, ContentDocumentFetcher,
              ResourceCache, EncryptionHandler, ContentTypeDiscovery, Helpers) {

    var PublicationFetcher = function(ebookURL, jsLibRoot, sourceWindow, cacheSizeEvictThreshold, contentDocumentTextPreprocessor, contentType, renditionSelection) {

        var self = this;

        self.contentTypePackageReadStrategyMap = {
            'application/oebps-package+xml': 'exploded',
            'application/epub+zip': 'zipped',
            'application/zip': 'zipped'
        };

        var _shouldConstructDomProgrammatically;
        var _resourceFetcher;
        var _encryptionHandler;
        var _packageFullPath;
        var _packageDocumentAbsoluteUrl;
        var _packageDom;
        var _packageDomInitializationDeferred;
        var _publicationResourcesCache = new ResourceCache(sourceWindow, cacheSizeEvictThreshold);

        var _contentDocumentTextPreprocessor = contentDocumentTextPreprocessor;
        var _contentType = contentType;

        this.markupParser = new MarkupParser();

        var _renditionSelection = renditionSelection;
        var _mediaQuery = undefined;
        var _mediaQueryEventCallback = undefined;
        
        this.initialize =  function(callback) {

            var isEpubExploded = isExploded();

            // Non exploded EPUBs (i.e. zipped .epub documents) should be fetched in a programmatical manner:
            _shouldConstructDomProgrammatically = !isEpubExploded;
            
            createResourceFetcher(isEpubExploded, function(resourceFetcher) {
    
                //NOTE: _resourceFetcher == resourceFetcher
                
                self.getPackageDom(
                    function(packageDocument, multipleRenditions) {
                        callback(resourceFetcher, multipleRenditions);
                    },
                    function(error) {
                        console.error("unable to find package document: " + error);
        
                        callback(resourceFetcher, undefined);
                    }
                );
            });
        };

        // INTERNAL FUNCTIONS

        function isExploded() {
            // binary object means packed EPUB
            if (ebookURL instanceof Blob || ebookURL instanceof File) return false;

            if (_contentType &&
                (
                    _contentType.indexOf("application/epub+zip") >= 0
                    ||
                    _contentType.indexOf("application/zip") >= 0
                    ||
                    _contentType.indexOf("application/octet-stream") >= 0
                )
               ) return false;
            
            var uriTrimmed = ebookURL;
            
            try {
                //.absoluteTo("http://readium.org/epub")
                uriTrimmed = new URI(uriTrimmed).search('').hash('').toString();
            } catch(err) {
                console.error(err);
                console.log(ebookURL);
            }
            
            // dumb test: ends with ".epub" file extension
            return  !(/\.epub$/.test(uriTrimmed));
            
            // var ext = ".epub";
            // return ebookURL.indexOf(ext, ebookURL.length - ext.length) === -1;
        }

        var buildRenditionMapping = function(callback, multipleRenditions, containerXmlDom, packageFullPath, cacheOpfDom) {

            var doCallback = true;
        
            multipleRenditions.mappings = [];
                
            var linkMapping = $('link[rel=mapping]', containerXmlDom);
            if (linkMapping.length) {
                var href = linkMapping.attr("href");
                console.debug('link[rel=mapping] @href ==> ' + href);
                if (href) {
                    
                    var hrefParentFolder = "";
                    var slashi = href.lastIndexOf("/");
                    if (slashi > 0) {
                        hrefParentFolder = href.substr(0, slashi);
                    }
                    hrefParentFolder = "/" + hrefParentFolder;
                    console.debug(hrefParentFolder);
                    
                    doCallback = false;
                    
                    self.getXmlFileDom(href,
                        function (mappingDom) {
                            //var nav = $('nav[epub\\:type=resource-map]', mappingDom);
                            //var nav = $('nav[type=resource-map]', mappingDom);
                            var navs = $('nav', mappingDom);
                            if (navs.length) {
                                for (var i = 0; i < navs.length; i++) {
                                    var nav = $(navs[i]);
                                    
                                    var epubtype = nav.attr("epub:type");
                                    if (epubtype !== "resource-map") {
                                        continue;
                                    }
                                    var uls = $('ul', nav);
                                    for (var j = 0; j < uls.length; j++) {
                                        var ul = $(uls[j]);
                                            
                                        var mappingUL = [];
                                        multipleRenditions.mappings.push(mappingUL);
                                            
                                        var lias = $('li > a', ul);
                                        for (var k = 0; k < lias.length; k++) {
                                            var lia = $(lias[k]);
                                            var ahref = lia.attr("href");
                                            var arendition = lia.attr("epub:rendition");
                                            
                                            var mapping = {};
                                            mappingUL.push(mapping);
                                            
                                            mapping.href = ahref;
                                            mapping.rendition = arendition;
                                            
                                            var hashi = mapping.href.indexOf("#epubcfi");
                                            
                                            // this is relative to the mapping HTML doc, not to the root of the EPUB file tree
                                            mapping.opf = mapping.rendition;
                                            if (!mapping.opf) {
                                                if (hashi > 0) {
                                                    var opfPath = mapping.href.substr(0, hashi);
                                                    mapping.opf = opfPath;
                                                }
                                            }
                                            mapping.opf = hrefParentFolder + "/" + mapping.opf;
                                            
                                            var cfiOpfSpineItem = undefined;
                                            mapping.cfiFull = undefined;
                                            mapping.cfiPartial = undefined;
                                            if (hashi > 0) {
                                                var offset = hashi + 9;
                                                mapping.cfiFull = mapping.href.substr(offset, mapping.href.length-offset-1);
                                                cfiOpfSpineItem = mapping.cfiFull;
                                                
                                                var excli = mapping.cfiFull.indexOf("!");
                                                if (excli > 0) {
                                                    var offset = excli + 1;
                                                    mapping.cfiPartial = mapping.cfiFull.substr(offset, mapping.cfiFull.length-offset);
                                                    cfiOpfSpineItem = mapping.cfiFull.substr(0, offset-1);
                                                }
                                            }
                                            
                                            //OPF: packageFullPath
                                            //MAPPING: href
                                            
                                            mapping.target = undefined;
                                            if (mapping.rendition) {
                                                // this is relative to the mapping HTML doc, not to the root of the EPUB file tree
                                                mapping.target = mapping.href;
                                                mapping.target = hrefParentFolder + "/" + mapping.target;
                                            } else {
                                                // this is relative to the root of the EPUB file tree
                                                
                                                //console.debug("cfiOpfSpineItem: " + cfiOpfSpineItem);
                                                var slashi = cfiOpfSpineItem.lastIndexOf("/");
                                                if (slashi > 0) {
                                                    var nStr = cfiOpfSpineItem.substr(slashi + 1, 1);
                                                    var n = parseInt(nStr);
                                                    n = n / 2 - 1;
                                                    // n is zero-based index of spine item child element in OPF
                                                    
                                                    if (mapping.opf) {
                                                        var f = function() {
                                                            var itemRefIndex = n;
                                                            var thisOpfPath = mapping.opf.substr(1);
                                                            var mapping_ = mapping;
                                                            
                                                            var thisOpfPathParentFolder = "";
                                                            var slashi = thisOpfPath.lastIndexOf("/");
                                                            if (slashi > 0) {
                                                                thisOpfPathParentFolder = thisOpfPath.substr(0, slashi);
                                                            }
                                                            thisOpfPathParentFolder = "/" + thisOpfPathParentFolder;
                                                            //console.debug(">>> " + thisOpfPathParentFolder);
                                                            
                                                            var processOpfDom = function(opfDom) {
                                                            
                                                                var itemRefs = $('itemref', opfDom);
                                                                if (itemRefs.length) {
                                                                    var itemRef = $(itemRefs[itemRefIndex]);
                                                                    var idref = itemRef.attr("idref");
                                                                    mapping_.idref = idref;
                                                                
                                                                    var item = $('#' + idref, opfDom);
                                                                    if (item.length) {
                                                                        var itemHref = item.attr("href");
                                                                        mapping_.target = itemHref;
                                                                        mapping_.target = thisOpfPathParentFolder + "/" + mapping_.target;
                                                                        //console.debug(">>> " + mapping_.target);
                                                                        //console.debug(mapping_);
                                                                    }
                                                                }
                                                            };
                                                            
                                                            var dom = cacheOpfDom[thisOpfPath];
                                                            if (dom) {
                                                                //console.debug("*** CACHED OPF DOM: " + thisOpfPath);
                                                                processOpfDom(dom);
                                                            }
                                                            else {
                                                                // Async!
                                                                // Should never occur,
                                                                // because the cacheOpfDom array was initialised in populateCacheOpfDom(),
                                                                // based upon renditions declared in META-INF/container.xml
                                                                console.debug("*** PARSING OPF DOM: " + thisOpfPath);
                                                                self.getXmlFileDom(thisOpfPath,
                                                                    function (opfDom) {
                                                                        cacheOpfDom[thisOpfPath] = opfDom;
                                                                        processOpfDom(opfDom);
                                                                    },
                                                                    function(error) {
                                                                    }
                                                                );
                                                            }
                                                            
                                                        }();
                                                    }
                                                }
                                            }
                                            
                                            /*
                                            console.debug("============");
                                            console.log("- href: " + mapping.href);
                                            console.log("- rendition: " + mapping.rendition);
                                            console.log("opf: " + mapping.opf);
                                            console.log("cfiFull: " + mapping.cfiFull);
                                            console.log("cfiPartial: " + mapping.cfiPartial);
                                            console.log("target: " + mapping.target);
                                            */
                                        }
                                    }
                                }
                            }
                            callback(packageFullPath, multipleRenditions);
                        },
                        function(error) {
                            callback(packageFullPath, multipleRenditions);
                        }
                    );
                }
            }
            
            if (doCallback) callback(packageFullPath, multipleRenditions);
        };
        
        var populateCacheOpfDom = function(i, multipleRenditions, cacheOpfDom, callback) {
        
            var next = function(j) {
                if (j < multipleRenditions.renditions.length) {
                    console.debug("next populateCacheOpfDom");
                    populateCacheOpfDom(j, multipleRenditions, cacheOpfDom, callback);
                } else {
                    console.debug("callback populateCacheOpfDom");
                    callback();
                }
            };
        
            var rendition = multipleRenditions.renditions[i];
        
            var thisOpfPath = rendition.opfPath.substr(1);
        
            if (cacheOpfDom[thisOpfPath]) {
                
                next(i+1);
                return;
            }
        
            self.getXmlFileDom(thisOpfPath,
                function (opfDom) {
                    console.error("....cacheOpfDom: " + thisOpfPath);
                    cacheOpfDom[thisOpfPath] = opfDom;
                    
                    next(i+1);
                },
                function(error) {
                    next(i+1);
                }
            );
            
        };
        
        this.cleanup = function() {
            self.flushCache();

            if (_mediaQueryEventCallback) {
                _mediaQuery.removeListener(_mediaQueryEventCallback);
                _mediaQueryEventCallback = undefined;
            }
        };

        function createResourceFetcher(isExploded, callback) {
            if (isExploded) {
                console.log(' --- using PlainResourceFetcher');
                _resourceFetcher = new PlainResourceFetcher(self);
                callback(_resourceFetcher);
            } else {
                console.log(' --- using ZipResourceFetcher');
                _resourceFetcher = new ZipResourceFetcher(self, jsLibRoot);
                callback(_resourceFetcher);
            }
        }

        
        // PUBLIC API

        /**
         * Determine whether the documents fetched using this fetcher require special programmatic handling.
         * (resolving of internal resource references).
         * @returns {*} true if documents fetched using this fetcher require special programmatic handling
         * (resolving of internal resource references). Typically needed for zipped EPUBs or exploded EPUBs that contain
         * encrypted resources specified in META-INF/encryption.xml.
         *
         * false if documents can be fed directly into a window or iframe by src URL without using special fetching logic.
         */
        this.shouldConstructDomProgrammatically = function (){
            return _shouldConstructDomProgrammatically;
        };

        /**
         * Determine whether the media assets (audio, video, images) within content documents require special
         * programmatic handling.
         * @returns {*} true if content documents fetched using this fetcher require programmatic fetching
         * of media assets. Typically needed for zipped EPUBs.
         *
         * false if paths to media assets are accessible directly for the browser through their paths relative to
         * the base URI of their content document.
         */
        this.shouldFetchMediaAssetsProgrammatically = function() {
            return _shouldConstructDomProgrammatically && !isExploded();
        };

        this.getEbookURL = function() {
            return ebookURL;
        };

        this.getEbookURL_FilePath = function() {
            
            return Helpers.getEbookUrlFilePath(ebookURL);
        };
        
        this.getJsLibRoot = function() {
            return jsLibRoot;
        };

        this.flushCache = function() {
            _publicationResourcesCache.flushCache();
        };

        this.getPackageUrl = function() {
            return _packageDocumentAbsoluteUrl;
        };
        
        this.getPackageFullPathRelativeToBase = function() {
              return _packageFullPath;
        };

        this.fetchContentDocument = function (attachedData, loadedDocumentUri, contentDocumentResolvedCallback, errorCallback) {

            // Resources loaded for previously fetched document no longer need to be pinned:
            // DANIEL: what about 2-page synthetic spread of fixed layout documents / spine items?
            // See https://github.com/readium/readium-js/issues/104
            _publicationResourcesCache.unPinResources();


            var contentDocumentFetcher = new ContentDocumentFetcher(self, attachedData.spineItem, loadedDocumentUri, _publicationResourcesCache, _contentDocumentTextPreprocessor);
            contentDocumentFetcher.fetchContentDocumentAndResolveDom(contentDocumentResolvedCallback, errorCallback);
        };

        this.getFileContentsFromPackage = function(filePathRelativeToPackageRoot, callback, onerror) {
            
            // AVOID INVOKING fetchFileContentsText() directly, use relativeToPackageFetchFileContents() wrapper instead so that additional checks are performed.
            
            // META-INF/container.xml initial fetch, see this.initialize()
            if (!_packageFullPath) {
                console.debug("FETCHING (INIT) ... " + filePathRelativeToPackageRoot);
                if (filePathRelativeToPackageRoot && filePathRelativeToPackageRoot.charAt(0) == '/') {
                    filePathRelativeToPackageRoot = filePathRelativeToPackageRoot.substr(1);
                }
                _resourceFetcher.fetchFileContentsText(filePathRelativeToPackageRoot, function (fileContents) {
                    callback(fileContents);
                }, onerror);
            } else {
                self.relativeToPackageFetchFileContents(filePathRelativeToPackageRoot, 'text', function (fileContents) {
                    callback(fileContents);
                }, onerror);
            }
        };



        this.getXmlFileDom = function (xmlFilePathRelativeToPackageRoot, callback, onerror) {
            self.getFileContentsFromPackage(xmlFilePathRelativeToPackageRoot, function (xmlFileContents) {
                var fileDom = self.markupParser.parseXml(xmlFileContents);
                callback(fileDom);
            }, onerror);
        };


        var _packageFullPathFromContainerXml = undefined;
        var _multipleRenditions = undefined;
        
        var getPackageFullPathFromContainerXml = function(callback, onerror) {
            if (_packageFullPathFromContainerXml) {
                callback(_packageFullPathFromContainerXml, _multipleRenditions);
                return;
            }
            
            self.getXmlFileDom('META-INF/container.xml', function(containerXmlDom) {
                
                _multipleRenditions = {};
            
                _packageFullPathFromContainerXml = getRootFile(containerXmlDom, _multipleRenditions);
                
                var cacheOpfDom = {};

                if (_multipleRenditions.renditions.length) {
                    populateCacheOpfDom(0, _multipleRenditions, cacheOpfDom, function() {
                        buildRenditionMapping(callback, _multipleRenditions, containerXmlDom, _packageFullPathFromContainerXml, cacheOpfDom);
                    });
                } else {
                    buildRenditionMapping(callback, _multipleRenditions, containerXmlDom, _packageFullPathFromContainerXml, cacheOpfDom);
                }
                
            }, onerror);
        };
        
        var getRootFile = function(containerXmlDom, multipleRenditions) {
            //console.debug(containerXmlDom.documentElement.innerHTML);
            
            console.debug("@@@@@@@@@@@@@@@@@@ getRootFile");
                
        
            //console.debug("_renditionSelectionrenditionMedia: ", _renditionSelection.renditionMedia);
            console.debug("_renditionSelection.renditionLayout: ", _renditionSelection.renditionLayout);
            console.debug("_renditionSelection.renditionLanguage: ", _renditionSelection.renditionLanguage);
            console.debug("_renditionSelection.renditionAccessMode: ", _renditionSelection.renditionAccessMode);
            
            
            var rootFiles = $('rootfile', containerXmlDom);
            //console.debug(rootFiles);
                            
            multipleRenditions.renditions = [];
            multipleRenditions.selectedIndex = -1;
        
        
            var rootFile = undefined;
            if (rootFiles.length == 1) {
                rootFile = rootFiles;
            
                var renditionMedia = rootFile.attr('rendition:media');
                var renditionLayout = rootFile.attr('rendition:layout');
                var renditionLanguage = rootFile.attr('rendition:language');
                var renditionAccessMode = rootFile.attr('rendition:accessMode');
                
                var rendition = {};
        
                rendition.Media = renditionMedia;
                rendition.Layout = renditionLayout;
                rendition.Language = renditionLanguage;
                rendition.AccessMode = renditionAccessMode;
                rendition.Label = renditionLabel;
                
                rendition.opfPath = "/" + rootFile.attr('full-path');
                console.debug("opfPath: ", rendition.opfPath);
                
                multipleRenditions.renditions.push(rendition);
                multipleRenditions.selectedIndex = 0;
            
            } else {
                for (var i = 0; i < rootFiles.length; i++) {
                    var rendition = {};
                
                    rendition.Media = undefined;
                    rendition.Layout = undefined;
                    rendition.Language = undefined;
                    rendition.AccessMode = undefined;
                    rendition.Label = undefined;
                    rendition.opfPath = undefined;
                    
                    multipleRenditions.renditions.push(rendition);
                }
                
                var selectedIndex = -1;
            
                for (var i = rootFiles.length - 1; i >= 0; i--) {
                    
                    console.debug("----- ROOT FILE #" + i);
                    
                    var rendition = multipleRenditions.renditions[i];
                    
                    var rf = $(rootFiles[i]);
                        
                    var renditionMedia = rf.attr('rendition:media');
                    var renditionLayout = rf.attr('rendition:layout');
                    var renditionLanguage = rf.attr('rendition:language');
                    var renditionAccessMode = rf.attr('rendition:accessMode');
                    
                    var renditionLabel = rf.attr('rendition:label');
                    
                    console.debug("renditionMedia: ", renditionMedia);
                    console.debug("renditionLayout: ", renditionLayout);
                    console.debug("renditionLanguage: ", renditionLanguage);
                    console.debug("renditionAccessMode: ", renditionAccessMode);
                    
                    console.debug("renditionLabel: ", renditionLabel);
                    
                    rendition.Media = renditionMedia;
                    rendition.Layout = renditionLayout;
                    rendition.Language = renditionLanguage;
                    rendition.AccessMode = renditionAccessMode;
                    rendition.Label = renditionLabel;
                    
                    rendition.opfPath = "/" + rf.attr('full-path');
                    console.debug("opfPath: ", rendition.opfPath);
                    
                    var selected = true;
                    if (renditionMedia && renditionMedia !== "" && window.matchMedia) {
                        
                        if (_mediaQueryEventCallback) {
                            _mediaQuery.removeListener(_mediaQueryEventCallback);
                            
                            _mediaQueryEventCallback = undefined;
                            _mediaQuery = undefined;
                        }
                        
                        _mediaQuery = window.matchMedia(renditionMedia);
                        
                        _mediaQueryEventCallback = function(mq) {
                            console.debug("Rendition Selection Media Query changed: " + mq.media + " (" + mq.matches + ")");
                            if (mq.matches) {
                                // noop
                            }
                            if (_renditionSelection && _renditionSelection.renditionReload) {
                                _renditionSelection.renditionReload();
                            }
                        };
                        
                        _mediaQuery.addListener(_mediaQueryEventCallback);
                        
                        if (!_mediaQuery.matches) {
                            console.debug("=== EJECTED: renditionMedia");
                            
                            selected = selected && false;
                            //continue;
                        }
                    }
console.log("######################################");
console.debug(_renditionSelection);
console.log("######################################");
                    if (_renditionSelection && (typeof _renditionSelection.renditionLayout !== "undefined") && renditionLayout && renditionLayout !== "") {
                        if (_renditionSelection.renditionLayout !== renditionLayout) {
                            console.debug("=== EJECTED: renditionLayout");
                            
                            selected = selected && false;
                            //continue;
                        }
                    }
                    
                    if (_renditionSelection && (typeof _renditionSelection.renditionLanguage !== "undefined") && renditionLanguage && renditionLanguage !== "") {
                        
                        // TODO: language tag (+ script subtag) match algorithm RFC 4647 http://www.ietf.org/rfc/rfc4647.txt
                        if (_renditionSelection.renditionLanguage !== renditionLanguage) {
                            var langTags1 = _renditionSelection.renditionLanguage.split("-");
                            var langTags2 = renditionLanguage.split("-");
                            
                            console.debug(langTags1[0]);
                            console.debug(langTags2[0]);
                            
                            if (langTags1[0] !== langTags2[0]) {                                
                                console.debug("=== EJECTED: renditionLanguage");
                                    
                                selected = selected && false;
                                //continue;
                            }
                        }
                    }
                    
                    if (_renditionSelection && (typeof _renditionSelection.renditionAccessMode !== "undefined") && renditionAccessMode && renditionAccessMode !== "") {
                        if (_renditionSelection.renditionAccessMode !== renditionAccessMode) {
                            console.debug("=== EJECTED: renditionAccessMode");
                            
                            selected = selected && false;
                            //continue;
                        }
                    }
                    
                    if (selected && !rootFile) {
                        rootFile = rf;
                        selectedIndex = i;
                        //break;
                    }
                }
                
                if (!rootFile
                    // first-time load, or app with no preferences at all
                    || (_renditionSelection && (typeof _renditionSelection.renditionAccessMode === "undefined") && (typeof _renditionSelection.renditionLanguage === "undefined") && (typeof _renditionSelection.renditionLayout === "undefined"))
                ) {
                    // fallback to index zero ... is that a valid interpretation of the EPUB3 specification??
                    // See Processing Model:
                    //http://www.idpf.org/epub/renditions/multiple/epub-multiple-renditions.html#h.4n44azuq1490
                    
                    selectedIndex = 0;
                    rootFile = $(rootFiles[selectedIndex]);
                }
                
                multipleRenditions.selectedIndex = selectedIndex;
            }
            
            var packageFullPath = rootFile.attr('full-path');
            return packageFullPath;
        };
        
        this.getPackageDom = function (callback, onerror) {
            if (_packageDom) {
                callback(_packageDom, _multipleRenditions);
            } else {
                // TODO: use jQuery's Deferred
                // Register all callbacks interested in initialized packageDom, launch its instantiation only once
                // and broadcast to all callbacks registered during the initialization once it's done:
                if (_packageDomInitializationDeferred) {
                    _packageDomInitializationDeferred.done(callback);
                } else {
                    _packageDomInitializationDeferred = $.Deferred();
                    _packageDomInitializationDeferred.done(callback);

                    getPackageFullPathFromContainerXml(function (packageFullPath, multipleRenditions) {
                                
                        _packageFullPath = packageFullPath;
                        _packageDocumentAbsoluteUrl = _resourceFetcher.resolveURI(_packageFullPath);
                        
                        console.debug("PACKAGE: ");
                        console.log(_packageFullPath);
                        console.log(_packageDocumentAbsoluteUrl);
                        
                        if (packageFullPath && packageFullPath.charAt(0) != '/') {
                            packageFullPath = '/' + packageFullPath;
                        }
                        
                        self.getXmlFileDom(packageFullPath, function (packageDom) {
                            _packageDom = packageDom;
                            _packageDomInitializationDeferred.resolve(packageDom, _multipleRenditions);
                            _packageDomInitializationDeferred = undefined;
                        })
                    }, onerror);
                }
            }
        };

        // Note that if the relativeToPackagePath parameter is in fact absolute
        // (starting with "/", already relative to the EPUB archive's base folder)
        // then the returned value is relativeToPackagePath.
        this.convertPathRelativeToPackageToRelativeToBase = function (relativeToPackagePath) {

            return new URI(relativeToPackagePath).absoluteTo(_packageFullPath).toString();
        };

        // Note that the relativeToPackagePath parameter can in fact be absolute
        // (starting with "/", already relative to the EPUB archive's base folder)
        // For example: /META-INF/
        this.relativeToPackageFetchFileContents = function(relativeToPackagePath, fetchMode, fetchCallback, errorCallback) {

            var pathRelativeToEpubRoot = decodeURIComponent(self.convertPathRelativeToPackageToRelativeToBase(relativeToPackagePath));

            console.debug("FETCHING ... " + pathRelativeToEpubRoot);

            // In case we received an absolute path, convert it to relative form or the fetch will fail:
            if (pathRelativeToEpubRoot.charAt(0) === '/') {
                pathRelativeToEpubRoot = pathRelativeToEpubRoot.substr(1);
            }

            var onerror = function() {
                
                var err = arguments ?
                    (
                        (arguments.length && (arguments[0] instanceof Error)) ?
                        arguments[0]
                        : ((arguments instanceof Error) ? arguments : undefined)
                    )
                    : undefined;
                
                // hacky! :(
                // (we need to filter these out from the console output, as they are in fact false positives)
                var optionalFetch = (pathRelativeToEpubRoot.indexOf("META-INF/com.apple.ibooks.display-options.xml") == 0)
                || (pathRelativeToEpubRoot.indexOf("META-INF/encryption.xml") == 0);
                    
                console.log("MISSING: " + pathRelativeToEpubRoot);
                    
                if (!optionalFetch) {
                    if (err) {
                        console.error(err);
                        
                        if (err.message) {
                            console.debug(err.message);
                        }
                        if (err.stack) {
                            console.log(err.stack);
                        }
                    }
                }
                
                if (errorCallback) errorCallback.apply(this, arguments);
            };

            // ZIP resource fetcher does not support absolute URLs outside of the EPUB archive
            // (e.g. MathJax.js and annotations.css)
            if (//!isExploded()
                _shouldConstructDomProgrammatically // includes isExploded() and obfuscated fonts
                &&
                new URI(relativeToPackagePath).scheme() !== '') {

                  if (fetchMode === 'blob') {

                      var xhr = new XMLHttpRequest();
                      xhr.open('GET', relativeToPackagePath, true);
                      xhr.responseType = 'arraybuffer';
                      xhr.onerror = onerror;

                      xhr.onload = function (loadEvent) {
                        var blob = new Blob([xhr.response], {
                            type: ContentTypeDiscovery.identifyContentTypeFromFileName(relativeToPackagePath)
                        });
                        fetchCallback(blob);
                      };

                      xhr.send();

                  } else if (fetchMode === 'data64uri') {
                      console.error("data64uri??");
                  } else {

                      $.ajax({
                          // encoding: "UTF-8",
                          // mimeType: "text/plain; charset=UTF-8",
                          // beforeSend: function( xhr ) {
                          //     xhr.overrideMimeType("text/plain; charset=UTF-8");
                          // },
                          isLocal: false,
                          url: relativeToPackagePath,
                          dataType: 'text', //https://api.jquery.com/jQuery.ajax/
                          async: true,
                          success: function (result) {
                              fetchCallback(result);
                          },
                          error: function (xhr, status, errorThrown) {
                              onerror(new Error(errorThrown));
                          }
                    });
                }

                return;
            }
            
            var fetchFunction = _resourceFetcher.fetchFileContentsText;
            if (fetchMode === 'blob') {
                fetchFunction = _resourceFetcher.fetchFileContentsBlob;
            } else if (fetchMode === 'data64uri') {
                console.error("data64uri??");
                fetchFunction = _resourceFetcher.fetchFileContentsData64Uri;
            }

            fetchFunction.call(_resourceFetcher, pathRelativeToEpubRoot, fetchCallback, onerror);
        };



        this.getRelativeXmlFileDom = function (filePath, callback, errorCallback) {
            self.getXmlFileDom(self.convertPathRelativeToPackageToRelativeToBase(filePath), callback, errorCallback);
        };

        // TODO: this function seems unused, and the callback parameter seems to be onError 
        function readEncriptionData(callback) {
            self.getXmlFileDom('/META-INF/encryption.xml', function (encryptionDom, error) {

                if(error) {
                    
                    _encryptionHandler = new EncryptionHandler(undefined);
                    callback();
                }
                else {

                    var encryptions = [];


                    var encryptedData = $('EncryptedData', encryptionDom);
                    encryptedData.each(function (index, encryptedData) {
                        var encryptionAlgorithm = $('EncryptionMethod', encryptedData).first().attr('Algorithm');

                        encryptions.push({algorithm: encryptionAlgorithm});

                        // For some reason, jQuery selector "" against XML DOM sometimes doesn't match properly
                        var cipherReference = $('CipherReference', encryptedData);
                        cipherReference.each(function (index, CipherReference) {
                            var cipherReferenceURI = $(CipherReference).attr('URI');
                            console.log('Encryption/obfuscation algorithm ' + encryptionAlgorithm + ' specified for ' +
                                cipherReferenceURI);
                            encryptions[cipherReferenceURI] = encryptionAlgorithm;
                        });
                    });
                }

            });
        }

        // Currently needed for deobfuscating fonts
        this.setPackageMetadata = function(packageMetadata, settingFinishedCallback) {

            self.getXmlFileDom('/META-INF/encryption.xml', function (encryptionDom) {

                var encryptionData = EncryptionHandler.CreateEncryptionData(packageMetadata.id, encryptionDom);

                _encryptionHandler = new EncryptionHandler(encryptionData);

                if (_encryptionHandler.isEncryptionSpecified()) {
                    // EPUBs that use encryption for any resources should be fetched in a programmatical manner:
                    _shouldConstructDomProgrammatically = true;
                }

                settingFinishedCallback();


            }, function(error){

                _encryptionHandler = new EncryptionHandler(undefined);

                settingFinishedCallback();
            });
        };

        this.getDecryptionFunctionForRelativePath = function(pathRelativeToRoot) {
            return _encryptionHandler.getDecryptionFunctionForRelativePath(pathRelativeToRoot);
        }
    };

    return PublicationFetcher

});
