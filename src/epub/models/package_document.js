// Description: This model provides an interface for navigating an EPUB's package document
Epub.PackageDocument = Backbone.Model.extend({

    initialize : function (attributes, options) {

        this.Manifest = new Readium.Collections.Manifest({ });
        this.Spine = new Readium.Collections.Spine({ });
    },

    getManifestItemById : function(id) {
        return this.get("manifest").find(function(x) { 
                    if(x.get("id") === id) return x;
                });
    },

    getSpineItem : function(index) {
        return this.get("res_spine").at(index);
    },

    spineLength : function() {
        return this.get("res_spine").length;
    },

    // gets the next position in the spine for which the
    // spineItem does not have `linear='false'`. The start
    // param is the non-inclusive position to begin the search
    // from. If start is not supplied, the search will begin at
    // postion 0. If no linear position can be found, this 
    // funciton returns -1
    getNextLinearSpinePostition : function(start) {
        var spine = this.get("res_spine");
        if(start === undefined || start < -1) {
            start = -1;
        }

        while(start < spine.length - 1) {
            start += 1;
            if(spine.at(start).get("linear") !== "no") {
                return start;
            }
        }

        return -1;
    },

    // gets the previous position in the spine for which the
    // spineItem does not have `linear='false'`. The start
    // param is the non-inclusive position to begin the search
    // from. If start is not supplied, the search will begin at
    // the end of the spine. If no linear position can be found, 
    // this function returns -1
    getPrevLinearSpinePostition : function(start) {
        var spine = this.get("res_spine");
        if(start === undefined || start > spine.length) {
            start = spine.length;
        }

        while(start > 0) {
            start -= 1;
            if(spine.at(start).get("linear") !== "no") {
                return start;
            }
        }

        return -1;
    },

    spineIndexFromHref : function(href) {
        var spine = this.get("res_spine");
        href = this.resolveUri(href).replace(/#.*$/, "");
        for(var i = 0; i < spine.length; i++) {
            var path = spine.at(i).get("href");
            path = this.resolveUri(path).replace(/#.*$/, "");
            if(path === href) {
                return i;
            }
        }
        return -1;
    },

    getTocItem : function() {
        var manifest = this.get("manifest");
        var spine_id = this.get("metadata").ncx;
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
    },

    getMediaOverlayItem : function(idref) {
        // just look up the object in the mo_map
        var map = this.get("mo_map");
        return map && map[idref];
    },

    // combine the spine item data with the corresponding manifest
    // data to build useful set of backbone objects
    crunchSpine : function(spine, manifest) {
        //var bbSpine = new Readium.Collections.Spine(spine, {packageDocument: this});
        var that = this;
        var index = -1; // to keep track of the index of each spine item
        
        var bbSpine = _.map(spine, function(spineItem) {
            index += 1;
            
            var manItem = manifest.find(function(x) {
                if(x.get("id") === spineItem["idref"]) return x;
            });

            // crunch spine attrs and manifest attrs together into one obj
            var book = that.get("book");
            return _.extend({}, spineItem, manItem.attributes, {"spine_index": index}, {"page_prog_dir": book.get("page_prog_dir")});
        });

        // Add the index of the spine item to the manifest item's id to prevent the backbone collection
        //   from finding duplicate manifest items when different itemref elements in the spine reference
        //   the same manifest item through the "idref" attribute.
        $.each(bbSpine, function () {
            this.id = this.id + this.spine_index;
        });

        return new Readium.Collections.Spine(bbSpine, {packageDocument: this});
    },

    resolveUri : function(rel_uri) {
        uri = new URI(rel_uri);
        return uri.resolve(this.uri_obj).toString();
    },

    // reslove a relative file path to relative to this the
    // the path of this pack docs file path
    resolvePath : function(path) {
        var suffix;
        var pack_doc_path = this.file_path;
        if(path.indexOf("../") === 0) {
            suffix = path.substr(3);
        }
        else {
            suffix = path;
        }
        var ind = pack_doc_path.lastIndexOf("/")
        return pack_doc_path.substr(0, ind) + "/" + suffix;
    }
});
