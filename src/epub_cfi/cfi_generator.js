EPUBcfi.Generator = {

    // Description: Generates a character offset CFI 
    // Arguments: The text node that contains the offset referenced by the cfi, the offset value, the name of the 
    //   content document that contains the text node, the package document for this EPUB.
    generateCharacterOffsetCFI : function (startTextNode, characterOffset, contentDocumentName, packageDocument, classBlacklist, elementBlacklist, idBlacklist) {

        // ------------------------------------------------------------------------------------ //
        //  "PUBLIC" METHODS (THE API)                                                          //
        // ------------------------------------------------------------------------------------ //

        var contentDocCFI;
        var $itemRefStartNode;
        var packageDocCFI;

        // start text node IS a text node
        if (!startTextNode) {
            throw new EPUBcfi.NodeTypeError(startTextNode, "Cannot generate a character offset from a starting point that is not a text node");
        } else if (startTextNode.nodeType != 3) {
            throw new EPUBcfi.NodeTypeError(startTextNode, "Cannot generate a character offset from a starting point that is not a text node");
        }

        // character offset within a range
        if (characterOffset < 0) {
            throw new EPUBcfi.OutOfRangeError(characterOffset, 0, "Character offset cannot be less than 0");
        }
        else if (characterOffset > startTextNode.nodeValue.length) {
            throw new EPUBcfi.OutOfRangeError(characterOffset, startTextNode.nodeValue.length - 1, "character offset cannot be greater than the length of the text node");
        }

        // content document name is non-empty
        if (!contentDocumentName) {
            throw new Error("The idref for the content document, as found in the spine, must be supplied");
        }

        // package document is non-empty and contains a package element
        if (!packageDocument) {
            throw new Error("A package document must be supplied to generate a CFI");
        }
        else if ($($("itemref[idref=" + contentDocumentName + "]", packageDocument)[0]).length === 0) {
            throw new Error("The idref of the content document could not be found in the spine");
        }

        // call the recursive function to get all the steps until the top of the content document
        contentDocCFI = this.createCFIElementSteps($(startTextNode), characterOffset, 'html', classBlacklist, elementBlacklist, idBlacklist);

        // Get the start node (itemref element) that references the content document
        $itemRefStartNode = $("itemref[idref=" + contentDocumentName + "]", $(packageDocument));

        // Get the steps to the top of the package document
        packageDocCFI = this.createCFIElementSteps($itemRefStartNode, characterOffset, "package", classBlacklist, elementBlacklist, idBlacklist);

        // Return the CFI with "epubcfi()" appended. Could use the parser to check its validity.
        return "epubcfi(" + packageDocCFI + contentDocCFI + ")";
    },

    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //

    // REFACTORING CANDIDATE: Some of the parts of this method could be refactored into their own methods. 
    createCFITextNodeStep : function ($startTextNode, characterOffset, classBlacklist, elementBlacklist, idBlacklist) {

        var $parentNode;
        var $contentsExcludingMarkers;
        var CFIIndex;
        var indexOfTextNode;
        var preAssertion;
        var preAssertionStartIndex;
        var textLength;
        var postAssertion;
        var postAssertionEndIndex;

        // Find text node position in the set of child elements, ignoring any cfi markers 
        $parentNode = $startTextNode.parent();
        $contentsExcludingMarkers = EPUBcfi.CFIInstructions.applyBlacklist($parentNode.contents(), classBlacklist, elementBlacklist, idBlacklist);

        // Find the text node number in the list, inferring nodes that were originally a single text node
        var prevNodeWasTextNode;
        var indexOfFirstInSequence;
        $.each($contentsExcludingMarkers, 
            function (index) {

                // If this is a text node, check if it matches and return the current index
                if (this.nodeType === 3) {

                    if (this === $startTextNode[0]) {

                        // Set index of the first in the adjacent sequence, or current node
                        if (prevNodeWasTextNode) {
                            indexOfTextNode = indexOfFirstInSequence;
                        }
                        else {
                            indexOfTextNode = index;
                        }
                        
                        return false; // Break out of .each loop
                    }

                    // save this index as the first in sequence of adjacent text nodes, if not set
                    prevNodeWasTextNode = true;
                    if (!indexOfFirstInSequence) {
                        indexOfFirstInSequence = index;
                    }
                }
                // This node is not a text node
                else {
                    prevNodeWasTextNode = false;
                    indexOfFirstInSequence = undefined;
                }
            }
        );

        // Convert the text node number to a CFI odd-integer representation
        CFIIndex = (indexOfTextNode * 2) + 1;

        // TODO: text assertions are not in the grammar yet, I think, or they're just causing problems. This has
        //   been temporarily removed. 

        // Add pre- and post- text assertions
        // preAssertionStartIndex = (characterOffset - 3 >= 0) ? characterOffset - 3 : 0;
        // preAssertion = $startTextNode[0].nodeValue.substring(preAssertionStartIndex, characterOffset);

        // textLength = $startTextNode[0].nodeValue.length;
        // postAssertionEndIndex = (characterOffset + 3 <= textLength) ? characterOffset + 3 : textLength;
        // postAssertion = $startTextNode[0].nodeValue.substring(characterOffset, postAssertionEndIndex);

        // Gotta infer the correct character offset, as well

        // return the constructed text node step
        return "/" + CFIIndex + ":" + characterOffset;
         // + "[" + preAssertion + "," + postAssertion + "]";
    },

    // Description: A set of adjacent text nodes can be inferred to have been a single text node in the original document. As such, 
    //   if the character offset is specified for one of the adjacent text nodes, the true offset for the original node must be
    //   inferred.
    findOriginalTextNodeCharOffset : function ($startTextNode, specifiedCharacterOffset, classBlacklist, elementBlacklist, idBlacklist) {

        var $parentNode;
        var $contentsExcludingMarkers;
        var textLength;
        
        // Find text node position in the set of child elements, ignoring any cfi markers 
        $parentNode = $startTextNode.parent();
        $contentsExcludingMarkers = EPUBcfi.CFIInstructions.applyBlacklist($parentNode.contents(), classBlacklist, elementBlacklist, idBlacklist);

        // Find the text node number in the list, inferring nodes that were originally a single text node
        var prevNodeWasTextNode;
        var originalCharOffset = -1; // So the character offset is a 0-based index; we'll be adding lengths of text nodes to this number
        $.each($contentsExcludingMarkers, 
            function (index) {

                // If this is a text node, check if it matches and return the current index
                if (this.nodeType === 3) {

                    if (this === $startTextNode[0]) {

                        if (prevNodeWasTextNode) {
                            originalCharOffset = originalCharOffset + specifiedCharacterOffset;
                        }
                        else {
                            originalCharOffset = specifiedCharacterOffset;
                        }

                        return false; // Break out of .each loop
                    }
                    else {

                        originalCharOffset = originalCharOffset + this.length;
                    }

                    // save this index as the first in sequence of adjacent text nodes, if not set
                    prevNodeWasTextNode = true;
                }
                // This node is not a text node
                else {
                    prevNodeWasTextNode = false;
                }
            }
        );

        return originalCharOffset;
    },

    // REFACTORING CANDIDATE: Consider putting the handling of the starting text node into the body of the 
    //   generateCharacterOffsetCfi() method; this way the characterOffset argument could be removed, which 
    //   would clarify the abstraction
    createCFIElementSteps : function ($currNode, characterOffset, topLevelElement, classBlacklist, elementBlacklist, idBlacklist) {

        var textNodeStep;
        var $blacklistExcluded;
        var $parentNode;
        var currNodePosition;
        var CFIPosition;
        var idAssertion;
        var elementStep; 

        if ($currNode[0].nodeType === 3) {

            textNodeStep = this.createCFITextNodeStep($currNode, characterOffset, classBlacklist, elementBlacklist, idBlacklist);
            return this.createCFIElementSteps($currNode.parent(), characterOffset, topLevelElement, classBlacklist, elementBlacklist, idBlacklist) + textNodeStep; 
        }

        // Find position of current node in parent list
        $blacklistExcluded = EPUBcfi.CFIInstructions.applyBlacklist($currNode.parent().children(), classBlacklist, elementBlacklist, idBlacklist);
        $.each($blacklistExcluded, 
            function (index, value) {

                if (this === $currNode[0]) {

                    currNodePosition = index;

                    // Break loop
                    return false;
                }
        });

        // Convert position to the CFI even-integer representation
        CFIPosition = (currNodePosition + 1) * 2;

        // Create CFI step with id assertion, if the element has an id
        if ($currNode.attr("id")) {

            elementStep = "/" + CFIPosition + "[" + $currNode.attr("id") + "]";
        }
        else {

            elementStep = "/" + CFIPosition;
        }

        // If a parent is an html element return the (last) step for this content document, otherwise, continue
        $parentNode = $currNode.parent();
        if ($parentNode.is(topLevelElement)) {
            
            // If the top level node is a type from which an indirection step, add an indirection step character (!)
            // REFACTORING CANDIDATE: It is possible that this should be changed to if (topLevelElement = 'package') do
            //   not return an indirection character. Every other type of top-level element may require an indirection
            //   step to navigate to, thus requiring that ! is always prepended. 
            if (topLevelElement === 'html') {

                return "!" + elementStep;
            }
            else {

                return elementStep;
            }
        }
        else {

            return this.createCFIElementSteps($parentNode, characterOffset, topLevelElement, classBlacklist, elementBlacklist, idBlacklist) + elementStep;
        }
    }
};