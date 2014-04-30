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

define(['require', 'module', 'jquery', 'underscore'], function (require, module, $, _) {

    // `SmilDocumentParser` is used to parse the xml of an epub package
    // document and build a javascript object. The constructor accepts an
    // instance of `URI` that is used to resolve paths during the process
    var SmilDocumentParser = function(docJson, publicationFetcher) {

        // Parse a media overlay manifest item XML
        this.parse = function(itemHref, callback) {
            var that = this;
            publicationFetcher.getRelativeXmlFileDom(itemHref, function(xmlDom){
                var json, cover;

                json = {};

                var smil = $("smil", xmlDom)[0];
                json.smilVersion = smil.getAttribute('version');

                //var body = $("body", xmlDom)[0];
                json.children = that.getChildren(smil);

                callback(json);
            })
        };

        var safeCopyProperty = function(property, fromNode, toItem, isRequired, defaultValue) {
            var propParse = property.split(':');
            var destProperty = propParse[propParse.length - 1];

            if (destProperty === "type") {
                destProperty = "epubtype";
            }
            
            if (fromNode.getAttribute(property) != undefined) {
                toItem[destProperty] = fromNode.getAttribute(property);
            } else if (isRequired) {
                if (defaultValue !== undefined) {
                    toItem[destProperty] = defaultValue;
                } else {
                    console.log("Required property " + property + " not found in smil node " + fromNode.nodeName);
                }
            }
        };

// TODO: duplicate in package_document_parser.js
        // parse the timestamp and return the value in seconds
        // supports this syntax:
        // http://idpf.org/epub/30/spec/epub30-mediaoverlays.html#app-clock-examples

        this.getChildren = function(element) {
            var that = this;
            var children = [];

            $.each(element.childNodes, function(elementIndex, currElement) {

                if (currElement.nodeType === 1) { // ELEMENT
                    var item = that.createItemFromElement(currElement);
                    if (item) {
                        children.push(item);
                    }
                }
            });

            return children;
        }

        this.createItemFromElement = function(element) {
            var that = this;

            var item = {};
            item.nodeType = element.nodeName;
            
            var isBody = false;
            if (item.nodeType === "body")
            {
                isBody = true;
                item.nodeType = "seq";
            }

            if (item.nodeType === "seq") {

                safeCopyProperty("epub:textref", element, item, !isBody);
                safeCopyProperty("id", element, item);
                safeCopyProperty("epub:type", element, item);

                item.children = that.getChildren(element);

            } else if (item.nodeType === "par") {

                safeCopyProperty("id", element, item);
                safeCopyProperty("epub:type", element, item);

                item.children = that.getChildren(element);

            } else if (item.nodeType === "text") {

                safeCopyProperty("src", element, item, true);
                var srcParts = item.src.split('#');
                item.srcFile = srcParts[0];
                item.srcFragmentId = (srcParts.length === 2) ? srcParts[1] : "";
                safeCopyProperty("id", element, item);
                // safeCopyProperty("epub:textref", element, item);

            } else if (item.nodeType === "audio") {
                safeCopyProperty("src", element, item, true);
                safeCopyProperty("id", element, item);
                item.clipBegin = SmilDocumentParser.resolveClockValue(element.getAttribute("clipBegin"));
                item.clipEnd = SmilDocumentParser.resolveClockValue(element.getAttribute("clipEnd"));
            }
            else
            {
                return undefined;
            }

            return item;
        }

        this.fillSmilData = function(callback) {
            var that = this;

            if (docJson.spine.length <= 0) {
                docJson.mo_map = [];
                callback(docJson);
                return;
            }

            var allFakeSmil = true;
            docJson.mo_map = [];

            var processSpineItem = function(ii) {

                if (ii >= docJson.spine.length) {
                    if (allFakeSmil) {
                        console.log("No Media Overlays");
                        docJson.mo_map = [];
                    }

                    callback(docJson);
                    return;
                }

                var spineItem = docJson.spine[ii];

                var manifestItem = undefined;
                for (var jj = 0; jj < docJson.manifest.length; jj++) {
                    var item = docJson.manifest[jj];
                    if (item.id === spineItem.idref) {
                        manifestItem = item;
                        break;
                    }
                }
                if (!manifestItem) {
                    console.error("Cannot find manifest item for spine item?! " + spineItem.idref);
                    processSpineItem(ii+1);
                    return;
                }

                if (manifestItem.media_overlay) {

                    var manifestItemSMIL = undefined;
                    for (var jj = 0; jj < docJson.manifest.length; jj++) {
                        var item = docJson.manifest[jj];
                        if (item.id === manifestItem.media_overlay) {
                            manifestItemSMIL = item;
                            break;
                        }
                    }
                    if (!manifestItemSMIL) {
                        console.error("Cannot find SMIL manifest item for spine/manifest item?! " + manifestItem.media_overlay);
                        processSpineItem(ii+1);
                        return;
                    }
                    //ASSERT manifestItemSMIL.media_type === "application/smil+xml"

                    that.parse(manifestItemSMIL.href, function(smilJson) {
                        smilJson.href = manifestItemSMIL.href;
                        smilJson.id = manifestItemSMIL.id;
                        smilJson.spineItemId = spineItem.idref; // same as manifestItem.id

                        if (docJson.metadata.mediaItems) {
                            for (var idx = 0; idx < docJson.metadata.mediaItems.length; idx++) {
                                var item = docJson.metadata.mediaItems[idx];
                                if (!item.refines) continue;

                                var id = item.refines;
                                var hash = id.indexOf('#');
                                if (hash >= 0) {
                                    var start = hash+1;
                                    var end = id.length-1;
                                    id = id.substr(start, end);
                                }
                                id = id.trim();

                                if (id === manifestItemSMIL.id) {
                                    smilJson.duration = item.duration; //resolveClockValue already done.
                                    break;
                                }
                            }
                        }

                        allFakeSmil = false;
                        docJson.mo_map.push(smilJson);

                        setTimeout(function(){ processSpineItem(ii+1); }, 0);
                        return;
                    });
                }
                else {
                    docJson.mo_map.push({
                        id: "",
                        href: "",
                        spineItemId: spineItem.idref, // same as manifestItem.id
                        children: [{
                            nodeType: 'seq',
                            textref: manifestItem.href,
                            children: [{
                                nodeType: 'par',
                                children: [{
                                    nodeType: 'text',
                                    src: manifestItem.href,
                                    srcFile: manifestItem.href,
                                    srcFragmentId: ""
                                }]
                            }]
                        }]
                    });

                    setTimeout(function(){ processSpineItem(ii+1); }, 0);
                    return;
                }
            };

            processSpineItem(0);
        }


    };



    SmilDocumentParser.resolveClockValue = function(value) {
        if (!value) return 0;

        var hours = 0;
        var mins = 0;
        var secs = 0;

        if (value.indexOf("min") != -1) {
            mins = parseFloat(value.substr(0, value.indexOf("min")));
        } else if (value.indexOf("ms") != -1) {
            var ms = parseFloat(value.substr(0, value.indexOf("ms")));
            secs = ms / 1000;
        } else if (value.indexOf("s") != -1) {
            secs = parseFloat(value.substr(0, value.indexOf("s")));
        } else if (value.indexOf("h") != -1) {
            hours = parseFloat(value.substr(0, value.indexOf("h")));
        } else {
            // parse as hh:mm:ss.fraction
            // this also works for seconds-only, e.g. 12.345
            var arr = value.split(":");
            secs = parseFloat(arr.pop());
            if (arr.length > 0) {
                mins = parseFloat(arr.pop());
                if (arr.length > 0) {
                    hours = parseFloat(arr.pop());
                }
            }
        }
        var total = hours * 3600 + mins * 60 + secs;
        return total;
    }
    
    return SmilDocumentParser;
});
