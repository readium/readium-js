EpubReflowable.ReflowableAnnotations = Backbone.Model.extend({

    defaults : {
        "saveCallback" : undefined,
        "callbackContext" : undefined
    },

    initialize : function () {},

    saveAnnotation : function (CFI, spinePosition) {

        var saveAnnotation = this.get("saveCallback");
        saveAnnotation.call(this.get("callbackContext"), CFI, spinePosition);
    },

    generateCharacterOffsetCFI : function (characterOffset, $startElement, spineItemIdref, packageDocumentDom) {

        // Save the position marker
        generatedCFI = EPUBcfi.Generator.generateCharacterOffsetCFI(
            $startElement,
            characterOffset, 
            spineItemIdref, 
            packageDocumentDom, 
            ["cfi-marker", "audiError"], 
            [], 
            ["MathJax_Message"]);
        return generatedCFI;
    },

    findExistingLastPageMarker : function ($visibleTextNode) {

        // Check if a last page marker already exists on this page
        try {
            
            var existingCFI = undefined;
            $.each($visibleTextNode.parent().contents(), function () {

                if ($(this).hasClass("last-page")) {
                    lastPageMarkerExists = true;
                    existingCFI = $(this).attr("data-last-page-cfi");

                    // Break out of loop
                    return false;
                }
            });

            return existingCFI;
        }
        catch (e) {

            console.log("Could not generate CFI for non-text node as first visible element on page");

            // No need to execute the rest of the save position method if the first visible element is not a text node
            return undefined;
        }
    }
});