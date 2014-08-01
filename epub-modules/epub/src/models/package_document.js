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

define(['require', 'module', 'jquery', 'underscore', 'backbone', 'URIjs'],
    function (require, module, $, _, Backbone, URI) {

    // Description: This model provides an interface for navigating an EPUB's package document
    var PackageDocument = function(packageDocumentURL, resourceFetcher, metadata, spine, manifest) {

        var _page_prog_dir;

        this.manifest = manifest;

        this.getSharedJsPackageData = function () {

            var packageDocRoot = packageDocumentURL.substr(0, packageDocumentURL.lastIndexOf("/"));
            return {
                rootUrl : packageDocRoot,
                rendition_viewport : metadata.rendition_viewport,
                rendition_layout : metadata.rendition_layout,
                rendition_orientation : metadata.rendition_orientation,
                rendition_flow : metadata.rendition_flow,
                rendition_spread : metadata.rendition_spread,
                media_overlay : metadata.media_overlay,
                spine : {
                    direction : this.getPageProgressionDirection(),
                    items : spine
                }
            };
        };

        /**
         * Get spine item data in readium-shared-js accepted format.
         * @param spineIndex the index of the item within the spine
         * @returns Spine item data in readium-shared-js accepted format.
         */
        this.getSpineItem = function(spineIndex) {
            var spineItem = spine[spineIndex];
            return spineItem;
        };

        this.setPageProgressionDirection = function(page_prog_dir) {
            _page_prog_dir = page_prog_dir;
        };


        this.getPageProgressionDirection = function() {
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

        this.spineLength = function() {
            return spine.length;
        };

        this.getMetadata = function() {
            return metadata;
        };

        this.getToc = function() {
            var item = getTocItem();
            if (item) {
                return item.href;
            }
            return null;
        };

        this.getTocText = function(callback) {
            var toc = this.getToc();

            resourceFetcher.relativeToPackageFetchFileContents(toc, 'text', function (tocDocumentText) {
                callback(tocDocumentText)
            }, function (err) {
                console.error('ERROR fetching TOC from [' + toc + ']:');
                console.error(err);
                callback(undefined);
            });
        };

        this.getTocDom = function(callback) {

            this.getTocText(function (tocText) {
                if (typeof tocText === 'string') {
                    var tocDom = (new DOMParser()).parseFromString(tocText, "text/xml");
                    callback(tocDom);
                } else {
                    callback(undefined);
                }
            });
        };

        // Unused?
        this.generateTocListDOM = function(callback) {
            var that = this;
            this.getTocDom(function (tocDom) {
                if (tocDom) {
                    if (tocIsNcx()) {
                        var $ncxOrderedList;
                        $ncxOrderedList = getNcxOrderedList($("navMap", tocDom));
                        callback($ncxOrderedList[0]);
                    } else {
                        var packageDocumentAbsoluteURL = new URI(packageDocumentURL).absoluteTo(document.URL);
                        var tocDocumentAbsoluteURL = new URI(that.getToc()).absoluteTo(packageDocumentAbsoluteURL);
                        // add a BASE tag to change the TOC document's baseURI.
                        var oldBaseTag = $(tocDom).remove('base');
                        var newBaseTag = $('<base></base>');
                        $(newBaseTag).attr('href', tocDocumentAbsoluteURL);
                        $(tocDom).find('head').append(newBaseTag);
                        // TODO: fix TOC hrefs both for exploded in zipped EPUBs
                        callback(tocDom);
                    }
                } else {
                    callback(undefined);
                }
            });
        };

        function tocIsNcx() {

            var tocItem = getTocItem();
            var contentDocURI = tocItem.href;
            var fileExtension = contentDocURI.substr(contentDocURI.lastIndexOf('.') + 1);

            return fileExtension.trim().toLowerCase() === "ncx";
        }

        // ----------------------- PRIVATE HELPERS -------------------------------- //

        function getNcxOrderedList($navMapDOM) {

            var $ol = $("<ol></ol>");
            $.each($navMapDOM.children("navPoint"), function (index, navPoint) {
                addNavPointElements($(navPoint), $ol);
            });
            return $ol;
        }

        // Description: Constructs an html representation of NCX navPoints, based on an object of navPoint information
        // Rationale: This is a recursive method, as NCX navPoint elements can nest 0 or more of themselves as children
        function addNavPointElements($navPointDOM, $ol) {

            // Add the current navPoint element to the TOC html
            var navText = $navPointDOM.children("navLabel").text().trim();
            var navHref = $navPointDOM.children("content").attr("src");
            var $navPointLi = $('<li class="nav-elem"></li>').append(
                $('<a></a>', { href: navHref, text: navText })
            );

            // Append nav point info
            $ol.append($navPointLi);

            // Append ordered list of nav points
            if ($navPointDOM.children("navPoint").length > 0 ) {

                var $newLi = $("<li></li>");
                var $newOl = $("<ol></ol>");
                $.each($navPointDOM.children("navPoint"), function (navIndex, navPoint) {
                    $newOl.append(addNavPointElements($(navPoint), $newOl));
                });

                $newLi.append($newOl);
                $ol.append($newLi);
            }
        }

        function getTocItem(){

            var item = manifest.getNavItem();
            if (item) {
                return item;
            }

            var spine_id = metadata.ncx;
            if (spine_id && spine_id.length > 0) {
                return manifest.getManifestItemByIdref(spine_id);
            }

            return null;
        }

    };

    return PackageDocument;
});
