// Description: This model contains the implementation for "instructions" included in the EPUB CFI domain specific language (DSL). 
//   Lexing and parsing a CFI produces a set of executable instructions for processing a CFI (represented in the AST). 
//   This object contains a set of functions that implement each of the executable instructions in the AST. 

define(['require', 'module', 'jquery', './runtime_errors'], function (require, module, $, CFIErrors) {

    var CFIInstructions = {

        // ------------------------------------------------------------------------------------ //
        //  "PUBLIC" METHODS (THE API)                                                          //
        // ------------------------------------------------------------------------------------ //

        // Description: Follows a step
        // Rationale: The use of children() is important here, as this jQuery method returns a tree of xml nodes, EXCLUDING
        //   CDATA and text nodes. When we index into the set of child elements, we are assuming that text nodes have been
        //   excluded.
        // REFACTORING CANDIDATE: This should be called "followIndexStep"
        getNextNode : function (CFIStepValue, $currNode, classBlacklist, elementBlacklist, idBlacklist) {

            // Find the jquery index for the current node
            var $targetNode;
            if (CFIStepValue % 2 == 0) {

                $targetNode = this.elementNodeStep(CFIStepValue, $currNode, classBlacklist, elementBlacklist, idBlacklist);
            }
            else {

                $targetNode = this.inferTargetTextNode(CFIStepValue, $currNode, classBlacklist, elementBlacklist, idBlacklist);
            }

            return $targetNode;
        },

        // Description: This instruction executes an indirection step, where a resource is retrieved using a
        //   link contained on a attribute of the target element. The attribute that contains the link differs
        //   depending on the target.
        // Note: Iframe indirection will (should) fail if the iframe is not from the same domain as its containing script due to
        //   the cross origin security policy
        followIndirectionStep : function (CFIStepValue, $currNode, classBlacklist, elementBlacklist, idBlacklist) {

            var that = this;
            var $contentDocument;
            var $blacklistExcluded;
            var $startElement;
            var $targetNode;

            // TODO: This check must be expanded to all the different types of indirection step
            // Only expects iframes, at the moment
            if ($currNode === undefined || !$currNode.is("iframe")) {

                throw CFIErrors.NodeTypeError($currNode, "expected an iframe element");
            }

            // Check node type; only iframe indirection is handled, at the moment
            if ($currNode.is("iframe")) {

                // Get content
                $contentDocument = $currNode.contents();

                // Go to the first XHTML element, which will be the first child of the top-level document object
                $blacklistExcluded = this.applyBlacklist($contentDocument.children(), classBlacklist, elementBlacklist, idBlacklist);
                $startElement = $($blacklistExcluded[0]);

                // Follow an index step
                $targetNode = this.getNextNode(CFIStepValue, $startElement, classBlacklist, elementBlacklist, idBlacklist);

                // Return that shit!
                return $targetNode;
            }

            // TODO: Other types of indirection
            // TODO: $targetNode.is("embed")) : src
            // TODO: ($targetNode.is("object")) : data
            // TODO: ($targetNode.is("image") || $targetNode.is("xlink:href")) : xlink:href
        },

        // Description: Injects an element at the specified text node
        // Arguments: a cfi text termination string, a jquery object to the current node
        // REFACTORING CANDIDATE: Rename this to indicate that it injects into a text terminus
        textTermination : function ($currNode, textOffset, elementToInject) {

            var $injectedElement;
            // Get the first node, this should be a text node
            if ($currNode === undefined) {

                throw CFIErrors.NodeTypeError($currNode, "expected a terminating node, or node list");
            }
            else if ($currNode.length === 0) {

                throw CFIErrors.TerminusError("Text", "Text offset:" + textOffset, "no nodes found for termination condition");
            }

            $injectedElement = this.injectCFIMarkerIntoText($currNode, textOffset, elementToInject);
            return $injectedElement;
        },

        // Description: Checks that the id assertion for the node target matches that on
        //   the found node.
        targetIdMatchesIdAssertion : function ($foundNode, idAssertion) {

            if ($foundNode.attr("id") === idAssertion) {

                return true;
            }
            else {

                return false;
            }
        },

        // ------------------------------------------------------------------------------------ //
        //  "PRIVATE" HELPERS                                                                   //
        // ------------------------------------------------------------------------------------ //

        // Description: Step reference for xml element node. Expected that CFIStepValue is an even integer
        elementNodeStep : function (CFIStepValue, $currNode, classBlacklist, elementBlacklist, idBlacklist) {

            var $targetNode;
            var $blacklistExcluded;
            var numElements;
            var jqueryTargetNodeIndex = (CFIStepValue / 2) - 1;

            $blacklistExcluded = this.applyBlacklist($currNode.children(), classBlacklist, elementBlacklist, idBlacklist);
            numElements = $blacklistExcluded.length;

            if (this.indexOutOfRange(jqueryTargetNodeIndex, numElements)) {

                throw CFIErrors.OutOfRangeError(jqueryTargetNodeIndex, numElements - 1, "");
            }

            $targetNode = $($blacklistExcluded[jqueryTargetNodeIndex]);
            return $targetNode;
        },

        retrieveItemRefHref : function ($itemRefElement, $packageDocument) {

            return $("#" + $itemRefElement.attr("idref"), $packageDocument).attr("href");
        },

        indexOutOfRange : function (targetIndex, numChildElements) {

            return (targetIndex > numChildElements - 1) ? true : false;
        },

        // Rationale: In order to inject an element into a specific position, access to the parent object
        //   is required. This is obtained with the jquery parent() method. An alternative would be to
        //   pass in the parent with a filtered list containing only children that are part of the target text node.
        injectCFIMarkerIntoText : function ($textNodeList, textOffset, elementToInject) {

            var nodeNum;
            var currNodeLength;
            var currTextPosition = 0;
            var nodeOffset;
            var originalText;
            var $injectedNode;
            var $newTextNode;
            // The iteration counter may be incorrect here (should be $textNodeList.length - 1 ??)
            for (nodeNum = 0; nodeNum <= $textNodeList.length; nodeNum++) {

                if ($textNodeList[nodeNum].nodeType === 3) {

                    currNodeMaxIndex = ($textNodeList[nodeNum].nodeValue.length - 1) + currTextPosition;
                    nodeOffset = textOffset - currTextPosition;

                    if (currNodeMaxIndex >= textOffset) {

                        // This node is going to be split and the components re-inserted
                        originalText = $textNodeList[nodeNum].nodeValue;

                        // Before part
                        $textNodeList[nodeNum].nodeValue = originalText.slice(0, nodeOffset);

                        // Injected element
                        $injectedNode = $(elementToInject).insertAfter($textNodeList.eq(nodeNum));

                        // After part
                        $newTextNode = $(document.createTextNode(originalText.slice(nodeOffset, originalText.length)));
                        $($newTextNode).insertAfter($injectedNode);

                        return $injectedNode;
                    }
                    else {

                        currTextPosition = currTextPosition + currNodeMaxIndex;
                    }
                }
            }

            throw CFIErrors.TerminusError("Text", "Text offset:" + textOffset, "The offset exceeded the length of the text");
        },

        // Description: This method finds a target text node and then injects an element into the appropriate node
        // Arguments: A step value that is an odd integer. A current node with a set of child elements.
        // Rationale: The possibility that cfi marker elements have been injected into a text node at some point previous to
        //   this method being called (and thus splitting the original text node into two separate text nodes) necessitates that
        //   the set of nodes that compromised the original target text node are inferred and returned.
        // Notes: Passed a current node. This node should have a set of elements under it. This will include at least one text node,
        //   element nodes (maybe), or possibly a mix.
        // REFACTORING CANDIDATE: This method is pretty long. Worth investigating to see if it can be refactored into something clearer.
        inferTargetTextNode : function (CFIStepValue, $currNode, classBlacklist, elementBlacklist, idBlacklist) {

            var $elementsWithoutMarkers;
            var currTextNodePosition;
            var logicalTargetPosition;
            var nodeNum;
            var $targetTextNodeList;

            // Remove any cfi marker elements from the set of elements.
            // Rationale: A filtering function is used, as simply using a class selector with jquery appears to
            //   result in behaviour where text nodes are also filtered out, along with the class element being filtered.
            $elementsWithoutMarkers = this.applyBlacklist($currNode.contents(), classBlacklist, elementBlacklist, idBlacklist);

            // Convert CFIStepValue to logical index; assumes odd integer for the step value
            logicalTargetPosition = (parseInt(CFIStepValue) + 1) / 2;

            // Set text node position counter
            currTextNodePosition = 1;
            $targetTextNodeList = $elementsWithoutMarkers.filter(
                function () {

                    if (currTextNodePosition === logicalTargetPosition) {

                        // If it's a text node
                        if (this.nodeType === 3) {
                            return true;
                        }
                        // Any other type of node, move onto the next text node
                        else {
                            currTextNodePosition++;
                            return false;
                        }
                    }
                    // In this case, don't return any elements
                    else {

                        // If its the last child and it's not a text node, there are no text nodes after it
                        // and the currTextNodePosition shouldn't be incremented
                        if (this.nodeType !== 3 && this !== $elementsWithoutMarkers.lastChild) {
                            currTextNodePosition++;
                        }

                        return false;
                    }
                }
            );

            // The filtering above should have counted the number of "logical" text nodes; this can be used to
            // detect out of range errors
            if ($targetTextNodeList.length === 0) {

                throw CFIErrors.OutOfRangeError(logicalTargetPosition, currTextNodePosition - 1, "Index out of range");
            }

            // return the text node list
            return $targetTextNodeList;
        },

        applyBlacklist : function ($elements, classBlacklist, elementBlacklist, idBlacklist) {

            var $filteredElements;

            $filteredElements = $elements.filter(
                function () {

                    var $currElement = $(this);
                    var includeInList = true;

                    if (classBlacklist) {

                        // Filter each element with the class type
                        $.each(classBlacklist, function (index, value) {

                            if ($currElement.hasClass(value)) {
                                includeInList = false;

                                // Break this loop
                                return false;
                            }
                        });
                    }

                    if (elementBlacklist) {

                        // For each type of element
                        $.each(elementBlacklist, function (index, value) {

                            if ($currElement.is(value)) {
                                includeInList = false;

                                // Break this loop
                                return false;
                            }
                        });
                    }

                    if (idBlacklist) {

                        // For each type of element
                        $.each(idBlacklist, function (index, value) {

                            if ($currElement.attr("id") === value) {
                                includeInList = false;

                                // Break this loop
                                return false;
                            }
                        });
                    }

                    return includeInList;
                }
            );

            return $filteredElements;
        }
    };
    return CFIInstructions;
});