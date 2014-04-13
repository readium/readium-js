define(['require', 'module', 'jquery', 'underscore', 'backbone', 'epub-fetch/markup_parser', 'URIjs', './package_document', './smil_document_parser'],
    function (require, module, $, _, Backbone, MarkupParser, URI, PackageDocument, SmilParser) {

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

        function fillSmilData(packageDocJson, callback) {

            SmilParser.fillSmilData(packageDocJson, publicationFetcher, function() {
                var packageDocument = new PackageDocument(publicationFetcher.getPackageUrl(), packageDocJson, publicationFetcher);
                // return the parse result
                callback(packageDocJson, packageDocument);
            });

        }

        // Parse an XML package document into a javascript object
        this.parse = function(callback) {

            _deferredXmlDom.done(function (xmlDom) {
                var packageDocJson, cover;

                packageDocJson = {};
                packageDocJson.metadata = getJsonMetadata(xmlDom);
                packageDocJson.bindings = getJsonBindings(xmlDom);
                packageDocJson.spine = getJsonSpine(xmlDom);
                packageDocJson.manifest = getJsonManifest(xmlDom);

                // parse the page-progression-direction if it is present
                packageDocJson.paginate_backwards = paginateBackwards(xmlDom);

                // try to find a cover image
                cover = getCoverHref(xmlDom);
                if (cover) {
                    packageDocJson.metadata.cover_href = cover;
                }

                $.when(updateMetadataWithIBookProperties(packageDocJson.metadata)).then(function() {

                    if (packageDocJson.metadata.layout === "pre-paginated") {
                        packageDocJson.metadata.fixed_layout = true;
                    }

                    // parse the spine into a proper collection
                    packageDocJson.spine = parseSpineProperties(packageDocJson.spine);

                    _packageFetcher.setPackageJson(packageDocJson, function () {
                        fillSmilData(packageDocJson, callback);
                    });
                });

            });
        };

        function updateMetadataWithIBookProperties(metadata) {

            var dff = $.Deferred();

            //if layout not set
            if(!metadata.layout)
            {
                var pathToIBooksSpecificXml = new URI("/META-INF/com.apple.ibooks.display-options.xml");

                publicationFetcher.relativeToPackageFetchFileContents(pathToIBooksSpecificXml, 'text', function (ibookPropText) {
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

        function getJsonMetadata(xmlDom) {

            var $metadata = $("metadata", xmlDom);
            var metadataElem = xmlDom.getElementsByTagNameNS("*", "metadata")[0];
            var jsonMetadata = {};

            jsonMetadata.author = getElemText(metadataElem, "creator");
            jsonMetadata.description = getElemText(metadataElem, "description");
            // TODO: Convert all jQuery queries (that get confused by XML namespaces on Firefox) to getElementsByTagNameNS().
            jsonMetadata.epub_version =
                $("package", xmlDom).attr("version") ? $("package", xmlDom).attr("version") : "";
            jsonMetadata.id = getElemText(metadataElem,"identifier");
            jsonMetadata.language = getElemText(metadataElem, "language");
            jsonMetadata.modified_date = $("meta[property='dcterms:modified']", $metadata).text();
            jsonMetadata.ncx = $("spine", xmlDom).attr("toc") ? $("spine", xmlDom).attr("toc") : "";
            jsonMetadata.page_prog_dir = $("spine", xmlDom).attr("page-progression-direction") ?
                $("spine", xmlDom).attr("page-progression-direction") : "";
            jsonMetadata.pubdate = getElemText(metadataElem, "date");
            jsonMetadata.publisher = getElemText(metadataElem, "publisher");
            jsonMetadata.rights = getElemText(metadataElem, "rights");
            jsonMetadata.title = getElemText(metadataElem, "title");
            

            jsonMetadata.orientation = $("meta[property='rendition:orientation']", $metadata).text();
            jsonMetadata.layout = $("meta[property='rendition:layout']", $metadata).text();
            jsonMetadata.spread = $("meta[property='rendition:spread']", $metadata).text();
            
            
            // Media part
            jsonMetadata.mediaItems = [];

            var $overlays = $("meta[property='media:duration'][refines]", $metadata);

            $.each($overlays, function(elementIndex, $currItem) {
               jsonMetadata.mediaItems.push({
                  refines: $currItem.getAttribute("refines"),
                  duration: SmilParser.resolveClockValue($($currItem).text())
               });
            });
               
            jsonMetadata.mediaDuration =  SmilParser.resolveClockValue($("meta[property='media:duration']:not([refines])", $metadata).text());
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

            };

            for (var i = 0; i < spine.length; i++) {

                var props = parsePropertiesString(spine[i].properties);
                // add all the properties to the spine item
                _.extend(spine[i], props);
            }

            return spine;
        }

        // parse the EPUB3 `page-progression-direction` attribute
        function paginateBackwards (xmlDom) {

            return $('spine', xmlDom).attr('page-progression-direction') === "rtl";
        }
    };

    return PackageDocumentParser;
});
