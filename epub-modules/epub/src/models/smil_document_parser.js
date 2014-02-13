define([ 'require', 'module', 'jquery', 'underscore', 'backbone', 'epub-fetch' ], function(require, module, $, _, Backbone, ResourceFetcher) {
    console.log('smil_document_parser module id: ' + module.id);

    // `SmilDocumentParser` is used to parse the xml of an epub package
    // document and build a javascript object. The constructor accepts an
    // instance of `URI` that is used to resolve paths during the process
    var SmilDocumentParser = function(packageFetcher, itemHref) {

        // Parse an XML package document into a javascript object
        this.parse = function(callback) {
            packageFetcher.getRelativeXmlFileDom(itemHref, function(xmlDom){
                var json, cover;

                json = {};

                json.smilVersion = $("smil", xmlDom)[0].getAttribute('version');

                var $body = $("body", xmlDom)[0];
                json.children = getChildren($body);

                callback(json);
            })
        };

        var safeCopyProperty = function(property, $fromNode, toItem, isRequired, defaultValue) {
            var propParse = property.split(':');
            var destProperty = propParse[propParse.length - 1];

            if (destProperty === "type") {
                destProperty = "epubtype";
            }
            
            if ($fromNode.getAttribute(property) != undefined) {
                toItem[destProperty] = $fromNode.getAttribute(property);
            } else if (isRequired) {
                if (defaultValue !== undefined) {
                    toItem[destProperty] = defaultValue;
                } else {
                    console.error("Required property " + property + " not found in smil node " + $fromNode.nodeName);
                }
            }
        };

// TODO: duplicate in package_document_parser.js
        // parse the timestamp and return the value in seconds
        // supports this syntax:
        // http://idpf.org/epub/30/spec/epub30-mediaoverlays.html#app-clock-examples
        function resolveClockValue(value) {
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
                arr = value.split(":");
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

        function getChildren($element) {
            var children = [];

            var $smilElements = $element.childNodes;

            $.each($smilElements, function(elementIndex, currElement) {
                var $currElement = $(currElement)[0];
                if ($currElement.nodeType === 1){
                    var item = createItemFromElement($currElement);
                    children.push(item);
                }
            });

            return children;
        }

        function createItemFromElement($element) {
            var item = {};
            item.nodeType = $element.nodeName;

            if (item.nodeType === "seq") {

                safeCopyProperty("epub:textref", $element, item, true);
                safeCopyProperty("id", $element, item);
                safeCopyProperty("epub:type", $element, item);

                item.children = getChildren($element);

            } else if (item.nodeType === "par") {

                safeCopyProperty("id", $element, item);
                safeCopyProperty("epub:type", $element, item);

                item.children = getChildren($element);

            } else if (item.nodeType === "text") {

                safeCopyProperty("src", $element, item, true);
                var srcParts = item.src.split('#');
                item.srcFile = srcParts[0];
                item.srcFragmentId = (srcParts.length === 2) ? srcParts[1] : "";
                safeCopyProperty("id", $element, item);
                // safeCopyProperty("epub:textref", $element, item);

            } else if (item.nodeType === "audio") {
                safeCopyProperty("src", $element, item, true);
                safeCopyProperty("id", $element, item);
                item.clipBegin = resolveClockValue($element.getAttribute("clipBegin"));
                item.clipEnd = resolveClockValue($element.getAttribute("clipEnd"));
            }

            return item;
        }

    };

    
    function fillSmilData(docJson, bookRoot, jsLibRoot, currentResourceFetcher, callback) {

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
                
                var smilParser = new SmilDocumentParser(currentResourceFetcher, manifestItemSMIL.href);
                smilParser.parse(function(smilJson) {
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
    
    
    var SmilParser = {
        fillSmilData: fillSmilData,
        Parser: SmilDocumentParser
    }
    
    return SmilParser;
});
