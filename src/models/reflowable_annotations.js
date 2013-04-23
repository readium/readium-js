EpubReflowable.ReflowableAnnotations = Backbone.Model.extend({

    defaults : {
        "saveCallback" : undefined,
        "callbackContext" : undefined
    },

    initialize : function () {
        this.epubCFI = new EpubCFIModule();
    },

    // Not sure about this, might remove it. The callbacks are unnecessary
    saveAnnotation : function (CFI, spinePosition) {

        var saveAnnotation = this.get("saveCallback");
        saveAnnotation.call(this.get("callbackContext"), CFI, spinePosition);
    },

    injectHighlightMarkersFromCFI : function (CFI, id) {

        var CFIRangeInfo;
        var range;
        var rangeStartNode;
        var rangeEndNode;
        var selectedElements;
        var startMarkerHtml = this.getRangeStartMarker(CFI, id);
        var endMarkerHtml = this.getRangeEndMarker(CFI, id);

        try {
            CFIRangeInfo = this.epubCFI.injectRangeElements(
                CFI,
                this.get("contentDocumentDOM"),
                startMarkerHtml,
                endMarkerHtml,
                ["cfi-marker"]
                );

            // Get start and end marker for the id, using injected into elements
            // REFACTORING CANDIDATE: Abstract range creation to account for no previous/next sibling, for different types of
            //   sibiling, etc. 
            rangeStartNode = CFIRangeInfo.startElement.nextSibling ? CFIRangeInfo.startElement.nextSibling : CFIRangeInfo.startElement;
            rangeEndNode = CFIRangeInfo.endElement.previousSibling ? CFIRangeInfo.endElement.previousSibling : CFIRangeInfo.endElement;
            range = document.createRange();
            range.setStart(rangeStartNode, 0);
            range.setEnd(rangeEndNode, rangeEndNode.length);

            selectionInfo = this.getSelectionInfo(range);

            return {
                CFI : CFI, 
                selectedElements : selectionInfo.selectedElements
            };

        } catch (error) {
            console.log(error);
        }
    },

    injectBookmarkMarkerFromCFI : function (CFI, id) {

        var selectedElements;
        var bookmarkMarkerHtml = this.getBookmarkMarker(CFI, id);
        var injectedElement;

        try {
            injectedElement = this.epubCFI.injectElement(
                CFI,
                this.get("contentDocumentDOM"),
                bookmarkMarkerHtml,
                ["cfi-marker"]
                );

            return {

                CFI : CFI, 
                selectedElements : injectedElement
            };

        } catch (error) {
            console.log(error);
        }
    },

    getSelectionInfo : function (selectedRange) {

        // Generate CFI for selected text
        var CFI = this.generateRangeCFI(selectedRange);
        var intervalState = {
            startElementFound : false,
            endElementFound : false
        };
        var selectedElements = [];

        this.findSelectedElements(
            selectedRange.commonAncestorContainer, 
            selectedRange.startContainer, 
            selectedRange.endContainer,
            intervalState,
            selectedElements, 
            "p"
            );

        // Return a list of selected text nodes and the CFI
        return {
            CFI : CFI,
            selectedElements : selectedElements
        };
    },

    generateRangeCFI : function (selectedRange) {

        var startNode = selectedRange.startContainer;
        var endNode = selectedRange.endContainer;
        var startOffset;
        var endOffset;
        var rangeCFIComponent;

        if (startNode.nodeType === Node.TEXT_NODE && endNode.nodeType === Node.TEXT_NODE) {

            startOffset = selectedRange.startOffset;
            endOffset = selectedRange.endOffset;

            rangeCFIComponent = this.epubCFI.generateCharOffsetRangeComponent(startNode, startOffset, endNode, endOffset);
            return rangeCFIComponent;
        }
        else {
            throw new Error("Selection start and end must be text nodes");
        }
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

    // REFACTORING CANDIDATE: Convert this to jquery
    findSelectedElements : function (currElement, startElement, endElement, intervalState, selectedElements, elementTypes) {

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
        if (currElement.nodeType === Node.TEXT_NODE) {
            selectedElements.push(currElement);
        }
    },

    // 
    injectHighlightMarkers : function (selectionRange) {

        var highlightRange;
        if (selectionRange.startContainer === selectionRange.endContainer) {
            highlightRange = this.injectHighlightInSameNode(selectionRange);
        } else {
            highlightRange = this.injectHighlightsInDifferentNodes(selectionRange);
        }

        return highlightRange;
    },

    injectHighlightInSameNode : function (selectionRange) {

        var startNode;
        var startOffset = selectionRange.startOffset;
        var endNode = selectionRange.endContainer;
        var endOffset = selectionRange.endOffset;
        var $startMarker = $("<span id='highlight-start-epubcfi(1)'></span>");
        var $endMarker = $("<span id='highlight-start-epubcfi(2)'></span>");
        var highlightRange;

        // Rationale: The end marker is injected before the start marker because when the text node is split by the 
        //   end marker first, the offset for the start marker will still be the same and we do not need to recalculate 
        //   the offset for the newly created end node.

        // inject end marker
        this.epubCFI.injectElementAtOffset(
            $(endNode), 
            endOffset,
            $endMarker
        );

        startNode = $endMarker[0].previousSibling;

        // inject start marker
        this.epubCFI.injectElementAtOffset(
            $(startNode), 
            startOffset,
            $startMarker
        );

        // reconstruct range
        highlightRange = document.createRange();
        highlightRange.setStart($startMarker[0].nextSibling, 0);
        highlightRange.setEnd($endMarker[0].previousSibling, $endMarker[0].previousSibling.length - 1);

        return highlightRange;
    },

    injectHighlightsInDifferentNodes : function (selectionRange) {

        var startNode = selectionRange.startContainer;
        var startOffset = selectionRange.startOffset;
        var endNode = selectionRange.endContainer;
        var endOffset = selectionRange.endOffset;
        var $startMarker = $("<span id='highlight-start-epubcfi(1)'></span>");
        var $endMarker = $("<span id='highlight-start-epubcfi(2)'></span>");
        var highlightRange;

        // inject start
        this.epubCFI.injectElementAtOffset(
            $(startNode), 
            startOffset,
            $startMarker
        );

        // inject end
        this.epubCFI.injectElementAtOffset(
            $(endNode), 
            endOffset,
            $endMarker
        );

        // reconstruct range
        highlightRange = document.createRange();
        highlightRange.setStart($startMarker[0].nextSibling, 0);
        highlightRange.setEnd($endMarker[0].previousSibling, $endMarker[0].previousSibling.length - 1);

        return highlightRange;
    },

    getBookmarkMarker : function (CFI, id) {

        return "<span class='bookmark-marker cfi-marker' id='" + id + "' data-cfi='" + CFI + "'></span>";
    },

    getRangeStartMarker : function (CFI, id) {

        return "<span class='range-start-marker cfi-marker' id='start-" + id + "' data-cfi='" + CFI + "'></span>";
    },

    getRangeEndMarker : function (CFI, id) {

        return "<span class='range-end-marker cfi-marker' id='end-" + id + "' data-cfi='" + CFI + "'></span>";
    }
});
