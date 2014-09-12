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
    var SmilDocumentParser = function(packageDocument, publicationFetcher) {

        // Parse a media overlay manifest item XML
        this.parse = function(spineItem, manifestItemSMIL, smilJson, deferred, callback, errorCallback) {
            var that = this;
            publicationFetcher.getRelativeXmlFileDom(manifestItemSMIL.href, function(xmlDom) {

                var smil = $("smil", xmlDom)[0];
                smilJson.smilVersion = smil.getAttribute('version');

                //var body = $("body", xmlDom)[0];
                smilJson.children = that.getChildren(smil);
                smilJson.href = manifestItemSMIL.href;
                smilJson.id = manifestItemSMIL.id;
                smilJson.spineItemId = spineItem.idref;

                var mediaItem = packageDocument.getMetadata().getMediaItemByRefinesId(manifestItemSMIL.id);
                if (mediaItem) {
                    smilJson.duration = mediaItem.duration;
                }

                callback(deferred, smilJson);
            }, function(fetchError) {
                errorCallback(deferred, fetchError);
            });
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

        function makeFakeSmilJson(spineItem) {
            return {
                id: "",
                href: "",
                spineItemId: spineItem.idref,
                children: [{
                    nodeType: 'seq',
                    textref: spineItem.href,
                    children: [{
                        nodeType: 'par',
                        children: [{
                            nodeType: 'text',
                            src: spineItem.href,
                            srcFile: spineItem.href,
                            srcFragmentId: ""
                        }]
                    }]
                }]
            };
        }

        this.fillSmilData = function(callback) {
            var that = this;

            if (packageDocument.spineLength() <= 0) {
                callback();
                return;
            }

            var allFakeSmil = true;
            var mo_map = [];
            var parsingDeferreds = [];

            for (var spineIdx = 0; spineIdx < packageDocument.spineLength(); spineIdx++) {
                var spineItem = packageDocument.getSpineItem(spineIdx);

                if (spineItem.media_overlay_id) {
                    var manifestItemSMIL = packageDocument.manifest.getManifestItemByIdref(spineItem.media_overlay_id);

                    if (!manifestItemSMIL) {
                        console.error("Cannot find SMIL manifest item for spine/manifest item?! " + spineItem.media_overlay_id);
                        continue;
                    }
                    //ASSERT manifestItemSMIL.media_type === "application/smil+xml"

                    var parsingDeferred = $.Deferred();
                    parsingDeferred.media_overlay_id = spineItem.media_overlay_id;
                    parsingDeferreds.push(parsingDeferred);
                    var smilJson = {};

                    // Push the holder object onto the map early so that order isn't disturbed by asynchronicity:
                    mo_map.push(smilJson);

                    // The local parsingDeferred variable will have its value replaced on next loop iteration.
                    // Must pass the parsingDeferred through async calls as an argument and it arrives back as myDeferred.
                    that.parse(spineItem, manifestItemSMIL, smilJson, parsingDeferred, function(myDeferred, smilJson) {
                        allFakeSmil = false;
                        myDeferred.resolve();
                    }, function(myDeferred, parseError) {
                        console.log('Error when parsing SMIL manifest item ' + manifestItemSMIL.href + ':');
                        console.log(parseError);
                        myDeferred.resolve();
                    });
                } else {
                    mo_map.push(makeFakeSmilJson(spineItem));
                }
            }

            $.when.apply($, parsingDeferreds).done(function() {
                packageDocument.getMetadata().setMoMap(mo_map);
                if (allFakeSmil) {
                    console.log("No Media Overlays");
                    packageDocument.getMetadata().setMoMap([]);
                }
                callback();
            });
        }
    };

    // parse the timestamp and return the value in seconds
    // supports this syntax:
    // http://idpf.org/epub/30/spec/epub30-mediaoverlays.html#app-clock-examples
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
