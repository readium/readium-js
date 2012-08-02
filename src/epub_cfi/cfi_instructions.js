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
		var $targetNode = $($currNode.children()[jqueryTargetNodeIndex]);

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
			$.ajax({

				type: "GET",
				url: contentDocHref,
				dataType: "xml",
				async: "false",
				success: function(contentDocXML) {

					var domParser = new window.DOMParser();
					var contentDoc = domParser.parseFromString(contentDocXML, "text/xml");

					// contentDoc.firstChild is intended to return the html element
					$targetNode = $($(contentDoc.firstChild).children()[jqueryTargetNodeIndex]);

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
	textTermination : function (CFIStepValue, $currNode, stepTargetNodeId, textOffset) {

		var targetTextNode; 
		// TODO: validation for text offset

		var $targetNode = this.getNextNode(CFIStepValue, $currNode, stepTargetNodeId);
		if ($targetNode) {

			// Get the first node, this should be a text node
			targetTextNode = $targetNode.contents()[0];

			if (targetTextNode.nodeType === 3) {

				return targetTextNode.nodeValue.charAt(textOffset);
			}
			else {

				return null;
			}
		}
		else {

			return null;
		}
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
	}
}


