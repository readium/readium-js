// Description: This model contains the implementation for "instructions" included in the EPUB CFI domain specific language (DSL). 
//   Lexing and parsing a CFI produces an array of executable instructions for processing a CFI. This object contains a set of 
//   functions that implement each of the instructions. 
// Rationale: The lexing, parsing and execution functionality for CFI is designed with a goal to make it a stand-alone library. 
//   As such, backbone.js was not used as it would create an unnecessary dependency for this library. 

EPUBcfi.CFIInstructions = {

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

	// Description: Implements a range, once a local path has been followed to the start of the range pointers
	// Arguments: local_path_start?, local_path_end?
	// Returns: nothing
	setRange : function () {

	},

	// Description: Follows a step
	// Arguments: a cfi step string, a jquery object which is the current element, the id of the node that should
	//   be selected. 
	// Returns: a jquery element
	// Rationale: The use of children() is important here, as this jQuery method returns a tree of xml nodes, EXCLUDING
	//   CDATA and text nodes. When we index into the set of child elements, we are assuming that text nodes have been 
	//   excluded.
	getNextNode : function (CFIStepValue, $currNode, stepTargetNodeId) {

		// TODO: Check that stepValue is even
		// TODO: Filter out any nodes that represent CFI tags in the document

		// Find the jquery index for the current node
		var jqueryTargetNodeIndex = (CFIStepValue / 2) - 1;
		
		if (this.indexOutOfRange(jqueryTargetNodeIndex, $currNode.children().not('.cfiMarker').length)) {

			throw EPUBcfi.RuntimeError(undefined, "getNextNode", "out of range error");
		}

		var $targetNode = $($currNode.children().not('.cfiMarker')[jqueryTargetNodeIndex]);

		// If index exists return the next node
		if ($targetNode/* && this.targetIdMatchesIdAssertion($targetNode, stepTargetNodeId)*/) {

			return $targetNode;
		}
		else {

			return null;
		}
	},

	// Description: This instruction executes an indirection step, where a resource is retrieved using a 
	//   link contained on a attribute of the target element. The attribute that contains the link differs
	//   depending on the target. 
	// Arguments: the CFI step value, the current node (jquery object), the id assertion for the target node, 
	//   the package document.
	// TODO: Should probably refactor the ajax request into its own method, as it may grow or need to be 
	//   overridden. 
	followIndirectionStep : function (CFIStepValue, $currNode, stepTargetNodeId, $packageDocument) {

		// TODO: Check that stepValue is even
		// TODO: Filter out any nodes that represent CFI tags in the document

		var that = this;
		var jqueryTargetNodeIndex = (CFIStepValue / 2) - 1;
		var $targetNode;
		var contentDocHref;
		var $documentResult;

		// This is an item ref
		if ($currNode.is("itemref")) {

			contentDocHref = $("#" + $currNode.attr("idref"), $packageDocument).attr("href");

			// Load the resource
			// TODO: This being a synchronous method is not ideal
			$.ajax({

				type: "GET",
				url: contentDocHref,
				dataType: "xml",
				async: "false",
				success: function(contentDocXML) {

					var domParser = new window.DOMParser();
					var contentDoc = domParser.parseFromString(contentDocXML, "text/xml");

					if (that.indexOutOfRange(jqueryTargetNodeIndex, $(contentDoc.firstChild).children().not('.cfiMarker').length)) {

						throw EPUBcfi.RuntimeError(undefined, "followIndirectionStep", "out of range error");
					}

					// contentDoc.firstChild is intended to return the html element
					$targetNode = $($(contentDoc.firstChild).children().not('.cfiMarker')[jqueryTargetNodeIndex]);

					// If index exists
					if ($targetNode/* && that.targetIdMatchesIdAssertion($targetNode, stepTargetNodeId)*/) {

						$documentResult = $targetNode;
					}
				}
			});

			// Assuming the ajax above was an asynchronous call
			return $documentResult;
		}
			// }
			// else if ($targetNode.is("iframe") || $targetNode.is("embed")) { 

			// 	// src
			// }
			// else if ($targetNode.is("object")) {

			// 	// data
			// }
			// else if ($targetNode.is("image") || $targetNode.is("xlink:href")) {

			// 	// xlink:href
			// }
			// else {

			// 	return null;
			// }
		else {

			return null;
		}
	},

	// Description: Executes an action at the specified text node
	// Arguments: a cfi text termination string, a jquery object to the current node
	// Returns: id of the inserted marker, or returns the element? ??
	// TODO: Missing handling of text assertions
	textTermination : function ($currNode, textOffset, elementToInject) {

		var targetTextNode; 
		var originalText;
		var textWithInjection;
		// TODO: validation for text offset

		// Get the first node, this should be a text node
		if ($currNode.contents()[0] === undefined) {

			throw EPUBcfi.RuntimeError(undefined, "textTermination", "text node not found");
		}

		$currNode = this.injectCFIMarkerIntoText($currNode, textOffset, elementToInject);

		return $currNode;
	},

	offsetTermination : function () {
		// TODO:
	},

	temporalTermination : function () {
		// TODO: 
	},

	combinedTermination : function () {
		// TODO:
	},

	// ------------------------------------------------------------------------------------ //
	//  "PRIVATE" HELPERS                                                                   //
	// ------------------------------------------------------------------------------------ //

	// Description: Checks that the id assertion for the node target matches that on 
	//   the found node. 
	// Arguments: idAssertion (string), the node found by indexing into child elements of the start node
	// Notes: At some point, this could be a fallback: if the id assertion does not match the found-node id, it could 
	//   try looking for the found node. 
	targetIdMatchesIdAssertion : function ($foundNode, iDAssertion) {

		if ($foundNode.attr("id") === iDAssertion) {

			return true;
		}
		else {

			return false;
		}
	},

	indexOutOfRange : function (targetIndex, numChildElements) {

		return (targetIndex > numChildElements - 1) ? true : false;
	},

	// TODO: This is interesting: Does the target have to be a pure text node? Or can it have
	//   internal elements (that break up a sequence of text nodes)? How would the internal elements
	//   affect the offset position? 
	// REFACTORING CANDIDATE: Not really sure if this is the best way to do this. I kinda hate it. 
	injectCFIMarkerIntoText : function ($currNode, textOffset, elementToInject) {

		// Filter out non-text nodes
		var $textNodeList = $currNode.contents().filter(function () {

			return this.nodeType === 3;
		});

		var nodeNum;
		var currNodeLength;
		var currTextPosition = 0;
		var nodeOffset;
		var originalText;
		for (nodeNum = 0; nodeNum <= $textNodeList.length; nodeNum++) {

			currNodeMaxIndex = ($textNodeList[nodeNum].nodeValue.length - 1) + currTextPosition;

			if (currNodeMaxIndex >= textOffset) {

				nodeOffset = textOffset - currTextPosition;

				originalText = $textNodeList[nodeNum].nodeValue;
				// REFACTORING CANDIDATE: Might want to split the text nodes and insert the element??? Not sure.
				textWithInjection = [originalText.slice(0, nodeOffset), 
									 elementToInject, 
									 originalText.slice(nodeOffset, originalText.length)].join('');

				$textNodeList[nodeNum].nodeValue = textWithInjection;

				return $currNode;
			}
			else {

				currTextPosition = currTextPosition + currNodeMaxIndex;
			}
		}

		// Throw an exception here
	}
}


