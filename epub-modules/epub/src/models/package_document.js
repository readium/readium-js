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

define(['require', 'module', 'jquery', 'underscore', 'backbone', 'URIjs', './manifest'],
    function (require, module, $, _, Backbone, URI, Manifest) {

    // Description: This model provides an interface for navigating an EPUB's package document
    var PackageDocument = function(packageDocumentURL, packageDocJson, resourceFetcher) {

        var _manifest = new Manifest(packageDocJson.manifest);
        var _moMap = packageDocJson.mo_map;

        this.getPackageData = function () {

            var spinePackageData = [];
            // _spine.each(function (spineItem) {
            //     spinePackageData.push(...);
            // });
            for (var i = 0; i < packageDocJson.spine.length; i++)
            {
                var spineItem = packageDocJson.spine[i];
                
                var manifestItem = _manifest.getManifestItemByIdref(spineItem.idref);

                var spineInfo = {
                    href : manifestItem.contentDocumentURI,
                    media_type : manifestItem.media_type,
                    media_overlay_id : manifestItem.media_overlay,
                    idref : spineItem.idref,
                    page_spread : spineItem.page_spread,
                    rendition_layout : spineItem.rendition_layout,
                    rendition_orientation : spineItem.rendition_orientation,
                    rendition_spread : spineItem.rendition_spread,
                    rendition_flow : spineItem.rendition_flow,
                    linear: spineItem.linear
                };
                spinePackageData.push(spineInfo);
            }

            var packageDocRoot = packageDocumentURL.substr(0, packageDocumentURL.lastIndexOf("/"));
            return {
                rootUrl : packageDocRoot,
                rendition_layout : packageDocJson.metadata.layout,
                rendition_orientation : packageDocJson.metadata.orientation,
                rendition_layout : packageDocJson.metadata.layout,
                media_overlay : getMediaOverlay(),
                spine : {
                    direction : pageProgressionDirection(),
                    items : spinePackageData
                }
            };
        };

        function getMediaOverlay(){
           var result = {
                 duration : packageDocJson.metadata.mediaDuration,
                 narrator : packageDocJson.metadata.mediaNarrator,
                 activeClass : packageDocJson.metadata.mediaActiveClass,
                 playbackActiveClass : packageDocJson.metadata.mediaPlaybackActiveClass,
                 smil_models : _moMap,
                 
                 skippables: ["sidebar", "practice", "marginalia", "annotation", "help", "note", "footnote", "rearnote", "table", "table-row", "table-cell", "list", "list-item", "pagebreak"],
                 escapables: ["sidebar", "bibliography", "toc", "loi", "appendix", "landmarks", "lot", "index", "colophon", "epigraph", "conclusion", "afterword", "warning", "epilogue", "foreword", "introduction", "prologue", "preface", "preamble", "notice", "errata", "copyright-page", "acknowledgments", "other-credits", "titlepage", "imprimatur", "contributors", "halftitlepage", "dedication", "help", "annotation", "marginalia", "practice", "note", "footnote", "rearnote", "footnotes", "rearnotes", "bridgehead", "page-list", "table", "table-row", "table-cell", "list", "list-item", "glossary"]
           };

           return result;
        }
        
        function isFixedLayout() {

            return packageDocJson.metadata.fixed_layout;
        }

        function pageProgressionDirection() {

            if (packageDocJson.metadata.page_prog_dir === "rtl") {
                return "rtl";
            }
            else if (packageDocJson.metadata.page_prog_dir === "default") {
                return "default";
            }
            else {
                return "ltr";
            }
        }

        this.getToc = function() {
            var item = getTocItem();
            if (item) {
                return item.contentDocumentURI;
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
            var contentDocURI = tocItem.contentDocumentURI;
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

            var item = _manifest.getNavItem();
            if (item) {
                return item;
            }

            var spine_id = packageDocJson.metadata.ncx;
            if (spine_id && spine_id.length > 0) {
                return _manifest.getManifestItemByIdref(spine_id);
            }

            return null;
        }

    };

    return PackageDocument;
});
