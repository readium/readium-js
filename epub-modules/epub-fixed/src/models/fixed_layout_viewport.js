// // Description: This model contains logic taken from the manifest item model. It makes more sense that this logic be included as 
// //   part of the fixed layout module. 
// FixedLayoutViewport = Backbone.Model.extend({

//     parseMetaTags : function () {
//          var pageSize;
//         // only need to go through this one time, so only parse it
//         // if it is not already known
//         if (typeof this.get("meta_width") !== "undefined") {
//             return;
//         }

//         if (this.isSvg()) {
//             pageSize = this.parseViewboxTag();
//         }
//         else if (!this.isImage()) {
//             pageSize = this.parseViewportTag();
//         }

//         if (pageSize) {
//             this.set({"meta_width": pageSize.width, "meta_height": pageSize.height});
//         }
//     },

//     // REFACTORING CANDIDATE: I don't think this needs to/should be done here.

//     // for fixed layout xhtml we need to parse the meta viewport
//     // tag to determine the size of the pages. more info in the 
//     // [fixed layout spec](http://idpf.org/epub/fxl/#dimensions-xhtml-svg)
//     parseViewportTag : function () {
//         var dom = this.getContentDom();
//         if(!dom) {
//             return;
//         }
//         var viewportTag = $("[name='viewport']", dom)[0];
//         if(!viewportTag) {
//             return null;
//         }
//         // this is going to be ugly
//         var str = viewportTag.getAttribute('content');
//         str = str.replace(/\s/g, '');
//         var valuePairs = str.split(',');
//         var values = {};
//         var pair;
//         for(var i = 0; i < valuePairs.length; i++) {
//             pair = valuePairs[i].split('=');
//             if(pair.length === 2) {
//                 values[ pair[0] ] = pair[1];
//             }
//         }
//         values['width'] = parseFloat(values['width'], 10);
//         values['height'] = parseFloat(values['height'], 10);
//         return values;
//     },

//     // REFACTORING CANDIDATE: I don't think this needs to/should be done here.

//     // for fixed layout svg we need to parse the viewbox on the svg
//     // root tag to determine the size of the pages. more info in the 
//     // [fixed layout spec](http://idpf.org/epub/fxl/#dimensions-xhtml-svg)
//     parseViewboxTag : function () {

//         // The value of the ‘viewBox’ attribute is a list of four numbers 
//         // `<min-x>`, `<min-y>`, `<width>` and `<height>`, separated by 
//         // whitespace and/or a comma
//         var dom = this.getContentDom();
//         if(!dom) {
//             return;
//         }
//         var viewboxString = dom.documentElement.getAttribute("viewBox");
//         // split on whitespace and/or comma
//         var valuesArray = viewboxString.split(/,?\s+|,/);
//         var values = {};
//         values['width'] = parseFloat(valuesArray[2], 10);
//         values['height'] = parseFloat(valuesArray[3], 10);
//         return values;
//     }
// });

// These are the specs that go with this code. 

    // describe("parseViewboxTag()", function() {

    //     beforeEach(function() {

    //         var parser, xml_string;
    //         xml_string = jasmine.getFixtures().read('manifest_item.svg');
    //         parser = new window.DOMParser();
    //         this.dom = parser.parseFromString(xml_string, 'text/xml');
    //         this.man_item = new Epub.ManifestItem(this.man_item_attrs);
    //         spyOn(this.man_item, "getContentDom").andReturn(this.dom);
    //     });

    //     it("loads the dom", function() {

    //         this.man_item.parseViewboxTag();

    //         expect(this.man_item.getContentDom).toHaveBeenCalled();
    //     });

    //     it("parses the tag", function() {

    //         var result;
    //         result = this.man_item.parseViewboxTag();

    //         expect(result.width).toEqual(368);
    //         expect(result.height).toEqual(581);
    //     });
    // });