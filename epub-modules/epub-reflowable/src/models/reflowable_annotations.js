define(['require', 'module', 'jquery', 'underscore', 'backbone', 'cfi_module'],
    function (require, module, $, _, Backbone, EpubCFIModule) {

        var ReflowableAnnotations = Backbone.Model.extend({

            defaults: {
                "saveCallback": undefined,
                "callbackContext": undefined
            },

            initialize: function (attributes, options) {
                this.epubCFI = new EpubCFIModule();
                // this.annotations = new EpubAnnotationsModule(0, 0, $("html", this.get("contentDocumentDOM"))[0]);
            },

            // Not sure about this, might remove it. The callbacks are unnecessary
            saveAnnotation: function (CFI, spinePosition) {

                var saveAnnotation = this.get("saveCallback");
                saveAnnotation.call(this.get("callbackContext"), CFI, spinePosition);
            },

            redraw: function () {

                // var leftAddition = -this.getPaginationLeftOffset();
                // this.annotations.redrawAnnotations(0, leftAddition);
            },

            // addHighlight : function (CFI, id) {

            //     var CFIRangeInfo;
            //     var range;
            //     var rangeStartNode;
            //     var rangeEndNode;
            //     var selectedElements;
            //     var leftAddition;
            //     var startMarkerHtml = this.getRangeStartMarker(CFI, id);
            //     var endMarkerHtml = this.getRangeEndMarker(CFI, id);

            //     try {
            //         CFIRangeInfo = this.epubCFI.injectRangeElements(
            //             CFI,
            //             this.get("contentDocumentDOM"),
            //             startMarkerHtml,
            //             endMarkerHtml,
            //             ["cfi-marker"]
            //             );

            //         // Get start and end marker for the id, using injected into elements
            //         // REFACTORING CANDIDATE: Abstract range creation to account for no previous/next sibling, for different types of
            //         //   sibiling, etc.
            //         rangeStartNode = CFIRangeInfo.startElement.nextSibling ? CFIRangeInfo.startElement.nextSibling : CFIRangeInfo.startElement;
            //         rangeEndNode = CFIRangeInfo.endElement.previousSibling ? CFIRangeInfo.endElement.previousSibling : CFIRangeInfo.endElement;
            //         range = document.createRange();
            //         range.setStart(rangeStartNode, 0);
            //         range.setEnd(rangeEndNode, rangeEndNode.length);

            //         selectionInfo = this.getSelectionInfo(range);
            //         leftAddition = -this.getPaginationLeftOffset();
            //         this.annotations.addHighlight(CFI, selectionInfo.selectedElements, id, 0, leftAddition);

            //         return {
            //             CFI : CFI,
            //             selectedElements : selectionInfo.selectedElements
            //         };

            //     } catch (error) {
            //         console.log(error.message);
            //     }
            // },

            // addBookmark : function (CFI, id) {

            //     var selectedElements;
            //     var bookmarkMarkerHtml = this.getBookmarkMarker(CFI, id);
            //     var $injectedElement;
            //     var leftAddition;

            //     try {
            //         $injectedElement = this.epubCFI.injectElement(
            //             CFI,
            //             this.get("contentDocumentDOM"),
            //             bookmarkMarkerHtml,
            //             ["cfi-marker"]
            //             );

            //         // Add bookmark annotation here
            //         leftAddition = -this.getPaginationLeftOffset();
            //         this.annotations.addBookmark(CFI, $injectedElement[0], id, 0, leftAddition);

            //         return {

            //             CFI : CFI,
            //             selectedElements : $injectedElement[0]
            //         };

            //     } catch (error) {
            //         console.log(error.message);
            //     }
            // },

            // addSelectionHighlight : function (id) {

            //     var highlightRange;
            //     var selectionInfo;
            //     var leftAddition;
            //     var currentSelection = this.getCurrentSelectionRange();
            //     if (currentSelection) {

            //         highlightRange = this.injectHighlightMarkers(currentSelection);
            //         selectionInfo = this.getSelectionInfo(highlightRange);
            //         leftAddition = -this.getPaginationLeftOffset();
            //         this.annotations.addHighlight(selectionInfo.CFI, selectionInfo.selectedElements, id, 0, leftAddition);
            //         return selectionInfo;
            //     }
            //     else {
            //         throw new Error("Nothing selected");
            //     }
            // },

            // addSelectionBookmark : function (id) {

            //     var marker;
            //     var partialCFI;
            //     var leftAddition;
            //     var currentSelection = this.getCurrentSelectionRange();
            //     if (currentSelection) {

            //         partialCFI = this.generateCharOffsetCFI(currentSelection);
            //         marker = this.injectBookmarkMarker(currentSelection);
            //         leftAddition = -this.getPaginationLeftOffset();
            //         this.annotations.addBookmark("", marker, id, 0, leftAddition);

            //         return {
            //             CFI : partialCFI,
            //             selectedElements : marker
            //         };
            //     }
            //     else {
            //         throw new Error("Nothing selected");
            //     }
            // },

            // getSelectionInfo : function (selectedRange) {

            //     // Generate CFI for selected text
            //     var CFI = this.generateRangeCFI(selectedRange);
            //     var intervalState = {
            //         startElementFound : false,
            //         endElementFound : false
            //     };
            //     var selectedElements = [];

            //     this.findSelectedElements(
            //         selectedRange.commonAncestorContainer,
            //         selectedRange.startContainer,
            //         selectedRange.endContainer,
            //         intervalState,
            //         selectedElements,
            //         "p"
            //         );

            //     // Return a list of selected text nodes and the CFI
            //     return {
            //         CFI : CFI,
            //         selectedElements : selectedElements
            //     };
            // },

            // generateRangeCFI : function (selectedRange) {

            //     var startNode = selectedRange.startContainer;
            //     var endNode = selectedRange.endContainer;
            //     var startOffset;
            //     var endOffset;
            //     var rangeCFIComponent;

            //     if (startNode.nodeType === Node.TEXT_NODE && endNode.nodeType === Node.TEXT_NODE) {

            //         startOffset = selectedRange.startOffset;
            //         endOffset = selectedRange.endOffset;

            //         rangeCFIComponent = this.epubCFI.generateCharOffsetRangeComponent(startNode, startOffset, endNode, endOffset);
            //         return rangeCFIComponent;
            //     }
            //     else {
            //         throw new Error("Selection start and end must be text nodes");
            //     }
            // },

            // generateCharOffsetCFI : function (selectedRange) {

            //     // Character offset
            //     var startNode = selectedRange.startContainer;
            //     var startOffset = selectedRange.startOffset;
            //     var charOffsetCFI;

            //     if (startNode.nodeType === Node.TEXT_NODE) {
            //         charOffsetCFI = this.epubCFI.generateCharacterOffsetCFIComponent(
            //             startNode,
            //             startOffset,
            //             ["cfi-marker"]
            //             );
            //     }
            //     return charOffsetCFI;
            // },

            findExistingLastPageMarker: function ($visibleTextNode) {

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
                } catch (e) {

                    console.log("Could not generate CFI for non-text node as first visible element on page");

                    // No need to execute the rest of the save position method if the first visible element is not a text node
                    return undefined;
                }
            },

            // REFACTORING CANDIDATE: Convert this to jquery
            findSelectedElements: function (currElement, startElement, endElement, intervalState, selectedElements,
                                            elementTypes) {

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
                    this.findSelectedElements(currElement.firstChild, startElement, endElement, intervalState,
                        selectedElements, elementTypes);
                    if (intervalState.endElementFound) {
                        return;
                    }
                }

                if (currElement.nextSibling) {
                    this.findSelectedElements(currElement.nextSibling, startElement, endElement, intervalState,
                        selectedElements, elementTypes);
                    if (intervalState.endElementFound) {
                        return;
                    }
                }
            },

            addElement: function (currElement, selectedElements, elementTypes) {

                // Check if the node is one of the types
                if (currElement.nodeType === Node.TEXT_NODE) {
                    selectedElements.push(currElement);
                }
            },

            // REFACTORING CANDIDATE: The methods here inject bookmark/highlight markers for the current selection, after
            //   which information for the selected range is generated and returned in an annotation "info" object. The
            //   injectedHighlightMarkers method leverages parts of the CFI library that should be private to that library; this
            //   is not ideal, and adds redundant, complex, code to the annotations delegate. A better method here would be to generate
            //   selection info, get the generated range CFI, and use that to inject markers. The only reason this wasn't done is
            //   because the CFI library did not support CFI range generation or injection when selection and highlighting was done.
            // injectBookmarkMarker : function (selectionRange, id) {

            //     var startNode = selectionRange.startContainer;
            //     var startOffset = selectionRange.startOffset;
            //     var $bookmarkMarker = $(this.getBookmarkMarker("", id));
            //     var highlightRange;

            //     this.epubCFI.injectElementAtOffset(
            //         $(startNode),
            //         startOffset,
            //         $bookmarkMarker
            //     );

            //     return $bookmarkMarker[0];
            // },

            // injectHighlightMarkers : function (selectionRange, id) {

            //     var highlightRange;
            //     if (selectionRange.startContainer === selectionRange.endContainer) {
            //         highlightRange = this.injectHighlightInSameNode(selectionRange, id);
            //     } else {
            //         highlightRange = this.injectHighlightsInDifferentNodes(selectionRange, id);
            //     }

            //     return highlightRange;
            // },

            // injectHighlightInSameNode : function (selectionRange, id) {

            //     var startNode;
            //     var startOffset = selectionRange.startOffset;
            //     var endNode = selectionRange.endContainer;
            //     var endOffset = selectionRange.endOffset;
            //     var $startMarker = $(this.getRangeStartMarker("", id));
            //     var $endMarker = $(this.getRangeEndMarker("", id));
            //     var highlightRange;

            //     // Rationale: The end marker is injected before the start marker because when the text node is split by the
            //     //   end marker first, the offset for the start marker will still be the same and we do not need to recalculate
            //     //   the offset for the newly created end node.

            //     // inject end marker
            //     this.epubCFI.injectElementAtOffset(
            //         $(endNode),
            //         endOffset,
            //         $endMarker
            //     );

            //     startNode = $endMarker[0].previousSibling;

            //     // inject start marker
            //     this.epubCFI.injectElementAtOffset(
            //         $(startNode),
            //         startOffset,
            //         $startMarker
            //     );

            //     // reconstruct range
            //     highlightRange = document.createRange();
            //     highlightRange.setStart($startMarker[0].nextSibling, 0);
            //     highlightRange.setEnd($endMarker[0].previousSibling, $endMarker[0].previousSibling.length - 1);

            //     return highlightRange;
            // },

            // injectHighlightsInDifferentNodes : function (selectionRange, id) {

            //     var startNode = selectionRange.startContainer;
            //     var startOffset = selectionRange.startOffset;
            //     var endNode = selectionRange.endContainer;
            //     var endOffset = selectionRange.endOffset;
            //     var $startMarker = $(this.getRangeStartMarker("", id));
            //     var $endMarker = $(this.getRangeEndMarker("", id));
            //     var highlightRange;

            //     // inject start
            //     this.epubCFI.injectElementAtOffset(
            //         $(startNode),
            //         startOffset,
            //         $startMarker
            //     );

            //     // inject end
            //     this.epubCFI.injectElementAtOffset(
            //         $(endNode),
            //         endOffset,
            //         $endMarker
            //     );

            //     // reconstruct range
            //     highlightRange = document.createRange();
            //     highlightRange.setStart($startMarker[0].nextSibling, 0);
            //     highlightRange.setEnd($endMarker[0].previousSibling, $endMarker[0].previousSibling.length - 1);

            //     return highlightRange;
            // },

            // Rationale: This is a cross-browser method to get the currently selected text
            getCurrentSelectionRange: function () {

                var currentSelection;
                var iframeDocument = this.get("contentDocumentDOM");
                if (iframeDocument.getSelection) {
                    currentSelection = iframeDocument.getSelection();

                    if (currentSelection.rangeCount) {
                        return currentSelection.getRangeAt(0);
                    }
                } else if (iframeDocument.selection) {
                    return iframeDocument.selection.createRange();
                } else {
                    return undefined;
                }
            },

            getPaginationLeftOffset: function () {

                var $htmlElement = $("html", this.get("contentDocumentDOM"));
                var offsetLeftPixels = $htmlElement.css("left");
                var offsetLeft = parseInt(offsetLeftPixels.replace("px", ""));
                return offsetLeft;
            },

            getBookmarkMarker: function (CFI, id) {

                return "<span class='bookmark-marker cfi-marker' id='" + id + "' data-cfi='" + CFI + "'></span>";
            },

            getRangeStartMarker: function (CFI, id) {

                return "<span class='range-start-marker cfi-marker' id='start-" + id + "' data-cfi='" + CFI +
                    "'></span>";
            },

            getRangeEndMarker: function (CFI, id) {

                return "<span class='range-end-marker cfi-marker' id='end-" + id + "' data-cfi='" + CFI + "'></span>";
            }
        });
        return ReflowableAnnotations;
    });
