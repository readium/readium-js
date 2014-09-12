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

define(
    ['require', 'module', 'jquery', 'underscore', 'URIjs', './discover_content_type'],
    function (require, module, $, _, URI, ContentTypeDiscovery) {


        var ContentDocumentFetcher = function (publicationFetcher, spineItem, loadedDocumentUri, publicationResourcesCache) {

            var self = this;

            var _contentDocumentPathRelativeToPackage = spineItem.href;
            var _publicationFetcher = publicationFetcher;
            var _contentDocumentText;
            var _srcMediaType = spineItem.media_type;
            var _contentDocumentDom;
            var _publicationResourcesCache = publicationResourcesCache;

            // PUBLIC API

            this.fetchContentDocumentAndResolveDom = function (contentDocumentResolvedCallback, errorCallback) {
                _publicationFetcher.relativeToPackageFetchFileContents(_contentDocumentPathRelativeToPackage, 'text',
                    function (contentDocumentText) {
                        _contentDocumentText = contentDocumentText;
                        self.resolveInternalPackageResources(contentDocumentResolvedCallback, errorCallback);
                    }, errorCallback
                );
            };

            this.resolveInternalPackageResources = function (resolvedDocumentCallback, onerror) {

                _contentDocumentDom = _publicationFetcher.markupParser.parseMarkup(_contentDocumentText, _srcMediaType);
                setBaseUri(_contentDocumentDom, loadedDocumentUri);

                var resolutionDeferreds = [];

                if (_publicationFetcher.shouldFetchMediaAssetsProgrammatically()) {
                    resolveDocumentImages(resolutionDeferreds, onerror);
                    resolveDocumentAudios(resolutionDeferreds, onerror);
                    resolveDocumentVideos(resolutionDeferreds, onerror);
                }
                // TODO: recursive fetching, parsing and DOM construction of documents in IFRAMEs,
                // with CSS preprocessing and obfuscated font handling
                resolveDocumentIframes(resolutionDeferreds, onerror);
                // TODO: resolution (e.g. using DOM mutation events) of scripts loaded dynamically by scripts
                resolveDocumentScripts(resolutionDeferreds, onerror);
                resolveDocumentLinkStylesheets(resolutionDeferreds, onerror);
                resolveDocumentEmbeddedStylesheets(resolutionDeferreds, onerror);

                $.when.apply($, resolutionDeferreds).done(function () {
                    resolvedDocumentCallback(_contentDocumentDom);
                });

            };

            // INTERNAL FUNCTIONS

            function setBaseUri(documentDom, baseURI) {
                var baseElem = documentDom.getElementsByTagName('base')[0];
                if (!baseElem) {
                    baseElem = documentDom.createElement('base');

                    var anchor = documentDom.getElementsByTagName('head')[0];
                    anchor.insertBefore(baseElem, anchor.childNodes[0]);
                }
                baseElem.setAttribute('href', baseURI);
            }

            function _handleError(err) {
                if (err) {
                    if (err.message) {
                        console.error(err.message);
                    }
                    if (err.stack) {
                        console.error(err.stack);
                    }
                }
                console.error(err);
            }

            function fetchResourceForElement(resolvedElem, refAttrOrigVal, refAttr, fetchMode, resolutionDeferreds,
                                             onerror, resourceDataPreprocessing) {
                var resourceUriRelativeToPackageDocument = (new URI(refAttrOrigVal)).absoluteTo(_contentDocumentPathRelativeToPackage).toString();

                var cachedResourceUrl = _publicationResourcesCache.getResourceURL(resourceUriRelativeToPackageDocument);

                function replaceRefAttrInElem(newResourceUrl) {
                    // Store original refAttrVal in a special attribute to provide access to the original href:
                    $(resolvedElem).data('epubZipOrigHref', refAttrOrigVal);
                    $(resolvedElem).attr(refAttr, newResourceUrl);
                }

                if (cachedResourceUrl) {
                    replaceRefAttrInElem(cachedResourceUrl);
                } else {
                    var resolutionDeferred = $.Deferred();
                    resolutionDeferreds.push(resolutionDeferred);

                    _publicationFetcher.relativeToPackageFetchFileContents(resourceUriRelativeToPackageDocument,
                        fetchMode,
                        function (resourceData) {

                            // Generate a function to replace element's resource URL with URL of fetched data.
                            // The function will either be called directly, immediately (if no preprocessing of resourceData is in effect)
                            // or indirectly, later after resourceData preprocessing finishes:
                            var replaceResourceURL = function (finalResourceData) {
                                // Creating an object URL requires a Blob object, so resource data fetched in text mode needs to be wrapped in a Blob:
                                if (fetchMode === 'text') {
                                    var textResourceContentType = ContentTypeDiscovery.identifyContentTypeFromFileName(resourceUriRelativeToPackageDocument);
                                    var declaredType = $(resolvedElem).attr('type');
                                    if (declaredType) {
                                        textResourceContentType = declaredType;
                                    }
                                    finalResourceData = new Blob([finalResourceData], {type: textResourceContentType});
                                }
                                //noinspection JSUnresolvedVariable,JSUnresolvedFunction
                                var resourceObjectURL = window.URL.createObjectURL(finalResourceData);
                                _publicationResourcesCache.putResourceURL(resourceUriRelativeToPackageDocument,
                                    resourceObjectURL);
                                // TODO: take care of releasing object URLs when no longer needed
                                replaceRefAttrInElem(resourceObjectURL);
                                resolutionDeferred.resolve();
                            };

                            if (resourceDataPreprocessing) {
                                resourceDataPreprocessing(resourceData, resourceUriRelativeToPackageDocument,
                                    replaceResourceURL);
                            } else {
                                replaceResourceURL(resourceData);
                            }
                        }, onerror);
                }
            }

            function fetchResourceForCssUrlMatch(cssUrlMatch, cssResourceDownloadDeferreds,
                                                 styleSheetUriRelativeToPackageDocument, stylesheetCssResourceUrlsMap,
                                                 isStyleSheetResource) {
                var origMatchedUrlString = cssUrlMatch[0];

                var extractedUrlCandidates = cssUrlMatch.slice(2);
                var extractedUrl = _.find(extractedUrlCandidates, function(matchGroup){ return typeof matchGroup !== 'undefined' });

                var extractedUri = new URI(extractedUrl);
                var isCssUrlRelative = extractedUri.scheme() === '';
                if (!isCssUrlRelative) {
                    // Absolute URLs don't need programmatic fetching
                    return;
                }
                var resourceUriRelativeToPackageDocument = (new URI(extractedUrl)).absoluteTo(styleSheetUriRelativeToPackageDocument).toString();

                var cachedResourceURL = _publicationResourcesCache.getResourceURL(resourceUriRelativeToPackageDocument);


                if (cachedResourceURL) {
                    stylesheetCssResourceUrlsMap[origMatchedUrlString] = {
                        isStyleSheetResource: isStyleSheetResource,
                        resourceObjectURL: cachedResourceURL
                    };
                } else {
                    var cssUrlFetchDeferred = $.Deferred();
                    cssResourceDownloadDeferreds.push(cssUrlFetchDeferred);

                    var processedBlobCallback = function (resourceDataBlob) {
                        //noinspection JSUnresolvedVariable,JSUnresolvedFunction
                        var resourceObjectURL = window.URL.createObjectURL(resourceDataBlob);
                        stylesheetCssResourceUrlsMap[origMatchedUrlString] = {
                            isStyleSheetResource: isStyleSheetResource,
                            resourceObjectURL: resourceObjectURL
                        };
                        _publicationResourcesCache.putResourceURL(resourceUriRelativeToPackageDocument, resourceObjectURL);
                        cssUrlFetchDeferred.resolve();
                    };
                    var fetchErrorCallback = function (error) {
                        _handleError(error);
                        cssUrlFetchDeferred.resolve();
                    };

                    var fetchMode;
                    var fetchCallback;
                    if (isStyleSheetResource) {
                        // TODO: test whether recursion works for nested @import rules with arbitrary indirection depth.
                        fetchMode = 'text';
                        fetchCallback = function (styleSheetResourceData) {
                            preprocessCssStyleSheetData(styleSheetResourceData, resourceUriRelativeToPackageDocument,
                                function (preprocessedStyleSheetData) {
                                    var resourceDataBlob = new Blob([preprocessedStyleSheetData], {type: 'text/css'});
                                    processedBlobCallback(resourceDataBlob);
                                })
                        }
                    } else {
                        fetchMode = 'blob';
                        fetchCallback = processedBlobCallback;
                    }

                    _publicationFetcher.relativeToPackageFetchFileContents(resourceUriRelativeToPackageDocument,
                        fetchMode,
                        fetchCallback, fetchErrorCallback);
                }
            }

            function preprocessCssStyleSheetData(styleSheetResourceData, styleSheetUriRelativeToPackageDocument,
                                                 callback) {
                var cssUrlRegexp = /[Uu][Rr][Ll]\(\s*([']([^']+)[']|["]([^"]+)["]|([^)]+))\s*\)/g;
                var nonUrlCssImportRegexp = /@[Ii][Mm][Pp][Oo][Rr][Tt]\s*('([^']+)'|"([^"]+)")/g;
                var stylesheetCssResourceUrlsMap = {};
                var cssResourceDownloadDeferreds = [];
                // Go through the stylesheet text using all regexps and process according to those regexp matches, if any:
                [nonUrlCssImportRegexp, cssUrlRegexp].forEach(function (processingRegexp) {
                    // extract all URL references in the CSS sheet,
                    var cssUrlMatch = processingRegexp.exec(styleSheetResourceData);
                    while (cssUrlMatch != null) {
                        // then fetch and replace them with corresponding object URLs:
                        var isStyleSheetResource = false;
                        // Special handling of @import-ed stylesheet files - recursive preprocessing:
                        // TODO: will not properly handle @import url(...):
                        if (processingRegexp == nonUrlCssImportRegexp) {
                            // This resource URL points to an @import-ed CSS stylesheet file. Need to preprocess its text
                            // after fetching but before making an object URL of it:
                            isStyleSheetResource = true;
                        }
                        fetchResourceForCssUrlMatch(cssUrlMatch, cssResourceDownloadDeferreds,
                            styleSheetUriRelativeToPackageDocument, stylesheetCssResourceUrlsMap, isStyleSheetResource);
                        cssUrlMatch = processingRegexp.exec(styleSheetResourceData);
                    }

                });

                if (cssResourceDownloadDeferreds.length > 0) {
                    $.when.apply($, cssResourceDownloadDeferreds).done(function () {
                        for (var origMatchedUrlString in stylesheetCssResourceUrlsMap) {
                            var processedResourceDescriptor = stylesheetCssResourceUrlsMap[origMatchedUrlString];


                            var processedUrlString;
                            if (processedResourceDescriptor.isStyleSheetResource) {
                                processedUrlString = '@import "' + processedResourceDescriptor.resourceObjectURL + '"';
                            } else {
                                processedUrlString = "url('" + processedResourceDescriptor.resourceObjectURL + "')";
                            }
                            var origMatchedUrlStringEscaped = origMatchedUrlString.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
                                "\\$&");
                            var origMatchedUrlStringRegExp = new RegExp(origMatchedUrlStringEscaped, 'g');
                            //noinspection JSCheckFunctionSignatures
                            styleSheetResourceData =
                                styleSheetResourceData.replace(origMatchedUrlStringRegExp, processedUrlString, 'g');

                        }
                        callback(styleSheetResourceData);
                    });
                } else {
                    callback(styleSheetResourceData);
                }
            }


            function resolveResourceElements(elemName, refAttr, fetchMode, resolutionDeferreds, onerror,
                                             resourceDataPreprocessing) {

                var resolvedElems = $(elemName + '[' + refAttr + ']', _contentDocumentDom);

                resolvedElems.each(function (index, resolvedElem) {
                    var refAttrOrigVal = $(resolvedElem).attr(refAttr);
                    var refAttrUri = new URI(refAttrOrigVal);

                    if (refAttrUri.scheme() === '') {
                        // Relative URI, fetch from packed EPUB archive:

                        fetchResourceForElement(resolvedElem, refAttrOrigVal, refAttr, fetchMode, resolutionDeferreds,
                            onerror, resourceDataPreprocessing);
                    }
                });
            }

            function resolveDocumentImages(resolutionDeferreds, onerror) {
                resolveResourceElements('img', 'src', 'blob', resolutionDeferreds, onerror);
            }

            function resolveDocumentAudios(resolutionDeferreds, onerror) {
                resolveResourceElements('audio', 'src', 'blob', resolutionDeferreds, onerror);
            }

            function resolveDocumentVideos(resolutionDeferreds, onerror) {
                resolveResourceElements('video', 'src', 'blob', resolutionDeferreds, onerror);
                resolveResourceElements('video', 'poster', 'blob', resolutionDeferreds, onerror);
            }

            function resolveDocumentScripts(resolutionDeferreds, onerror) {
                resolveResourceElements('script', 'src', 'blob', resolutionDeferreds, onerror);
            }

            function resolveDocumentIframes(resolutionDeferreds, onerror) {
                resolveResourceElements('iframe', 'src', 'blob', resolutionDeferreds, onerror);
            }

            function resolveDocumentLinkStylesheets(resolutionDeferreds, onerror) {
                resolveResourceElements('link', 'href', 'text', resolutionDeferreds, onerror,
                    preprocessCssStyleSheetData);
            }

            function resolveDocumentEmbeddedStylesheets(resolutionDeferreds, onerror) {
                var resolvedElems = $('style', _contentDocumentDom);
                resolvedElems.each(function (index, resolvedElem) {
                    var resolutionDeferred = $.Deferred();
                    resolutionDeferreds.push(resolutionDeferred);
                    var styleSheetData = $(resolvedElem).text();
                    preprocessCssStyleSheetData(styleSheetData, _contentDocumentPathRelativeToPackage,
                        function (resolvedStylesheetData) {
                            $(resolvedElem).text(resolvedStylesheetData);
                            resolutionDeferred.resolve();
                        });
                });
            }

        };

        return ContentDocumentFetcher;

    }
);
