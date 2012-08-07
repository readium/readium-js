// Description: This model contains the implementation for "instructions" included in the EPUB CFI domain specific language (DSL). 
//   Lexing and parsing a CFI produces an array of executable instructions for processing a CFI. This object contains a set of 
//   functions that implement each of the instructions. 
// Rationale: The lexing, parsing and execution functionality for CFI is designed with a goal to make it a stand-alone library. 
//   As such, backbone.js was not used as it would create an unnecessary dependency for this library. 

EPUBcfi.CFIInstructions = {

	// ------------------------------------------------------------------------------------ //
	//  "PUBLIC" METHODS (THE API)                                                          //
	// ------------------------------------------------------------------------------------ //

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

			throw EPUBcfi.OutOfRangeError(jqueryTargetNodeIndex, $currNode.children().not('.cfiMarker').length, "");
		}

		var $targetNode = $($currNode.children().not('.cfiMarker')[jqueryTargetNodeIndex]);

		// If index exists return the next node
		// REFACTORING CANDIDATE: This will throw an exception when assertions are included
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
	// REFACTORING CANDIDATE: The intention here is that the resource request mechanism will be refactored into its 
	//   own object in a way that it can be overridden with a different mechanism for retrieving components of an 
	//   EPUB. While the default provided by the library will be a simple AJAX request, it will otherwise be up to the 
	//   reading system to implement a useful request mechanism.
	followIndirectionStep : function (CFIStepValue, $currNode, stepTargetNodeId, $packageDocument) {

		var that = this;
		var jqueryTargetNodeIndex = (CFIStepValue / 2) - 1;
		var $targetNode;
		var contentDocHref;
		var $documentResult;

		// This is an item ref
		if ($currNode.is("itemref")) {

			contentDocHref = $("#" + $currNode.attr("idref"), $packageDocument).attr("href");

			// Load the resource
			// REFACTORING CANDIDATE: It is not ideal that this is a synchronous call. It is this way for development 
			//   purposes only. 
			$.ajax({

				type: "GET",
				url: contentDocHref,
				dataType: "xml",
				async: "false",
				success: function(contentDocXML) {

					var domParser = new window.DOMParser();
					var contentDoc = domParser.parseFromString(contentDocXML, "text/xml");

					if (that.indexOutOfRange(jqueryTargetNodeIndex, $(contentDoc.firstChild).children().not('.cfiMarker').length)) {

						throw EPUBcfi.OutOfRangeError(jqueryTargetNodeIndex, $(contentDoc.firstChild).children().not('.cfiMarker').length, "");
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

			throw EPUBcfi.NodeTypeError($currNode, "This node should have been an EPUB itemref element");
		}
	},

	// Description: Executes an action at the specified text node
	// Arguments: a cfi text termination string, a jquery object to the current node
	textTermination : function ($currNode, textOffset, elementToInject) {

		var targetTextNode; 
		var originalText;
		var textWithInjection;

		// TODO: validation for text offset

		// Get the first node, this should be a text node
		if ($currNode.contents()[0] === undefined) {

			throw EPUBcfi.TerminusError("Text", "Text offset:" + textOffset, "No nodes found for termination condition");
		}

		$currNode = this.injectCFIMarkerIntoText($currNode, textOffset, elementToInject);
		return $currNode;
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

		// Get child nodes, including text nodes
		$nodeList = $currNode.contents();

		var nodeNum;
		var currNodeLength;
		var currTextPosition = 0;
		var nodeOffset;
		var originalText;
		var $injectedNode;
		var $newTextNode;
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
}


