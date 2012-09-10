// Description: This model contains the implementation for "instructions" included in the EPUB CFI domain specific language (DSL). 
//   Lexing and parsing a CFI produces a set of executable instructions for processing a CFI (represented in the AST). 
//   This object contains a set of functions that implement each of the executable instructions in the AST. 

EPUBcfi.CFIInstructions = {

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	// Description: Follows a step
	// Rationale: The use of children() is important here, as this jQuery method returns a tree of xml nodes, EXCLUDING
	//   CDATA and text nodes. When we index into the set of child elements, we are assuming that text nodes have been 
	//   excluded.
	// REFACTORING CANDIDATE: This should be called "followIndexStep"
	getNextNode : function (CFIStepValue, $currNode, stepTargetNodeId) {

		// Find the jquery index for the current node
		var $targetNode;
		var jqueryTargetNodeIndex = (CFIStepValue / 2) - 1;
		
		if (this.indexOutOfRange(jqueryTargetNodeIndex, $currNode.children().not('.cfiMarker').length)) {

			throw EPUBcfi.OutOfRangeError(jqueryTargetNodeIndex, $currNode.children().not('.cfiMarker').length, "");
		}

	   $targetNode = $($currNode.children().not('.cfiMarker')[jqueryTargetNodeIndex]);
		return $targetNode;
	},

	// Description: This instruction executes an indirection step, where a resource is retrieved using a 
	//   link contained on a attribute of the target element. The attribute that contains the link differs
	//   depending on the target. 
	followIndirectionStep : function (CFIStepValue, $currNode, stepTargetNodeId, $packageDocument) {

		var that = this;
		var indexOfFilenameStart;
		var URLForRetrieve;
		var jqueryTargetNodeIndex = (CFIStepValue / 2) - 1;
		var $targetNode;
		var contentDocHref;
		var contentDoc;

		// TODO: This check must be expanded to all the different types of indirection step
		// This is an item ref
		if ($currNode === undefined || !$currNode.is("itemref")) {

			throw EPUBcfi.NodeTypeError($currNode, "expected an itemref element");
		}

		// Load the content document referenced by the spine item
		// Remove the package document filename from the package document url
		indexOfFilenameStart = EPUBcfi.Config.packageDocumentURL.lastIndexOf('/') + 1;
		URLForRetrieve = EPUBcfi.Config.packageDocumentURL.substr(0, indexOfFilenameStart);

		contentDocHref = 
			URLForRetrieve 
			+ $("#" + $currNode.attr("idref"), $packageDocument).attr("href");
		contentDoc = EPUBcfi.Config.retrieveResource(contentDocHref);

		if (that.indexOutOfRange(jqueryTargetNodeIndex, $(contentDoc.firstChild).children().not('.cfiMarker').length)) {

			throw EPUBcfi.OutOfRangeError(jqueryTargetNodeIndex, $(contentDoc.firstChild).children().not('.cfiMarker').length, "");
		}

		// contentDoc.firstChild is intended to return the html element
		$targetNode = $($(contentDoc.firstChild).children().not('.cfiMarker')[jqueryTargetNodeIndex]);

		// TODO: check for validity of returned node
		return $targetNode;
		
		// TODO: Other types of indirection
		// TODO: ($targetNode.is("iframe") || $targetNode.is("embed")) : src
		// TODO: ($targetNode.is("object")) : data
		// TODO: ($targetNode.is("image") || $targetNode.is("xlink:href")) : xlink:href
	},

	// Description: Injects an element at the specified text node
	// Arguments: a cfi text termination string, a jquery object to the current node
	textTermination : function ($currNode, textOffset, elementToInject) {

		var targetTextNode; 
		var originalText;
		var textWithInjection;

		// TODO: Out of range validation for text offset

		// Get the first node, this should be a text node
		if ($currNode === undefined) {

			throw EPUBcfi.NodeTypeError($currNode, "expected a terminating parent node");
		} 
		else if ($currNode.contents()[0] === undefined) {

			throw EPUBcfi.TerminusError("Text", "Text offset:" + textOffset, "no nodes found for termination condition");
		}

		$currNode = this.injectCFIMarkerIntoText($currNode, textOffset, elementToInject);
		return $currNode;
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

	retrieveItemRefHref : function ($itemRefElement, $packageDocument) {

		return $("#" + $itemRefElement.attr("idref"), $packageDocument).attr("href");
	},

	indexOutOfRange : function (targetIndex, numChildElements) {

		return (targetIndex > numChildElements - 1) ? true : false;
	},

	// REFACTORING CANDIDATE: Not really sure if this is the best way to do this. I kinda hate it. 
	injectCFIMarkerIntoText : function ($currNode, textOffset, elementToInject) {

		// Get child nodes, including text nodes
		$nodeList = $currNode.contents();

		var nodeNum;
		var currNodeLength;
		var currTextPosition = 0;
		var nodeOffset;
		var originalText;
		var $injectedNode;
		var $newTextNode;
		// The iteration counter may be incorrect here (should be $nodeList.length - 1 ??)
		for (nodeNum = 0; nodeNum <= $nodeList.length; nodeNum++) {

			if ($nodeList[nodeNum].nodeType === 3) {

				currNodeMaxIndex = ($nodeList[nodeNum].nodeValue.length - 1) + currTextPosition;
				nodeOffset = textOffset - currTextPosition;

				if (currNodeMaxIndex >= textOffset) {

					// This node is going to be split and the components re-inserted
					originalText = $nodeList[nodeNum].nodeValue;	

					// Before part
				 	$nodeList[nodeNum].nodeValue = originalText.slice(0, nodeOffset);

					// Injected element
					$injectedNode = $(elementToInject).insertAfter($nodeList.eq(nodeNum));

					// After part
					$newTextNode = $(document.createTextNode(originalText.slice(nodeOffset, originalText.length)));
					$($newTextNode).insertAfter($injectedNode);

					return $currNode;
				}
				else {

					currTextPosition = currTextPosition + currNodeMaxIndex;
				}
			}
		}

		throw EPUBcfi.TerminusError("Text", "Text offset:" + textOffset, "The offset exceeded the length of the text");
	}
};


