// Description: This is an interpreter that inteprets an Abstract Syntax Tree (AST) for a CFI. The result of executing the interpreter
//   is to inject an element, or set of elements, into an EPUB content document (which is just an XHTML document). These element(s) will
//   represent the position or area in the EPUB referenced by a CFI.
// Rationale: The AST is a clean and readable expression of the step-terminus structure of a CFI. Although building an interpreter adds to the
//   CFI infrastructure, it provides a number of benefits. First, it emphasizes a clear separation of concerns between lexing/parsing a
//   CFI, which involves some complexity related to escaped and special characters, and the execution of the underlying set of steps 
//   represented by the CFI. Second, it will be easier to extend the interpreter to account for new/altered CFI steps (say for references
//   to vector objects or multiple CFIs) than if lexing, parsing and interpretation were all handled in a single step. Finally, Readium's objective is 
//   to demonstrate implementation of the EPUB 3.0 spec. An implementation with a strong separation of concerns that conforms to 
//   well-understood patterns for DSL processing should be easier to communicate, analyze and understand. 
// REFACTORING CANDIDATE: node type errors shouldn't really be possible if the CFI syntax is correct and the parser is error free. 
//   Might want to make the script die in those instances, once the grammar and interpreter are more stable. 
// REFACTORING CANDIDATE: The use of the 'nodeType' property is confusing as this is a DOM node property and the two are unrelated. 
//   Whoops. There shouldn't be any interference, however, I think this should be changed. 

EPUBcfi.Interpreter = {

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    // Description: Find the content document referenced by the spine item. This should be the spine item 
    //   referenced by the first indirection step in the CFI.
    // Rationale: This method is a part of the API so that the reading system can "interact" the content document 
    //   pointed to by a CFI. If this is not a separate step, the processing of the CFI must be tightly coupled with 
    //   the reading system, as it stands now. 
    getContentDocHref : function (CFI, $packageDocument) {

        var decodedCFI = decodeURI(CFI);
        var CFIAST = EPUBcfi.Parser.parse(decodedCFI);

        // Check node type; throw error if wrong type
        if (CFIAST === undefined || CFIAST.type !== "CFIAST") { 

            throw EPUBcfi.NodeTypeError(CFIAST, "expected CFI AST root node");
        }

        var $packageElement = $($("package", $packageDocument)[0]);

        // Interpet the path node (the package document step)
        var $currElement = this.interpretIndexStepNode(CFIAST.cfiString.path, $packageElement);

        // Interpret the local_path node, which is a set of steps and and a terminus condition
        var stepNum = 0;
        var nextStepNode;
        for (stepNum = 0 ; stepNum <= CFIAST.cfiString.localPath.steps.length - 1 ; stepNum++) {
        
            nextStepNode = CFIAST.cfiString.localPath.steps[stepNum];

            if (nextStepNode.type === "indexStep") {

                $currElement = this.interpretIndexStepNode(nextStepNode, $currElement);
            }
            else if (nextStepNode.type === "indirectionStep") {

                $currElement = this.interpretIndirectionStepNode(nextStepNode, $currElement, $packageDocument);
            }

            // Found the content document href referenced by the spine item 
            if ($currElement.is("itemref")) {

                return EPUBcfi.CFIInstructions.retrieveItemRefHref($currElement, $packageDocument);
            }
        }

        // An itemref element was never found - a runtime error. The cfi is misspecified or the package document is 
        // messed up.
    },

    // inject element into content document
    injectElement : function (CFI, contentDocument) {

        var decodedCFI = decodeURI(CFI);
        var CFIAST = EPUBcfi.Parser.parse(decodedCFI);

        // find the first indirection step in the local path; follow it like a regular step
        var stepNum = 0;
        var nextStepNode;
        for (stepNum; stepNum <= CFIAST.cfiString.localPath.steps.length - 1 ; stepNum++) {
        
            nextStepNode = CFIAST.cfiString.localPath.steps[stepNum];
            if (nextStepNode.type === "indirectionStep") {

                // This is now assuming that indirection steps and index steps conform to an interface: an object with stepLength, idAssertion
                nextStepNode.type = "indexStep";
                // Getting the html element and creating a jquery object for it; excluding cfiMarkers
                $currElement = this.interpretIndexStepNode(nextStepNode, $(contentDocument.firstChild));
                stepNum++ // Increment the step num as this will be passed as the starting point for continuing interpretation
                break;
            }
        }

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString, stepNum, $currElement);

        // TODO: detect what kind of terminus
        $currElement = this.interpretTextTerminusNode(CFIAST.cfiString.localPath.termStep, $currElement);

        // Return the element that was injected into
        return $currElement;
    },

    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //

    interpretLocalPath : function (cfiStringNode, startStepNum, $currElement) {

        var stepNum = startStepNum;
        var nextStepNode;
        for (stepNum; stepNum <= cfiStringNode.localPath.steps.length - 1 ; stepNum++) {
        
            nextStepNode = cfiStringNode.localPath.steps[stepNum];

            if (nextStepNode.type === "indexStep") {

                $currElement = this.interpretIndexStepNode(nextStepNode, $currElement);
            }
            else if (nextStepNode.type === "indirectionStep") {

                $currElement = this.interpretIndirectionStepNode(nextStepNode, $currElement, $packageDocument);
            }
        }

        return $currElement;
    },

    interpretIndexStepNode : function (indexStepNode, $currElement) {

        // Check node type; throw error if wrong type
        if (indexStepNode === undefined || indexStepNode.type !== "indexStep") {

            throw EPUBcfi.NodeTypeError(indexStepNode, "expected index step node");
        }

        // Step
        var $stepTarget = EPUBcfi.CFIInstructions.getNextNode(indexStepNode.stepLength, $currElement, undefined);

        // Check the id assertion, if it exists
        if (indexStepNode.idAssertion) {

            if (!EPUBcfi.CFIInstructions.targetIdMatchesIdAssertion($stepTarget, indexStepNode.idAssertion)) {

                throw EPUBcfi.CFIAssertionError(indexStepNode.idAssertion, $stepTarget.attr('id'), "Id assertion failed");
            }
        }

        // return target element
        return $stepTarget;
    },

    interpretIndirectionStepNode : function (indirectionStepNode, $currElement, $packageDocument) {

        // Check node type; throw error if wrong type
        if (indirectionStepNode === undefined || indirectionStepNode.type !== "indirectionStep") {

            throw EPUBcfi.NodeTypeError(indirectionStepNode, "expected indirection step node");
        }

        // indirection step
        var $stepTarget = EPUBcfi.CFIInstructions.followIndirectionStep(
            indirectionStepNode.stepLength, 
            $currElement,
            undefined,
            $packageDocument);

        // Check the id assertion, if it exists
        if (indirectionStepNode.idAssertion) {

            if (!EPUBcfi.CFIInstructions.targetIdMatchesIdAssertion($stepTarget, indirectionStepNode.idAssertion)) {

                throw EPUBcfi.CFIAssertionError(indirectionStepNode.idAssertion, $stepTarget.attr('id'), "Id assertion failed");
            }
        }

        // return target element
        return $stepTarget;
    },

    interpretTextTerminusNode : function (terminusNode, $currElement) {

        if (terminusNode === undefined || terminusNode.type !== "textTerminus") {

            throw EPUBcfi.NodeTypeError(terminusNode, "expected text terminus node");
        }

        var $elementInjectedInto = EPUBcfi.CFIInstructions.textTermination(
            $currElement, 
            terminusNode.offsetValue, 
            EPUBcfi.Config.cfiMarkerElements.textPointMarker);

        return $elementInjectedInto;
    }
};