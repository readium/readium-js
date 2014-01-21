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

        // parse the timestamp and return the value in seconds
        // supports this syntax:
        // http://idpf.org/epub/30/spec/epub30-mediaoverlays.html#app-clock-examples
        function resolveClockValue(value) {
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
                safeCopyProperty("epub:epubtype", $element, item);

                item.children = getChildren($element);

            } else if (item.nodeType === "text") {

                safeCopyProperty("src", $element, item, true);
                var srcParts = item.src.split('#');
                item.srcFile = srcParts[0];
                item.srcFragmentId = (srcParts.length === 2) ? srcParts[1] : undefined;
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
        var i = 0;
        docJson.mo_map = [];

        function getSpineIdByOverlayId(overlayId) {
            for (var ii = 0; ii < docJson.manifest.length; ii++) {
                if (docJson.manifest[ii].media_overlay === overlayId) {
                    return docJson.manifest[ii].id;
                }
            }
            return undefined;
        }

        function fetchNextSmildata() {
            if (i >= docJson.manifest.length) {
                callback(docJson);
                return;
            }

            var currentManifestItem = docJson.manifest[i];
            i++;

            if (currentManifestItem.media_type === "application/smil+xml") {
                
                var smilParser = new SmilDocumentParser(currentResourceFetcher, currentManifestItem.href);
                smilParser.parse(function(smilJson) {
                    smilJson.href = currentManifestItem.href;
                    smilJson.id = currentManifestItem.id;
                    smilJson.spineItemId = getSpineIdByOverlayId(currentManifestItem.id);
                    docJson.mo_map.push(smilJson);
                    setTimeout(fetchNextSmildata);
                });

            } else {
                setTimeout(fetchNextSmildata);
            }

        }
        fetchNextSmildata();
    }
    
    
    var SmilParser = {
        fillSmilData: fillSmilData,
        Parser: SmilDocumentParser
    }
    
    return SmilParser;
});
