define(['require', 'module', 'jquery', 'underscore', 'backbone', 'URIjs', './manifest', './spine', './metadata',
    './page_spread_property'],
    function (require, module, $, _, Backbone, URI, Manifest, Spine, Metadata, PageSpreadProperty) {
    console.log('package_document module id: ' + module.id);

    // Description: This model provides an interface for navigating an EPUB's package document
    var PackageDocument = function(packageDocumentURL, jsonData, resourceFetcher) {

        var _spine = new Spine(jsonData.spine);
        var _manifest = new Manifest(jsonData.manifest);
        var _metadata = new Metadata(jsonData.metadata);
        var _pageSpreadProperty = new PageSpreadProperty();
        var _moMap = jsonData.mo_map;

        // If this book is fixed layout, assign the page spread class
        if (isFixedLayout()) {
            assignPageSpreadClass();
        }

        this.getPackageData = function () {

            var spinePackageData = [];
            // _spine.each(function (spineItem) {
            //     spinePackageData.push(...);
            // });
            for (var i = 0; i < jsonData.spine.length; i++)
            {
                var spineItem = jsonData.spine[i];
                
                var manifestItem = getManifestModelByIdref(spineItem.idref);

                var spineInfo = {
                    href : manifestItem.get('contentDocumentURI'),
                    media_type : manifestItem.get('media_type'),
                    media_overlay_id : manifestItem.get('media_overlay'),
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
                rendition_layout : _metadata.get("layout"),
                rendition_orientation : _metadata.get("orientation"),
                rendition_layout : _metadata.get("layout"),
                media_overlay : getMediaOverlay(),
                spine : {
                    direction : pageProgressionDirection(),
                    items : spinePackageData
                }
            };
        };

        function getMediaOverlay(){
           var result = {
                 duration : _metadata.get('mediaDuration'),
                 narrator : _metadata.get('mediaNarrator'),
                 activeClass : _metadata.get('mediaActiveClass'),
                 playbackActiveClass : _metadata.get('mediaPlaybackActiveClass'),
                 smil_models : _moMap,
                 
                 skippables: ["sidebar", "practice", "marginalia", "annotation", "help", "note", "footnote", "rearnote", "table", "table-row", "table-cell", "list", "list-item", "pagebreak"],
                 escapables: ["sidebar", "bibliography", "toc", "loi", "appendix", "landmarks", "lot", "index", "colophon", "epigraph", "conclusion", "afterword", "warning", "epilogue", "foreword", "introduction", "prologue", "preface", "preamble", "notice", "errata", "copyright-page", "acknowledgments", "other-credits", "titlepage", "imprimatur", "contributors", "halftitlepage", "dedication", "help", "annotation", "marginalia", "practice", "note", "footnote", "rearnote", "footnotes", "rearnotes", "bridgehead", "page-list", "table", "table-row", "table-cell", "list", "list-item", "glossary"]
           };

           return result;
        }
        
        function isFixedLayout() {

            return _metadata.get("fixed_layout");
        }

        function pageProgressionDirection() {

            if (_metadata.get("page_prog_dir") === "rtl") {
                return "rtl";
            }
            else if (_metadata.get("page_prog_dir") === "default") {
                return "default";
            }
            else {
                return "ltr";
            }
        }

        this.getToc = function() {
            var item = getTocItem();
            if (item) {
                return item.get("contentDocumentURI");
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
            var contentDocURI = tocItem.get("contentDocumentURI");
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

        function getManifestModelByIdref(idref) {

            var foundManifestItem = _manifest.find(
                function (manifestItem) {
                    if (manifestItem.get("id") === idref) {
                        return manifestItem;
                    }
                });

            return foundManifestItem;
        }

        // Description: When rendering fixed layout pages we need to determine whether the page
        //   should be on the left or the right in two up mode, options are:
        //     left_page:      render on the left side
        //     right_page:     render on the right side
        //     center_page:    always center the page horizontally
        //   This property must be assigned when the package document is initialized
        // NOTE: Look into how spine items with the linear="no" property affect this algorithm
        function assignPageSpreadClass() {

            var pageSpreadClass;
            var numSpineItems;

            // If the epub is apple fixed layout
            if (_metadata.get("apple_fixed")) {

                numSpineItems = _spine.length;
                _spine.each(function (spineItem, spineIndex) {

                    pageSpreadClass = _pageSpreadProperty.inferiBooksPageSpread(spineIndex, numSpineItems);
                    spineItem.set({ pageSpreadClass : pageSpreadClass });
                });
            }
            else {
                // For each spine item
                _spine.each(function (spineItem, spineIndex) {

                    if (spineItem.get("page_spread")) {

                        pageSpreadClass = _pageSpreadProperty.getPageSpreadFromProperties(spineItem.get("page_spread"));
                        spineItem.set({ pageSpreadClass : pageSpreadClass });
                    }
                    else {

                        pageSpreadClass = _pageSpreadProperty.inferUnassignedPageSpread(spineIndex, _spine, pageProgressionDirection());
                        spineItem.set({ pageSpreadClass : pageSpreadClass });
                    }
                });
            }
        }

        function getTocItem(){

            var manifest = _manifest;
            var spine_id = _metadata.get("ncx");

            var item = manifest.find(function(item){

                if (item.get("properties").indexOf("nav") !== -1) {
                    return true;
                }
                else {
                    return false;
                }
            });

            if( item ) {
                return item;
            }

            if( spine_id && spine_id.length > 0 ) {
                return manifest.find(function(item) {
                    return item.get("id") === spine_id;
                });
            }

            return null;
        }

        // NOTE: Media overlays are temporarily disabled
        // getMediaOverlayItem : function(idref) {
        //     // just look up the object in the mo_map
        //     var map = this.get("mo_map");
        //     return map && map[idref];
        // },

    };

    return PackageDocument;
});
