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

define(['jquery', 'underscore', 'URIjs'],
    function ($, _, URI) {

        // Readium2 counterpart of PackageDocument
        var WebpubDocument = function (packageDocumentURL, resourceFetcher,
                                       metadata, spine, manifest, webpubJson) {

            var _page_prog_dir;

            this.manifest = manifest;
            this.webpubJson = webpubJson;

            this.getSharedJsPackageData = function () {

                var packageDocRoot = packageDocumentURL.substr(0, packageDocumentURL.lastIndexOf("/"));
                return {
                    rootUrl: packageDocRoot,
                    rendition_viewport: metadata.rendition_viewport,
                    rendition_layout: metadata.rendition_layout,
                    rendition_orientation: metadata.rendition_orientation,
                    rendition_flow: metadata.rendition_flow,
                    rendition_spread: metadata.rendition_spread,
                    media_overlay: metadata.media_overlay,
                    spine: {
                        direction: this.getPageProgressionDirection(),
                        items: spine
                    }
                };
            };

            /**
             * Get spine item data in readium-shared-js accepted format.
             * @param spineIndex the index of the item within the spine
             * @returns Spine item data in readium-shared-js accepted format.
             */
            this.getSpineItem = function (spineIndex) {
                var spineItem = spine[spineIndex];
                return spineItem;
            };

            this.setPageProgressionDirection = function (page_prog_dir) {
                _page_prog_dir = page_prog_dir;
            };

            this.getPageProgressionDirection = function () {
                if (_page_prog_dir === "rtl") {
                    return "rtl";
                }
                else if (_page_prog_dir === "default") {
                    return "default";
                }
                else {
                    return "ltr";
                }
            };

            this.spineLength = function () {
                return spine.length;
            };

            this.getMetadata = function () {
                return metadata;
            };


            this.getTocItem = function () {

                var item = manifest.getNavItem();
                if (item) {
                    return item;
                }

                var spine_id = metadata.ncx;
                if (spine_id && spine_id.length > 0) {
                    return manifest.getManifestItemByIdref(spine_id);
                }

                return null;
            };

            this.getToc = function () {
                var item = this.getTocItem();
                if (item) {
                    return item.href;
                }
                return null;
            };

            this.getTocText = function (callback) {
                var toc = this.getToc();
                if (!toc) {
                    console.error("No TOC?!");
                    callback(undefined);
                    return;
                }

                resourceFetcher.relativeToPackageFetchFileContents(toc, 'text', function (tocDocumentText) {
                    callback(tocDocumentText)
                }, function (err) {
                    console.error('ERROR fetching TOC from [' + toc + ']:');
                    console.error(err);
                    callback(undefined);
                });
            };

            this.getTocDom = function (callback) {

                this.getTocText(function (tocText) {
                    if (typeof tocText === 'string') {
                        var tocDom = (new DOMParser()).parseFromString(tocText, "text/xml");
                        callback(tocDom);
                    } else {
                        callback(undefined);
                    }
                });
            };

            // Used in EpubReader (readium-js-viewer)
            // we already have "toc" collection in WebPub manifest, so we just stick it into 
            // html ordered list, similar to what was done with epub2 NCX
            // - example of toc item
            // {
            //     "href": "pr01.xhtml",
            //     "title": "Preface",
            //     "children": []
            // },
            this.generateTocListDOM = function (callback) {

                // this is the beginning of TOC DOM
                var $ol = $("<ol></ol>");
                this.webpubJson.toc.forEach(function (tocItem) {
                    addTocItem(tocItem, $ol);
                });

                callback($ol);
                return;
            };

            // Recursive function that adds toc sub items for the current toc item
            function addTocItem(tocItem, $ol) {

                // add current toc item to the TOC DOM
                var $navPointLi = $('<li class="nav-elem"></li>').append(
                    $('<a></a>', {href: tocItem.href, text: tocItem.title})
                );
                $ol.append($navPointLi);

                // deal with children if they are present
                if (tocItem.children && tocItem.children.length > 0) {
                    var $newLi = $("<li></li>");
                    var $newOl = $("<ol></ol>");
                    tocItem.children.forEach(function (subItem) {
                        $newOl.append(addTocItem(subItem, $newOl));
                    });
                    $newLi.append($newOl);
                    $ol.append($newLi);
                }
            }
        };

        return WebpubDocument;
    });
