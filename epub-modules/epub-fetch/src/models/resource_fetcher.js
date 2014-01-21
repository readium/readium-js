define(['require', 'module', 'jquery', 'URIjs', './markup_parser', './discover_content_type', './plain_fetcher',
    './zip_fetcher', './processed_items_registry', './resource_cache'],
    function (require, module, $, URI, MarkupParser, ContentTypeDiscovery, PlainExplodedFetcher, ZipFetcher,
              ProcessedItemsRegistry, ResourceCache) {
        console.log('resource_resolver module id: ' + module.id);


    var ResourceFetcher = function(rootUrl, libDir) {

        ResourceFetcher.contentTypePackageReadStrategyMap = {
            'application/oebps-package+xml': 'exploded',
            'application/epub+zip': 'zipped',
            'application/zip': 'zipped'
        };

        var _markupParser = new MarkupParser();
        var _isExploded;
        var _dataFetcher;
        
        this.initialize =  function(callback) {

            _isExploded = isExploded();

            createDataFetcher(_isExploded, function(datafetcher){

                _dataFetcher = datafetcher;
                callback();

            });
        };

        

        

        // INTERNAL FUNCTIONS

        function isExploded() {

            var ext = ".epub";
            return rootUrl.indexOf(ext, rootUrl.length - ext.length) === -1;
        }

        function createDataFetcher(isExploded, callback) {

            if(isExploded) {
                console.log('using new PlainExplodedFetcher');
                var plainFetcher =  new PlainExplodedFetcher(rootUrl);
                plainFetcher.initialize(function(){
                    callback(plainFetcher);
                });
                return;
            }
            else {
                console.log('using new ZipFetcher');
                callback(new ZipFetcher(rootUrl, libDir));
            }
        }

        function fetchResourceForElement(resolvedElem, refAttrOrigVal, refAttr, contentDocumentURI, fetchMode, resolutionDeferreds, onerror, resourceDataPreprocessing) {
            var uriRelativeToPackageDocument = (new URI(refAttrOrigVal)).absoluteTo(contentDocumentURI).toString();
            var resolutionDeferred = $.Deferred();
            resolutionDeferreds.push(resolutionDeferred);

            _dataFetcher.relativeToPackageFetchFileContents(uriRelativeToPackageDocument, fetchMode, function (resourceData) {

                // Generate a function to replace element's resource URL with URL of fetched data.
                // The function will either be called directly, immediately (if no preprocessing of resourceData is in effect)
                // or indirectly, later after resourceData preprocessing finishes:
                var replaceResourceURL = function (finalResourceData) {
                    // Creating an object URL requires a Blob object, so resource data fetched in text mode needs to be wrapped in a Blob:
                    if (fetchMode === 'text') {
                        var textResourceContentType = ContentTypeDiscovery.identifyContentTypeFromFileName(uriRelativeToPackageDocument);
                        var declaredType = $(resolvedElem).attr('type');
                        if (declaredType) {
                            textResourceContentType = declaredType;
                        }
                        finalResourceData = new Blob([finalResourceData], {type: textResourceContentType});
                    }
                    var resourceObjectURL = window.URL.createObjectURL(finalResourceData);
                    // TODO: take care of releasing object URLs when no longer needed
                    $(resolvedElem).attr(refAttr, resourceObjectURL);
                    // Store original refAttrVal in a special attribute to provide access to the original href:
                    $(resolvedElem).data('epubZipOrigHref', refAttrOrigVal);
                    resolutionDeferred.resolve();
                };

                if (resourceDataPreprocessing) {
                    var ownerDocument;
                    if (resolvedElem.ownerDocument) {
                        ownerDocument = resolvedElem.ownerDocument;
                    }
                    if (resolvedElem[0] && resolvedElem[0].ownerDocument) {
                        ownerDocument = resolvedElem[0].ownerDocument;
                    }
                    resourceDataPreprocessing(resourceData, uriRelativeToPackageDocument, ownerDocument,
                        replaceResourceURL);
                } else {
                    replaceResourceURL(resourceData);
                }
            }, onerror);
        }

        // FIXME: function has side effects on globalCssResourcesHash, localStyleSheetCssResourcesHash
        function fetchResourceForCssUrlMatch(cssUrlMatch, cssResourceDownloadDeferreds,
                                             styleSheetUriRelativeToPackageDocument, globalCssResourcesCache,
                                             stylesheetCssResourceUrlsMap) {
            var origMatchedUrlString = cssUrlMatch[0];
            var extractedUrl = cssUrlMatch[2];
            var resourceUriRelativeToPackageDocument = (new URI(extractedUrl)).absoluteTo(styleSheetUriRelativeToPackageDocument).toString();

            var cachedResource = globalCssResourcesCache.getResourceURL(resourceUriRelativeToPackageDocument);
            if (cachedResource) {
                stylesheetCssResourceUrlsMap[origMatchedUrlString] = cachedResource;
            } else {
                var cssUrlFetchDeferred = $.Deferred();
                cssResourceDownloadDeferreds.push(cssUrlFetchDeferred);

                _dataFetcher.relativeToPackageFetchFileContents(resourceUriRelativeToPackageDocument, 'blob',
                    function (resourceDataBlob) {
                        var resourceObjectURL = window.URL.createObjectURL(resourceDataBlob);
                        stylesheetCssResourceUrlsMap[origMatchedUrlString] = resourceObjectURL;
                        globalCssResourcesCache.putResourceURL(resourceUriRelativeToPackageDocument, resourceObjectURL);
                        cssUrlFetchDeferred.resolve();
                    },
                    function (error) {
                        if (error) {
                            if (error.message) {
                                console.error(error.message);
                            }
                            if (error.stack) {
                                console.error(error.stack);
                            }
                        }
                        cssUrlFetchDeferred.resolve();
                    }
                );
            }
        }

        function preprocessCssStyleSheetData(styleSheetResourceData, styleSheetUriRelativeToPackageDocument,
                                             contextDocument, callback) {
            var cssUrlRegexp = /[Uu][Rr][Ll]\(\s*(['"]?)([^']+)\1\s*\)/g;
            var documentCssResourcesCache = obtainCssResourcesCache(contextDocument);
            var stylesheetCssResourceUrlsMap = {};
            var cssResourceDownloadDeferreds = [];

            var cssUrlMatch = cssUrlRegexp.exec(styleSheetResourceData);
            // TODO: extract all "src:url()", fetch and replace with object URLs
            while (cssUrlMatch != null) {
                fetchResourceForCssUrlMatch(cssUrlMatch, cssResourceDownloadDeferreds,
                    styleSheetUriRelativeToPackageDocument, documentCssResourcesCache, stylesheetCssResourceUrlsMap);
                cssUrlMatch = cssUrlRegexp.exec(styleSheetResourceData);
            }

            if (cssResourceDownloadDeferreds.length > 0) {
                $.when.apply($, cssResourceDownloadDeferreds).done(function () {
                    for (var origMatchedUrlString in stylesheetCssResourceUrlsMap) {
                        var resourceObjectURL = stylesheetCssResourceUrlsMap[origMatchedUrlString];
                        styleSheetResourceData =
                            styleSheetResourceData.replace(origMatchedUrlString, "url('" + resourceObjectURL + "')",
                                'g');
                    }
                    callback(styleSheetResourceData);
                });
            } else {
                callback(styleSheetResourceData);
            }
        }

        function resolveResourceElements(elemName, refAttr, fetchMode, contentDocumentDom, contentDocumentURI,
                                         resolutionDeferreds, onerror, resourceDataPreprocessing) {

            var resolvedElems = $(elemName + '[' + refAttr + ']', contentDocumentDom);

            resolvedElems.each(function (index, resolvedElem) {
                var refAttrOrigVal = $(resolvedElem).attr(refAttr);
                var refAttrUri = new URI(refAttrOrigVal);

                if (refAttrUri.scheme() === '') {
                    // Relative URI, fetch from packed EPUB archive:

                    fetchResourceForElement(resolvedElem, refAttrOrigVal, refAttr, contentDocumentURI, fetchMode,
                        resolutionDeferreds, onerror, resourceDataPreprocessing);
                }
            });
        }

        function resolveDocumentImages(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror) {
            resolveResourceElements('img', 'src', 'blob', contentDocumentDom, contentDocumentURI, resolutionDeferreds,
                onerror);
        }

        function resolveDocumentLinkStylesheets(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror) {
            resolveResourceElements('link', 'href', 'text', contentDocumentDom, contentDocumentURI, resolutionDeferreds,
                onerror, preprocessCssStyleSheetData);
        }

        /**
         * Obtain the reference to the registry that holds hrefs of already imported stylesheets - needed for keeping track
         * of which stylesheets have been loaded already. The registry is attached to the content document body.
         *
         * @param {Object} contentDocumentDom The content document whose body element has/will have the hashmap attached to.
         * @return {Object} The registry with hrefs as keys and an isProcessed() method returning true for stylesheets that have been loaded.
         */
        function obtainImportedCssHrefsRegistry(contentDocumentDom) {
            // The hash of already loaded/imported stylesheet hrefs is being tracked globally on the content document level:
            var alreadyImportedStylesheetHrefsRegistry = $(contentDocumentDom.body).data('epubImportedCssHrefsReg');
            if (typeof alreadyImportedStylesheetHrefsRegistry === 'undefined') {
                // first use, initialize:
                alreadyImportedStylesheetHrefsRegistry = new ProcessedItemsRegistry();
                $(contentDocumentDom.body).data('epubImportedCssHrefsReg', alreadyImportedStylesheetHrefsRegistry);
            }
            return alreadyImportedStylesheetHrefsRegistry;
        }

        /**
         * Obtain the reference to the ResourceCache object that caches already fetched resources from CSS urls - used so that
         * the given resource referenced by URL from a CSS rule is fetched only once. The cache is attached to the content document body.
         * // TODO: use it on global EPUB book level to share caching of resources referenced multiple times within the book.
         *
         * @param {Object} contentDocumentDom The content document whose body element has/will have the cache attached to.
         * @return {Object} The cache with hrefs relative to the package document (.opf) as keys
         * and browser object URL as values for fetched resources.
         */
        function obtainCssResourcesCache(contentDocumentDom) {
            // The hash of already loaded/imported stylesheet hrefs is being tracked globally on the content document level:
            var cssResourcesCache = $(contentDocumentDom.body).data('epubCssResourcesCache');
            if (typeof cssResourcesCache === 'undefined') {
                // first use, initialize:
                cssResourcesCache = new ResourceCache;
                $(contentDocumentDom.body).data('epubCssResourcesCache', cssResourcesCache);
            }
            return cssResourcesCache;
        }

        /**
         * Get stored original href (if present) from a stylesheet that has possibly been programmatically fetched from zipped EPUB
         *
         * @param {Object} styleSheet The stylesheet DOM object that can possibly have its original href stored in the special data property
         * @return {String} Either null or the original stored href of the stylesheet as present in the document's source (before being
         * programmatically fetched from zipped EPUB, which substitutes href with a blob object URL)
         */
        function getOrigHrefFromStyleSheet(styleSheet) {
            return $(styleSheet.ownerNode).data('epubZipOrigHref');
        }

        function installStylesheetLoadHandlers(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror) {
            var styleSheetLinkElems = $("link[rel~='stylesheet']", contentDocumentDom);
            styleSheetLinkElems.load(function (stylesheetLoadEvent) {
                findRelativeUnfetchedCssImportRules(stylesheetLoadEvent, contentDocumentURI, resolutionDeferreds,
                    onerror)
            });
        }

        function findRelativeUnfetchedCssImportRules(styleSheetLoadEvent, contentDocumentURI, resolutionDeferreds, onerror) {
            var contentDocumentDom = styleSheetLoadEvent.currentTarget.ownerDocument;
            var alreadyImportedStylesheetHrefsRegistry = obtainImportedCssHrefsRegistry(contentDocumentDom);
            var allRelativeCssImportRulesHash = {};
            var styleSheet = styleSheetLoadEvent.currentTarget.sheet;
            // Any processed stylesheet element should be loaded by the resolution mechanism so we have to
            // prevent any duplicate attempts to load it if referenced in an @import rule. We add stylesheet's URLs
            // (both current and pre-resolution) to the already fetched hash so they don't get queued for fetching again:
            alreadyImportedStylesheetHrefsRegistry.markProcessed(styleSheet.href);
            var styleSheetOwnerNodeOrigHref = getOrigHrefFromStyleSheet(styleSheet);
            // TODO: test the behaviour on stylesheets with non-relative href (residing outside the zipped EPUB)
            if (styleSheetOwnerNodeOrigHref) {
                alreadyImportedStylesheetHrefsRegistry.markProcessed(styleSheetOwnerNodeOrigHref);
            }

            var cssRules = styleSheet.cssRules;
            var relativeCssImportRules = $.each(cssRules, function (cssRuleIdx, cssRule) {
                // Cannot compare by references, as CSSImportRule symbol in the global execution context
                // refers to a different prototype instance than the cssRule prototype
                // because of different origin (renderer's iframe.contentWindow vs global window?)
                if (cssRule.constructor.name === 'CSSImportRule') {
                    var ruleHrefUri = new URI(cssRule.href);
                    var isRuleHrefUriRelative = ruleHrefUri.scheme() === '';
                    if (isRuleHrefUriRelative) {
                        var isRuleAlreadyImported = alreadyImportedStylesheetHrefsRegistry.isProcessed(cssRule.href);
                        if (!isRuleAlreadyImported) {
                            // Queue this rule for import:
                            allRelativeCssImportRulesHash[cssRule.href] = cssRule;
                        }
                    }
                }
            });

            var allRelativeCssImportRules = [];
            var hashKeys = Object.keys(allRelativeCssImportRulesHash);
            hashKeys.forEach(function (key) {
                allRelativeCssImportRules.push(allRelativeCssImportRulesHash[key]);
            });

            fetchCssImportRules(allRelativeCssImportRules, contentDocumentURI, resolutionDeferreds, onerror);
        }

        function fetchCssImportRules(unfetchedCssImportRules, contentDocumentURI, resolutionDeferreds, onerror) {
            var alreadyImportedStylesheetHrefsRegistry;
            unfetchedCssImportRules.forEach(function (unfetchedCssImportRule) {
                var parentStyleSheet = unfetchedCssImportRule.parentStyleSheet;
                var contentDocumentDom = parentStyleSheet.ownerNode.ownerDocument;
                if (!alreadyImportedStylesheetHrefsRegistry) {
                    alreadyImportedStylesheetHrefsRegistry = obtainImportedCssHrefsRegistry(contentDocumentDom);
                }
                var ruleHref = unfetchedCssImportRule.href;
                var isRuleAlreadyImported = alreadyImportedStylesheetHrefsRegistry.isProcessed(ruleHref);
                if (!isRuleAlreadyImported) {
                    var baseStyleSheetHref = getOrigHrefFromStyleSheet(parentStyleSheet);
                    if (!baseStyleSheetHref) {
                        baseStyleSheetHref = parentStyleSheet.href;
                    }

                    var cssFetchHref = (new URI(ruleHref)).absoluteTo(baseStyleSheetHref).toString();
                    var appendedStyleSheetLink = $('<link />', contentDocumentDom);
                    appendedStyleSheetLink.attr({
                        type: "text/css",
                        rel: "stylesheet",
                        href: cssFetchHref
                    });
                    appendedStyleSheetLink.load(function (stylesheetLoadEvent) {
                        // TODO: test whether recursion works for nested @import rules with arbitrary indirection depth.
                        findRelativeUnfetchedCssImportRules(stylesheetLoadEvent, contentDocumentURI,
                            resolutionDeferreds, onerror);
                    });

                    fetchResourceForElement(appendedStyleSheetLink, appendedStyleSheetLink.attr('href'), 'href',
                        contentDocumentURI, 'text', resolutionDeferreds, onerror, preprocessCssStyleSheetData);

                    var contentDocumentHeadElement = $('head', contentDocumentDom);
                    contentDocumentHeadElement.append(appendedStyleSheetLink);
                }
            });
        }

        // PUBLIC API

        this.isPackageExploded = function (){
            return _isExploded;
        };

        this.getPackageUrl = function() {
            return _dataFetcher.getPackageUrl();
        };


        this.resolveInternalPackageResources = function(contentDocumentURI, contentDocumentType, contentDocumentText,
                                                         resolvedDocumentCallback, onerror) {

            var contentDocumentDom = _markupParser.parseMarkup(contentDocumentText, contentDocumentType);

            var resolutionDeferreds = [];

            resolveDocumentImages(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror);
            resolveDocumentLinkStylesheets(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror);
            installStylesheetLoadHandlers(contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror);

            $.when.apply($, resolutionDeferreds).done(function () {
                resolvedDocumentCallback(contentDocumentDom);
            });

        };

        this.relativeToPackageFetchFileContents = function (relativePath, fetchMode, fetchCallback, onerror) {
            _dataFetcher.relativeToPackageFetchFileContents(relativePath, fetchMode, fetchCallback, onerror)
        };

        this.getRelativeXmlFileDom = function (filePath, callback, errorCallback) {
            _dataFetcher.getRelativeXmlFileDom(filePath, callback, errorCallback);
        };

        this.getPackageDom = function (callback, onerror) {
            return _dataFetcher.getPackageDom(callback, onerror);
        };

        this.setPackageJson = function(jsonMetadata) {
            _dataFetcher.setPackageJson(jsonMetadata);
        };

    };

    return ResourceFetcher

});