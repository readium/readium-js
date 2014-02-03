define(['require', 'module', 'jquery', 'underscore', 'backbone', 'epub-fetch/markup_parser', 'URIjs'], function (require, module, $, _, Backbone, MarkupParser, URI) {
    console.log('package_document_parser module id: ' + module.id);

    // `PackageDocumentParser` is used to parse the xml of an epub package
    // document and build a javascript object. The constructor accepts an
    // instance of `URI` that is used to resolve paths during the process
    var PackageDocumentParser = function(bookRoot, packageFetcher) {

// TODO: duplicate in smil_document_parser.js
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

        var _packageFetcher = packageFetcher;
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

        packageFetcher.getPackageDom(function(packageDom){
            _xmlDom = packageDom;
            _deferredXmlDom.resolve(packageDom);
        }, onError);


        // Parse an XML package document into a javascript object
        this.parse = function(callback) {

            _deferredXmlDom.done(function (xmlDom) {
                var json, cover;

                json = {};
                json.metadata = getJsonMetadata(xmlDom);
                json.bindings = getJsonBindings(xmlDom);
                json.spine = getJsonSpine(xmlDom);
                json.manifest = getJsonManifest(xmlDom);

                // parse the page-progression-direction if it is present
                json.paginate_backwards = paginateBackwards(xmlDom);

                // try to find a cover image
                cover = getCoverHref(xmlDom);
                if (cover) {
                    json.metadata.cover_href = cover;
                }

                $.when(updateMetadataWithIBookProperties(json.metadata)).then(function() {

                    if (json.metadata.layout === "pre-paginated") {
                        json.metadata.fixed_layout = true;
                    }

                    // THIS SHOULD BE LEFT IN (BUT COMMENTED OUT), AS MO SUPPORT IS TEMPORARILY DISABLED
                    // create a map of all the media overlay objects
                    // json.mo_map = this.resolveMediaOverlays(json.manifest);

                    // parse the spine into a proper collection
                    json.spine = parseSpineProperties(json.spine);

                    _packageFetcher.setPackageJson(json, function () {
                        // return the parse result
                        callback(json)
                    });
                });

            });
        };

        function updateMetadataWithIBookProperties(metadata) {

            var dff = $.Deferred();

            //if layout not set
            if(!metadata.layout)
            {
                var absoluteRoot = new URI(bookRoot + "/META-INF/com.apple.ibooks.display-options.xml").absoluteTo(document.URL);

                packageFetcher.relativeToPackageFetchFileContents(absoluteRoot, 'text', function (ibookPropText) {

                    if(ibookPropText) {
                        var parser = new MarkupParser();
                        var propModel = parser.parseXml(ibookPropText);
                        var fixLayoutProp = $("option[name=fixed-layout]", propModel)[0];
                        if(fixLayoutProp) {
                            var fixLayoutVal = $(fixLayoutProp).text();
                            if(fixLayoutVal === "true") {
                                metadata.layout = "pre-paginated";
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


        function getJsonSpine(xmlDom) {

            var $spineElements;
            var jsonSpine = [];

            $spineElements = $("spine", xmlDom).children();
            $.each($spineElements, function (spineElementIndex, currSpineElement) {

                var $currSpineElement = $(currSpineElement);
                var spineItem = {

                    idref: $currSpineElement.attr("idref") ? $currSpineElement.attr("idref") : "",
                    linear: $currSpineElement.attr("linear") ? $currSpineElement.attr("linear") : "",
                    properties: $currSpineElement.attr("properties") ? $currSpineElement.attr("properties") : ""
                };

                jsonSpine.push(spineItem);
            });

            return jsonSpine;
        }

        function getJsonMetadata(xmlDom) {

            var $metadata = $("metadata", xmlDom);
            var jsonMetadata = {};

            jsonMetadata.author = $("creator", $metadata).text();
            jsonMetadata.description = $("description", $metadata).text();
            jsonMetadata.epub_version =
                $("package", xmlDom).attr("version") ? $("package", xmlDom).attr("version") : "";
            jsonMetadata.id = $("identifier", $metadata).text();
            jsonMetadata.language = $("language", $metadata).text();
            jsonMetadata.layout = $("meta[property='rendition:layout']", $metadata).text();
            jsonMetadata.modified_date = $("meta[property='dcterms:modified']", $metadata).text();
            jsonMetadata.ncx = $("spine", xmlDom).attr("toc") ? $("spine", xmlDom).attr("toc") : "";
            jsonMetadata.orientation = $("meta[property='rendition:orientation']", $metadata).text();
            jsonMetadata.page_prog_dir = $("spine", xmlDom).attr("page-progression-direction") ?
                $("spine", xmlDom).attr("page-progression-direction") : "";
            jsonMetadata.pubdate = $("date", $metadata).text();
            jsonMetadata.publisher = $("publisher", $metadata).text();
            jsonMetadata.rights = $("rights").text();
            jsonMetadata.spread = $("meta[property='rendition:spread']", $metadata).text();
            jsonMetadata.title = $("title", $metadata).text();
            
            
            // Media part
            jsonMetadata.mediaItems = [];

            var $overlays = $("meta[property='media:duration'][refines]", $metadata);

            $.each($overlays, function(elementIndex, $currItem) {
               jsonMetadata.mediaItems.push({
                  refines: $currItem.getAttribute("refines"),
                  duration: resolveClockValue($($currItem).text())
               });
            });
               
            jsonMetadata.mediaDuration =  resolveClockValue($("meta[property='media:duration']:not([refines])", $metadata).text());
            jsonMetadata.mediaNarrator =  $("meta[property='media:narrator']", $metadata).text();
            jsonMetadata.mediaActiveClass =   $("meta[property='media:active-class']", $metadata).text();
            jsonMetadata.mediaPlaybackActiveClass =   $("meta[property='media:playback-active-class']", $metadata).text();
            
            return jsonMetadata;
        }

        function getJsonManifest(xmlDom) {

            var $manifestItems = $("manifest", xmlDom).children();
            var jsonManifest = [];

            $.each($manifestItems, function (manifestElementIndex, currManifestElement) {

                var $currManifestElement = $(currManifestElement);
                var currManifestElementHref = $currManifestElement.attr("href") ? $currManifestElement.attr("href") :
                    "";
                var manifestItem = {

                    contentDocumentURI: currManifestElementHref,
                    href: currManifestElementHref,
                    id: $currManifestElement.attr("id") ? $currManifestElement.attr("id") : "",
                    media_overlay: $currManifestElement.attr("media-overlay") ?
                        $currManifestElement.attr("media-overlay") : "",
                    media_type: $currManifestElement.attr("media-type") ? $currManifestElement.attr("media-type") : "",
                    properties: $currManifestElement.attr("properties") ? $currManifestElement.attr("properties") : ""
                };
                // console.log('pushing manifest item to JSON manifest. currManifestElementHref: [' + currManifestElementHref + 
                //     '], manifestItem.contentDocumentURI: [' + manifestItem.contentDocumentURI + 
                //     '], manifestItem:');
                // console.log(manifestItem);
                jsonManifest.push(manifestItem);
            });

            return jsonManifest;
        }

        function getJsonBindings(xmlDom) {

            var $bindings = $("bindings", xmlDom).children();
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
            manifest = xmlDom.getElementsByTagName('manifest')[0];

            // epub3 spec for a cover image is like this:
            /*<item properties="cover-image" id="ci" href="cover.svg" media-type="image/svg+xml" />*/
            $imageNode = $('item[properties~="cover-image"]', manifest);
            if ($imageNode.length === 1 && $imageNode.attr("href")) {
                return $imageNode.attr("href");
            }

            // some epub2's cover image is like this:
            /*<meta name="cover" content="cover-image-item-id" />*/
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

        function parseSpineProperties(spine) {

            var parsePropertiesString = function (str) {
                var properties = {};
                var allPropStrs = str.split(" "); // split it on white space
                for (var i = 0; i < allPropStrs.length; i++) {
                    // brute force!!!
                    //rendition:orientation landscape | portrait | auto
                    //rendition:spread none | landscape | portrait | both | auto

                    //rendition:page-spread-center
                    //page-spread | left | right
                    //rendition:layout reflowable | pre-paginated
                    if (allPropStrs[i] === "rendition:page-spread-center") properties.page_spread = "center";
                    if (allPropStrs[i] === "page-spread-left") properties.page_spread = "left";
                    if (allPropStrs[i] === "page-spread-right") properties.page_spread = "right";
                    if (allPropStrs[i] === "page-spread-right") properties.page_spread = "right";
                    if (allPropStrs[i] === "rendition:layout-reflowable") properties.fixed_flow = false;
                    if (allPropStrs[i] === "rendition:layout-pre-paginated") properties.fixed_flow = true;
                }
                return properties;

            };

            for (var i = 0; i < spine.length; i++) {
                var props = parsePropertiesString(spine[i].properties);
                // add all the properties to the spine item
                _.extend(spine[i], props);
            }
            return spine;
        }

        // resolve the url of smils on any manifest items that have a MO
        // attribute

        // NOTE: Removed media overlay support for the module refactoring

        // resolveMediaOverlays : function(manifest) {
        //     var that = this;
        //     var momap = {};

        //     // create a bunch of media overlay objects
        //     manifest.forEach( function(item) {
        //         if(item.get("media_type") === "application/smil+xml") {
        //             var url = that.resolveUri(item.get("href"));
        //             var moObject = new EpubParser.MediaOverlay();
        //             moObject.setUrl(url);
        //             moObject.fetch();
        //             momap[item.id] = moObject;
        //         }
        //     });
        //     return momap;
        // },

        // parse the EPUB3 `page-progression-direction` attribute
        function paginateBackwards (xmlDom) {

            return $('spine', xmlDom).attr('page-progression-direction') === "rtl";
        }
    };

    return PackageDocumentParser;
});
