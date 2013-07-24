define(['require', 'module', 'jquery', 'underscore', 'backbone'], function (require, module, $, _, Backbone) {

    var ReflowableElementInfo = Backbone.Model.extend({

        initialize: function () {
        },

        // ------------------------------------------------------------------------------------ //
        //  "PUBLIC" METHODS (THE API)                                                          //
        // ------------------------------------------------------------------------------------ //

        getElemPageNumber: function (elem, offsetDir, pageWidth, gapWidth, epubContentDocument) {

            var $elem;
            var elemWasInvisible = false;
            var rects, shift;
            var elemRectWidth;

            // Rationale: Elements with an epub:type="pagebreak" attribute value are likely to be set as
            //   display:none, as they indicate the end of a page in the corresponding physical version of a book. We need
            //   the position of these elements to get the reflowable page number to set in the viewer. Therefore,
            //   we check if the element has this epub:type value, set it visible, find its location and then set it to
            //   display:none again.
            // REFACTORING CANDIDATE: We might want to do this for any element with display:none.
            $elem = $(elem);
            if ($elem.attr("epub:type") === "pagebreak" && !$elem.is(":visible")) {

                elemWasInvisible = true;
                $elem.show();
            }

            rects = elem.getClientRects();
            if (!rects || rects.length < 1) {
                // if there were no rects the elem had display none
                return -1;
            }

            shift = rects[0][offsetDir];

            // calculate to the center of the elem
            // Rationale: The -1 or +1 adjustment is to account for the case in which the target element for which the shift offset
            //   is calculated is at the edge of a page and has 0 width. In this case, if a minor arbitrary adjustment is not applied,
            //   the calculated page number will be off by 1.
            elemRectWidth = rects[0].left - rects[0].right;
            if (offsetDir === "right" && elemRectWidth === 0) {
                shift -= 1;
            } else if (offsetDir === "left" && elemRectWidth === 0) {
                shift += 1;
            } // Rationale: There shouldn't be any other case here. The explict second (if else) condition is for clarity.
            shift += Math.abs(elemRectWidth);

            // Re-hide the element if it was original set as display:none
            if (elemWasInvisible) {
                $elem.hide();
            }

            // `clientRects` are relative to the top left corner of the frame, but
            // for right to left we actually need to measure relative to right edge
            // of the frame
            if (offsetDir === "right") {
                // the right edge is exactly `this.page_width` pixels from the right
                // edge
                shift = pageWidth - shift;
            }
            // less the amount we already shifted to get to cp
            shift -= parseInt(epubContentDocument.style[offsetDir], 10);
            return Math.ceil(shift / (pageWidth + gapWidth));
        },

        getElemPageNumberById: function (elemId, epubContentDocument, offsetDir, pageWidth, gapWidth) {

            var elem = $(epubContentDocument).find("#" + elemId);
            if (elem.length == 0) {
                return -1;
            } else {
                return this.getElemPageNumber(elem[0], offsetDir, pageWidth, gapWidth, epubContentDocument);
            }
        },

        // Currently for left-to-right pagination only
        findVisibleCharacterOffset: function ($textNode, epubContentDocument) {

            var $parentNode;
            var elementTop;
            var elementBottom;
            var POSITION_ERROR_MARGIN = 5;
            var $document;
            var documentTop;
            var documentBottom;
            var percentOfTextOffPage;
            var characterOffset;

            // Get parent; text nodes do not have visibility properties.
            $parentNode = $textNode.parent();

            // Get document
            $document = $(epubContentDocument);

            // Find percentage of visible node on page
            documentTop = $document.position().top;
            documentBottom = documentTop + $document.height();

            elementTop = $parentNode.offset().top;
            elementBottom = elementTop + $parentNode.height();

            // Element overlaps top of the page
            if (elementTop < documentTop) {

                percentOfTextOffPage = Math.abs(elementTop - documentTop) / $parentNode.height();
                characterOffsetByPercent = Math.ceil(percentOfTextOffPage * $textNode[0].length);
                characterOffset =
                    Math.ceil(0.5 * ($textNode[0].length - characterOffsetByPercent)) + characterOffsetByPercent;
            }
            // Element is full on the page
            else if (elementTop >= documentTop && elementTop <= documentBottom) {
                characterOffset = 1;
            }
            // Element overlaps bottom of the page
            else if (elementTop < documentBottom) {
                characterOffset = 1;
            }

            return characterOffset;
        },

        // TODO: Extend this to be correct for right-to-left pagination
        findVisibleTextNode: function (epubContentDocument, isTwoUp, columnGap, columnWidth) {

            var documentLeft = 0;
            var documentRight;
            var doc;
            var $elements;
            var $firstVisibleTextNode;

            // Rationale: The intention here is to get a list of all the text nodes in the document, after which we'll
            //   reduce this to the subset of text nodes that is visible on the page. We'll then select one text node
            //   for which we can create a character offset CFI. This CFI will then refer to a "last position" in the
            //   EPUB, which can be used if the reader re-opens the EPUB.
            // REFACTORING CANDIDATE: The "audiError" check is a total hack to solve a problem for a particular epub. This
            //   issue needs to be addressed.
            $elements = $("body", epubContentDocument).find(":not(iframe)").contents().filter(function () {
                if (this.nodeType === 3 && !$(this).parent().hasClass("audiError")) {
                    return true;
                } else {
                    return false;
                }
            });

            doc = epubContentDocument;

            if (isTwoUp) {
                documentRight = documentLeft + columnGap + (columnWidth * 2);
            } else {
                documentRight = documentLeft + $(doc).width();
            }

            // Find the first visible text node
            $.each($elements, function () {

                var POSITION_ERROR_MARGIN = 5;
                var $textNodeParent = $(this).parent();
                var elementLeft = $textNodeParent.position().left;
                var elementRight = elementLeft + $textNodeParent.width();
                var nodeText;

                // Correct for minor right and left position errors
                elementLeft = Math.abs(elementLeft) < POSITION_ERROR_MARGIN ? 0 : elementLeft;
                elementRight =
                    Math.abs(elementRight - documentRight) < POSITION_ERROR_MARGIN ? documentRight : elementRight;

                // Heuristics to find a text node with actual text
                nodeText = this.nodeValue.replace(/\n/g, "");
                nodeText = nodeText.replace(/ /g, "");

                if (elementLeft <= documentRight && elementRight >= documentLeft && nodeText.length > 10) { // 10 is so the text node is actually a text node with writing - probably

                    $firstVisibleTextNode = $(this);

                    // Break the loop
                    return false;
                }
            });

            return $firstVisibleTextNode;
        },

        // The package document needs to get passed into the view, or the API needs to change. This is not critical at the moment.
        //
        // // Description: Generates a CFI for an element is that is currently visible on the page. This CFI and a last-page payload
        // //   is then saved for the current EPUB.
        // savePosition : function () {

        //     var $visibleTextNode;
        //     var CFI;

        //     // Get first visible element with a text node
        //     $visibleTextNode = this.reflowableElementsInfo.findVisibleTextNode(
        //         this.getEpubContentDocument(),
        //         this.viewerModel.get("two_up"),
        //         // REFACTORING CANDIDATE: These two properties should be stored another way. This should be
        //         //   temporary.
        //         this.reflowablePaginator.gap_width,
        //         this.reflowablePaginator.page_width
        //         );

        //     CFI = this.annotations.findExistingLastPageMarker($visibleTextNode);
        //     if (!CFI) {

        //      CFI = this.annotations.generateCharacterOffsetCFI(
        //          this.reflowableElementsInfo.findVisibleCharacterOffset($visibleTextNode, this.getEpubContentDocument()),
        // $visibleTextNode[0],
        // this.spineItemModel.get("idref"),
        // this.epubController.getPackageDocumentDOM()
        //       );
        //     }
        //     this.annotations.saveAnnotation(CFI, this.spineItemModel.get("spine_index"));
        // },

        findVisiblePageElements: function (flowingWrapper, epubContentDocument) {

            var $elements = $(epubContentDocument).find("[id]");
            var doc = epubContentDocument;
            var doc_top = 0;
            var doc_left = 0;
            var doc_right = doc_left + $(doc).width();
            var doc_bottom = doc_top + $(doc).height();

            var visibleElms = this.filterElementsByPosition(flowingWrapper, $elements, doc_top, doc_bottom, doc_left,
                doc_right);

            return visibleElms;
        },

        // ------------------------------------------------------------------------------------ //
        //  "PRIVATE" HELPERS                                                                   //
        // ------------------------------------------------------------------------------------ //

        // returns all the elements in the set that are inside the box
        filterElementsByPosition: function (flowingWrapper, $elements, documentTop, documentBottom, documentLeft,
                                            documentRight) {

            var $visibleElms = $elements.filter(function (idx) {
                var elm_top = $(flowingWrapper).offset().top;
                var elm_left = $(flowingWrapper).offset().left;
                var elm_right = elm_left + $(flowingWrapper).width();
                var elm_bottom = elm_top + $(flowingWrapper).height();

                var is_ok_x = elm_left >= documentLeft && elm_right <= documentRight;
                var is_ok_y = elm_top >= documentTop && elm_bottom <= documentBottom;

                return is_ok_x && is_ok_y;
            });

            return $visibleElms;
        }
    });
    return ReflowableElementInfo;
});