// `PackageDocumentParser` are used to parse the xml of an epub package
// document and build a javascript object. The constructor accepts an
// instance of `URI` that is used to resolve paths during the process
Helpers.PackageDocumentParser = Backbone.Model.extend({

    initialize : function (attributes, options) {
        this.uri_obj = this.get("uriObject");
    },

    // Parse an XML package document into a javascript object
    parse : function(xml_content) {

        var json, manifest, cover, xmlDom;
        if (typeof(xml_content) === "string" ) {
            var parser = new window.DOMParser;
            xmlDom = parser.parseFromString(xml_content, 'text/xml');
        }
        else {
            xmlDom = xml_content;
        }

        json = {};
        json.metadata = this.getJsonMetadata(xmlDom);
        json.bindings = this.getJsonBindings(xmlDom);
        json.spine = this.getJsonSpine(xmlDom);
        json.manifest = this.getJsonManifest(xmlDom);

        // parse the page-progression-direction if it is present
        json.paginate_backwards = this.paginateBackwards(xmlDom);

        // try to find a cover image
        cover = this.getCoverHref(xmlDom);
        if (cover) {
            json.metadata.cover_href = this.resolveUri(cover);
        }       
        if (json.metadata.layout === "pre-paginated") {
            json.metadata.fixed_layout = true;
        }
        
        // THIS SHOULD BE LEFT IN (BUT COMMENTED OUT), AS MO SUPPORT IS TEMPORARILY DISABLED
        // create a map of all the media overlay objects
        // json.mo_map = this.resolveMediaOverlays(json.manifest);

        // parse the spine into a proper collection
        json.spine = this.parseSpineProperties(json.spine);

        // return the parse result
        return json;
    },

    getJsonSpine : function (xmlDom) {

        var $spineElements;
        var jsonSpine = [];

        $spineElements = $("spine", xmlDom).children();
        $.each($spineElements, function (spineElementIndex, currSpineElement) {

            var $currSpineElement = $(currSpineElement);
            var spineItem = {

                idref : $currSpineElement.attr("idref") ? $currSpineElement.attr("idref") : "",
                linear : $currSpineElement.attr("linear") ? $currSpineElement.attr("linear") : "",
                properties : $currSpineElement.attr("properties") ? $currSpineElement.attr("properties") : ""
            };

            jsonSpine.push(spineItem);
        });

        return jsonSpine;
    },

    getJsonMetadata : function (xmlDom) {

        var $metadata = $("metadata", xmlDom);
        var jsonMetadata = {};

        jsonMetadata.active_class = $("meta[property='media:active-class']", $metadata).text();
        jsonMetadata.author = $("creator", $metadata).text();
        jsonMetadata.description = $("description", $metadata).text();
        jsonMetadata.epub_version = $("package", xmlDom).attr("version") ? $("package", xmlDom).attr("version") : "";
        jsonMetadata.id = $("identifier", $metadata).text();
        jsonMetadata.language = $("language", $metadata).text();
        jsonMetadata.layout = $("meta[property='rendition:layout']", $metadata).text();
        jsonMetadata.modified_date = $("meta[property='dcterms:modified']", $metadata).text();
        jsonMetadata.ncx = $("spine", xmlDom).attr("toc") ? $("spine", xmlDom).attr("toc") : "";
        jsonMetadata.orientation = $("meta[property='rendition:orientation']", $metadata).text();
        jsonMetadata.page_prog_dir = $("spine", xmlDom).attr("page-progression-direction") ? $("spine", xmlDom).attr("page-progression-direction") : "";
        jsonMetadata.pubdate = $("date", $metadata).text();
        jsonMetadata.publisher = $("publisher", $metadata).text();
        jsonMetadata.rights = $("rights").text();
        jsonMetadata.spread = $("meta[property='rendition:spread']", $metadata).text();
        jsonMetadata.title = $("title", $metadata).text();

        return jsonMetadata;
    },

    getJsonManifest : function (xmlDom) {

        var $manifestItems = $("manifest", xmlDom).children(); 
        var jsonManifest = [];

        $.each($manifestItems, function (manifestElementIndex, currManifestElement) {

            var $currManifestElement = $(currManifestElement);
            var manifestItem = {

                href : $currManifestElement.attr("href") ? $currManifestElement.attr("href") : "",
                id : $currManifestElement.attr("id") ? $currManifestElement.attr("id") : "", 
                media_overlay : $currManifestElement.attr("media-overlay") ? $currManifestElement.attr("media-overlay") : "",
                media_type : $currManifestElement.attr("media-type") ? $currManifestElement.attr("media-type") : "",
                properties : $currManifestElement.attr("properties") ? $currManifestElement.attr("properties") : ""
            };

            jsonManifest.push(manifestItem);
        });

        return jsonManifest;
    },

    getJsonBindings : function (xmlDom) {

        var $bindings = $("bindings", xmlDom).children();
        var jsonBindings = [];

        $.each($bindings, function (bindingElementIndex, currBindingElement) {

            var $currBindingElement = $(currBindingElement);
            var binding = {

                handler : $currBindingElement.attr("handler") ? $currBindingElement.attr("handler") : "" ,
                media_type : $currBindingElement.attr("media-type") ? $currBindingElement.attr("media-type") : "" 
            };

            jsonBindings.push(binding);
        });

        return jsonBindings;
    },

    getCoverHref : function(dom) {
        var manifest; var $imageNode;
        manifest = dom.getElementsByTagName('manifest')[0];

        // epub3 spec for a cover image is like this:
        /*<item properties="cover-image" id="ci" href="cover.svg" media-type="image/svg+xml" />*/
        $imageNode = $('item[properties~="cover-image"]', manifest);
        if($imageNode.length === 1 && $imageNode.attr("href") ) {
            return $imageNode.attr("href");
        }

        // some epub2's cover image is like this:
        /*<meta name="cover" content="cover-image-item-id" />*/
        var metaNode = $('meta[name="cover"]', dom);
        var contentAttr = metaNode.attr("content");
        if(metaNode.length === 1 && contentAttr) {
            $imageNode = $('item[id="'+contentAttr+'"]', manifest);
            if($imageNode.length === 1 && $imageNode.attr("href")) {
                return $imageNode.attr("href");
            }
        }

        // that didn't seem to work so, it think epub2 just uses item with id=cover
        $imageNode = $('#cover', manifest);
        if($imageNode.length === 1 && $imageNode.attr("href")) {
            return $imageNode.attr("href");
        }

        // seems like there isn't one, thats ok...
        return null;
    },

    parseSpineProperties : function(spine) {
        
        var parseProperiesString = function(str) {
            var properties = {};
            var allPropStrs = str.split(" "); // split it on white space
            for(var i = 0; i < allPropStrs.length; i++) {
                // brute force!!!
                //rendition:orientation landscape | portrait | auto
                //rendition:spread none | landscape | portrait | both | auto

                //rendition:page-spread-center 
                //page-spread | left | right
                //rendition:layout reflowable | pre-paginated
                if(allPropStrs[i] === "rendition:page-spread-center") properties.page_spread = "center";
                if(allPropStrs[i] === "page-spread-left") properties.page_spread = "left";
                if(allPropStrs[i] === "page-spread-right") properties.page_spread = "right";
                if(allPropStrs[i] === "page-spread-right") properties.page_spread = "right";
                if(allPropStrs[i] === "rendition:layout-reflowable") properties.fixed_flow = false;
                if(allPropStrs[i] === "rendition:layout-pre-paginated") properties.fixed_flow = true;
            }
            return properties;
            
        }

        for(var i = 0; i < spine.length; i++) {
            var props = parseProperiesString(spine[i].properties);
            // add all the properties to the spine item
            _.extend(spine[i], props);
        }
        return spine;
    },

    // resolve the url of smils on any manifest items that have a MO
    // attribute

    // Removed media overlay support for the module refactoring

    // resolveMediaOverlays : function(manifest) {
    //     var that = this;
    //     var momap = {};
        
    //     // create a bunch of media overlay objects
    //     manifest.forEach( function(item) {
    //         if(item.get("media_type") === "application/smil+xml") {
    //             var url = that.resolveUri(item.get("href"));
    //             var moObject = new Readium.Models.MediaOverlay();
    //             moObject.setUrl(url);
    //             moObject.fetch(); 
    //             momap[item.id] = moObject;
    //         }
    //     });
    //     return momap;
    // },

    // parse the EPUB3 `page-progression-direction` attribute
    paginateBackwards : function(xmlDom) {
        return $('spine', xmlDom).attr('page-progression-direction') === "ltr";
    },

    // convert a relative uri to a fully resolved one
    resolveUri : function(rel_uri) {
        uri = new URI(rel_uri);
        return uri.resolve(this.get("uriObject")).toString();
    }
});