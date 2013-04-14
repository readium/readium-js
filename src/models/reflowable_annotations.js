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

    getSelectionInfo : function (selectedRange) {

        // Get start and end text nodes and offsets
        debugger;
        var startTextNode = "";
        var endTextNode = "";

        // Generate CFI for selected text
        var CFI = "";

        this.findSelectedElements(selectedRange.startContainer, selectedRange.endContainer);

        // Add start and end text nodes and offsets to the info object

        // Return a list of selected text nodes and the CFI
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
    },

    // REFACTORING CANDIDATE: Convert this to jquery, and think about moving it to its own model
    findSelectedElements : function (currElement, startElement, endElement, intervalState, selectedElements, elementTypes) {

        // Check if this is the start node
        if (currElement === startElement) {
            intervalState.startElementFound = true;
        }

        if (intervalState.startElementFound === true) {
            this.addElement(currElement, selectedElements, elementTypes);
        }

        if (currElement === endElement) {
            intervalState.endElementFound = true;
            return;
        }

        if (currElement.firstChild) {
            this.findSelectedElements(currElement.firstChild, startElement, endElement, intervalState, selectedElements, elementTypes);
            if (intervalState.endElementFound) {
                return;
            }
        }

        if (currElement.nextSibling) {
            this.findSelectedElements(currElement.nextSibling, startElement, endElement, intervalState, selectedElements, elementTypes);
            if (intervalState.endElementFound) {
                return;
            }
        }
    },

    addElement : function (currElement, selectedElements, elementTypes) {

        // Check if the node is one of the types
        if (currElement.tagName === "DIV") {
            selectedElements.push(currElement);
        }
    }
});
