// // These are from the fixed layout view?? Huh. Oh, yeah, they're from the epub module, but they're things that should happen in the 
// //    fixed layout. 
//     initialize : function () {

//         // If we encounter a new fixed layout section, we need to parse the 
//         // `<meta name="viewport">` to determine the size of the iframe
//         this.on("change:spine_position", this.setMetaSize, this);
//     },

//     // WTF is this?? This should go in the fixed layout view module
//     setMetaSize: function() {

//         if(this.meta_section) {
//             this.meta_section.off("change:meta_height", this.setMetaSize);
//         }
//         this.meta_section = this.getCurrentSection();
//         if(this.meta_section.get("meta_height")) {
//             this.set("meta_size", {
//                 width: this.meta_section.get("meta_width"),
//                 height: this.meta_section.get("meta_height")
//             });
//         }
//         this.meta_section.on("change:meta_height", this.setMetaSize, this);
//     },

