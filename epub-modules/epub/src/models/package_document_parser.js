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

define(['require', 'module', 'jquery', 'underscore', 'backbone', 'epub-fetch/markup_parser', 'URIjs', './package_document',
        './smil_document_parser', './metadata', './manifest'],
    function(require, module, $, _, Backbone, MarkupParser, URI, PackageDocument, SmilDocumentParser, Metadata,
             Manifest) {

        // `PackageDocumentParser` is used to parse the xml of an epub package
    // document and build a javascript object. The constructor accepts an
    // instance of `URI` that is used to resolve paths during the process
    var PackageDocumentParser = function(bookRoot, publicationFetcher) {

        var _packageFetcher = publicationFetcher;
        var _deferredXmlDom = $.Deferred();
        var _xmlDom;

        function onError(error) {
            if (error) {
                if (error.message) {
                    console.error(error.message);
                }
                if (error.stack) {
                    console.error(error.stack);
                }
            }
        }

        publicationFetcher.getPackageDom(function(packageDom){
            _xmlDom = packageDom;
            _deferredXmlDom.resolve(packageDom);
        }, onError);

        function fillSmilData(packageDocument, callback) {

            var smilParser = new SmilDocumentParser(packageDocument, publicationFetcher);

            smilParser.fillSmilData(function() {

                // return the parse result
                callback(packageDocument);
            });

        }

        // Parse an XML package document into a javascript object
        this.parse = function(callback) {

            _deferredXmlDom.done(function (xmlDom) {
                var metadata = getMetadata(xmlDom);

                var spineElem = xmlDom.getElementsByTagNameNS("*", "spine")[0];
                var page_prog_dir = getElemAttr(xmlDom, 'spine', "page-progression-direction");

                // TODO: Bindings are unused
                var bindings = getJsonBindings(xmlDom);

                var manifest = new Manifest(getJsonManifest(xmlDom));
                var spine = getJsonSpine(xmlDom, manifest);

                // try to find a cover image
                var cover = getCoverHref(xmlDom);
                if (cover) {
                    metadata.cover_href = cover;
                }

                $.when(updateMetadataWithIBookProperties(metadata)).then(function() {

                    _packageFetcher.setPackageMetadata(metadata, function () {
                        var packageDocument = new PackageDocument(publicationFetcher.getPackageUrl(),
                            publicationFetcher, metadata, spine, manifest);

                        packageDocument.setPageProgressionDirection(page_prog_dir);
                        fillSmilData(packageDocument, callback);
                    });
                });

            });
        };

        function updateMetadataWithIBookProperties(metadata) {

            var dff = $.Deferred();

            //if layout not set
            if(!metadata.rendition_layout)
            {
                var pathToIBooksSpecificXml = "/META-INF/com.apple.ibooks.display-options.xml";

                publicationFetcher.relativeToPackageFetchFileContents(pathToIBooksSpecificXml, 'text', function (ibookPropText) {
                    if(ibookPropText) {
                        var parser = new MarkupParser();
                        var propModel = parser.parseXml(ibookPropText);
                        var fixLayoutProp = $("option[name=fixed-layout]", propModel)[0];
                        if(fixLayoutProp) {
                            var fixLayoutVal = $(fixLayoutProp).text();
                            if(fixLayoutVal === "true") {
                                metadata.rendition_layout = "pre-paginated";
                                console.log("using com.apple.ibooks.display-options.xml fixed-layout property");
                            }
                        }
                    }

                    dff.resolve();

                }, function (err) {

                    console.log("com.apple.ibooks.display-options.xml not found");
                    dff.resolve();
                });
            }
            else {
                dff.resolve();
            }

            return dff.promise();
        }


        function getJsonSpine(xmlDom, manifest) {

            var $spineElements;
            var jsonSpine = [];

            $spineElements = $(findXmlElemByLocalNameAnyNS(xmlDom,"spine")).children();
            $.each($spineElements, function (spineElementIndex, currSpineElement) {

                var $currSpineElement = $(currSpineElement);
                var idref = $currSpineElement.attr("idref") ? $currSpineElement.attr("idref") : "";
                var manifestItem = manifest.getManifestItemByIdref(idref);

                var spineItem = {
                    idref: idref,
                    href: manifestItem.href,
                    manifest_id: manifestItem.id,
                    media_type: manifestItem.media_type,
                    media_overlay_id: manifestItem.media_overlay_id,
                    linear: $currSpineElement.attr("linear") ? $currSpineElement.attr("linear") : "",
                    properties: $currSpineElement.attr("properties") ? $currSpineElement.attr("properties") : ""
                };

                var parsedProperties = parsePropertiesString(spineItem.properties);
                _.extend(spineItem, parsedProperties);

                jsonSpine.push(spineItem);
            });

            return jsonSpine;
        }

        function findXmlElemByLocalNameAnyNS(rootElement, localName) {
            return rootElement.getElementsByTagNameNS("*", localName)[0];
        }

        function getElemText(rootElement, localName) {
            var foundElement = findXmlElemByLocalNameAnyNS(rootElement, localName);
            if (foundElement) {
                return foundElement.textContent;
            } else {
                return '';
            }
        }

        function getElemAttr(rootElement, localName, attrName) {
            var foundElement = findXmlElemByLocalNameAnyNS(rootElement, localName);
            if (foundElement) {
                return foundElement.getAttribute(attrName);
            } else {
                return '';
            }
        }

        function getMetadata(xmlDom) {

            var metadata = new Metadata();
            var $metadata = $(findXmlElemByLocalNameAnyNS(xmlDom, "metadata"));
            var $package = $(findXmlElemByLocalNameAnyNS(xmlDom, "package"));
            var $spine = $(findXmlElemByLocalNameAnyNS(xmlDom, "spine"));
            var metadataElem = xmlDom.getElementsByTagNameNS("*", "metadata")[0];


            metadata.author = getElemText(metadataElem, "creator");
            metadata.description = getElemText(metadataElem, "description");
            // TODO: Convert all jQuery queries (that get confused by XML namespaces on Firefox) to getElementsByTagNameNS().
            metadata.epub_version =
                $package.attr("version") ? $package.attr("version") : "";
            metadata.id = getElemText(metadataElem,"identifier");
            metadata.language = getElemText(metadataElem, "language");
            metadata.modified_date = $("meta[property='dcterms:modified']", $metadata).text();
            metadata.ncx = $spine.attr("toc") ? $spine.attr("toc") : "";
            metadata.pubdate = getElemText(metadataElem, "date");
            metadata.publisher = getElemText(metadataElem, "publisher");
            metadata.rights = getElemText(metadataElem, "rights");
            metadata.title = getElemText(metadataElem, "title");


            metadata.rendition_orientation = $("meta[property='rendition:orientation']", $metadata).text();
            metadata.rendition_layout = $("meta[property='rendition:layout']", $metadata).text();
            metadata.rendition_spread = $("meta[property='rendition:spread']", $metadata).text();
            metadata.rendition_flow = $("meta[property='rendition:flow']", $metadata).text();
            
            
            // Media part
            metadata.mediaItems = [];

            var $overlays = $("meta[property='media:duration'][refines]", $metadata);

            $.each($overlays, function(elementIndex, $currItem) {
                metadata.mediaItems.push({
                  refines: $currItem.getAttribute("refines"),
                  duration: SmilDocumentParser.resolveClockValue($($currItem).text())
               });
            });

            metadata.media_overlay = {
                duration: SmilDocumentParser.resolveClockValue($("meta[property='media:duration']:not([refines])", $metadata).text()),
                narrator: $("meta[property='media:narrator']", $metadata).text(),
                activeClass: $("meta[property='media:active-class']", $metadata).text(),
                playbackActiveClass: $("meta[property='media:playback-active-class']", $metadata).text(),
                smil_models: [],
                skippables: ["sidebar", "practice", "marginalia", "annotation", "help", "note", "footnote", "rearnote",
                    "table", "table-row", "table-cell", "list", "list-item", "pagebreak"],
                escapables: ["sidebar", "bibliography", "toc", "loi", "appendix", "landmarks", "lot", "index",
                    "colophon", "epigraph", "conclusion", "afterword", "warning", "epilogue", "foreword",
                    "introduction", "prologue", "preface", "preamble", "notice", "errata", "copyright-page",
                    "acknowledgments", "other-credits", "titlepage", "imprimatur", "contributors", "halftitlepage",
                    "dedication", "help", "annotation", "marginalia", "practice", "note", "footnote", "rearnote",
                    "footnotes", "rearnotes", "bridgehead", "page-list", "table", "table-row", "table-cell", "list",
                    "list-item", "glossary"]
            };

            return metadata;
        }

        function getJsonManifest(xmlDom) {

            var $manifestItems = $(findXmlElemByLocalNameAnyNS(xmlDom, "manifest")).children();
            var jsonManifest = [];

            $.each($manifestItems, function (manifestElementIndex, currManifestElement) {

                var $currManifestElement = $(currManifestElement);
                var currManifestElementHref = $currManifestElement.attr("href") ? $currManifestElement.attr("href") :
                    "";
                var manifestItem = {

                    href: currManifestElementHref,
                    id: $currManifestElement.attr("id") ? $currManifestElement.attr("id") : "",
                    media_overlay_id: $currManifestElement.attr("media-overlay") ?
                        $currManifestElement.attr("media-overlay") : "",
                    media_type: $currManifestElement.attr("media-type") ? $currManifestElement.attr("media-type") : "",
                    properties: $currManifestElement.attr("properties") ? $currManifestElement.attr("properties") : ""
                };
                // console.log('pushing manifest item to JSON manifest. currManifestElementHref: [' + currManifestElementHref + 
                //     '], manifestItem.href: [' + manifestItem.href +
                //     '], manifestItem:');
                // console.log(manifestItem);
                jsonManifest.push(manifestItem);
            });

            return jsonManifest;
        }

        function getJsonBindings(xmlDom) {

            var $bindings = $(findXmlElemByLocalNameAnyNS(xmlDom, "bindings")).children();
            var jsonBindings = [];

            $.each($bindings, function (bindingElementIndex, currBindingElement) {

                var $currBindingElement = $(currBindingElement);
                var binding = {

                    handler: $currBindingElement.attr("handler") ? $currBindingElement.attr("handler") : "",
                    media_type: $currBindingElement.attr("media-type") ? $currBindingElement.attr("media-type") : ""
                };

                jsonBindings.push(binding);
            });

            return jsonBindings;
        }

        function getCoverHref(xmlDom) {

            var manifest;
            var $imageNode;
            manifest = findXmlElemByLocalNameAnyNS(xmlDom, "manifest");

            // epub3 spec for a cover image is like this:
            /*<item properties="cover-image" id="ci" href="cover.svg" media-type="image/svg+xml" />*/
            $imageNode = $('item[properties~="cover-image"]', manifest);
            if ($imageNode.length === 1 && $imageNode.attr("href")) {
                return $imageNode.attr("href");
            }

            // some epub2's cover image is like this:
            /*<meta name="cover" content="cover-image-item-id" />*/
            //TODO: this needs to be using findXmlElemByLocalNameAnyNS to obtain 'meta' elements
            var metaNode = $('meta[name="cover"]', xmlDom);
            var contentAttr = metaNode.attr("content");
            if (metaNode.length === 1 && contentAttr) {
                $imageNode = $('item[id="' + contentAttr + '"]', manifest);
                if ($imageNode.length === 1 && $imageNode.attr("href")) {
                    return $imageNode.attr("href");
                }
            }

            // that didn't seem to work so, it think epub2 just uses item with id=cover
            $imageNode = $('#cover', manifest);
            if ($imageNode.length === 1 && $imageNode.attr("href")) {
                return $imageNode.attr("href");
            }

            // seems like there isn't one, thats ok...
            return null;
        }

        function parsePropertiesString(str) {
            var properties = {};
            var allPropStrs = str.split(" "); // split it on white space
            for (var i = 0; i < allPropStrs.length; i++) {

                //ReadiumSDK.Models.SpineItem.RENDITION_ORIENTATION_LANDSCAPE
                if (allPropStrs[i] === "rendition:orientation-landscape") properties.rendition_orientation = "landscape";

                //ReadiumSDK.Models.SpineItem.RENDITION_ORIENTATION_PORTRAIT
                if (allPropStrs[i] === "rendition:orientation-portrait") properties.rendition_orientation = "portrait";

                //ReadiumSDK.Models.SpineItem.RENDITION_ORIENTATION_AUTO
                if (allPropStrs[i] === "rendition:orientation-auto") properties.rendition_orientation = "auto";


                //ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_NONE
                if (allPropStrs[i] === "rendition:spread-none") properties.rendition_spread = "none";

                //ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_LANDSCAPE
                if (allPropStrs[i] === "rendition:spread-landscape") properties.rendition_spread = "landscape";

                //ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_PORTRAIT
                if (allPropStrs[i] === "rendition:spread-portrait") properties.rendition_spread = "portrait";

                //ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_BOTH
                if (allPropStrs[i] === "rendition:spread-both") properties.rendition_spread = "both";

                //ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_AUTO
                if (allPropStrs[i] === "rendition:spread-auto") properties.rendition_spread = "auto";


                //ReadiumSDK.Models.SpineItem.RENDITION_FLOW_PAGINATED
                if (allPropStrs[i] === "rendition:flow-paginated") properties.rendition_flow = "paginated";

                //ReadiumSDK.Models.SpineItem.RENDITION_FLOW_SCROLLED_CONTINUOUS
                if (allPropStrs[i] === "rendition:flow-scrolled-continuous") properties.rendition_flow = "scrolled-continuous";

                //ReadiumSDK.Models.SpineItem.RENDITION_FLOW_SCROLLED_DOC
                if (allPropStrs[i] === "rendition:flow-scrolled-doc") properties.rendition_flow = "scrolled-doc";

                //ReadiumSDK.Models.SpineItem.RENDITION_FLOW_AUTO
                if (allPropStrs[i] === "rendition:flow-auto") properties.rendition_flow = "auto";



                //ReadiumSDK.Models.SpineItem.SPREAD_CENTER
                if (allPropStrs[i] === "rendition:page-spread-center") properties.page_spread = "page-spread-center";

                //ReadiumSDK.Models.SpineItem.SPREAD_LEFT
                if (allPropStrs[i] === "page-spread-left") properties.page_spread = "page-spread-left";

                //ReadiumSDK.Models.SpineItem.SPREAD_RIGHT
                if (allPropStrs[i] === "page-spread-right") properties.page_spread = "page-spread-right";

                //ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_REFLOWABLE
                if (allPropStrs[i] === "rendition:layout-reflowable") {
                    properties.fixed_flow = false; // TODO: only used in spec tests!
                    properties.rendition_layout = "reflowable";
                }

                //ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_PREPAGINATED
                if (allPropStrs[i] === "rendition:layout-pre-paginated") {
                    properties.fixed_flow = true; // TODO: only used in spec tests!
                    properties.rendition_layout = "pre-paginated";
                }
            }
            return properties;
        }

    };

    return PackageDocumentParser;
});
