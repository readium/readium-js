// Description: This is an interpreter that inteprets an Abstract Syntax Tree (AST) for a CFI. The result of executing the interpreter
//   is to inject an element, or set of elements, into an EPUB content document (which is just an XHTML document). These element(s) will
//   represent the position or span in the EPUB referenced by a CFI.
// Rationale: The AST is a clean and readable expression of the step-structure of a CFI. Although building an interpreter adds to the
//   CFI infrastructure, it provides a number of benefits. First, it provides a clear separation of concerns between lexing/parsing a
//   CFI, which involves some complexity related to escaped and special characters, and the execution of the underlying set of steps 
//   represented by the CFI. Second, it will be easier to extend the interpreter to account for new/altered CFI steps (say for references
//   to vector objects) than if lexing, parsing and interpretation were all handled in a single step. Finally, Readium's objective is 
//   to demonstrate implementation of the EPUB 3.0 spec. An implementation with a strong separation of concerns that conforms to 
//   well-understood patterns for DSL processing should be easier to communicate, analyze and understand. 
// TODO: node type errors shouldn't really be possible if the cfi syntax is correct and the parser has no errors. Might want to make
//   the script die in those instances. 

EPUBcfi.Interpreter = {

    _textCFIElement : '<span class="cfi_marker"/>',

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    // Description: This method executes the intepreter on a CFI AST. The CFI spec requires 
    //   the package document as a starting point.
    // Arguments: a CFI AST (json), the package document (jquery)
    injectCFIReferenceElements : function (CFIAST, $packageDocument) {
        
        // Check node type; throw error if wrong type
        if (CFIAST.type !== "CFIAST") { 

            throw EPUBcfi.RuntimeError(CFIAST, "injectCFIReferenceElements", "node type error");
        }

        interpretCFIStringNode(CFIAST.cfiString, $packageDocument);
    },

    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //

    interpretCFIStringNode : function (cfiStringNode, $packageDocument) {

        if (cfiStringNode.type !== "cfiString") {

            throw EPUBcfi.RuntimeError(cfiStringNode, "interpretCFIStringNode", "node type error");
        }

        // Get the "package element"
        var $packageElement = $($("package", $packageDocument)[0]);

        // Interpet the package document step
        var $currElement = this.interpretIndexStepNode(cfiStringNode.path, $packageElement);

        // Interpret steps in the local path 
        var stepNum = 0;
        var nextStepNode;
        for (stepNum = 0 ; stepNum <= cfiStringNode.localPath.steps.length - 1 ; stepNum++) {
        
            nextStepNode = cfiStringNode.localPath.steps[stepNum];

            if (nextStepNode.type === "indexStep") {

                $currElement = this.interpretIndexStepNode(nextStepNode, $currElement);
            }
            else if (nextStepNode.type === "indirectionStep") {

                $currElement = this.interpretIndirectionStepNode(nextStepNode, $currElement, $packageDocument);
            }
        }

        // Return the element that was injected into
        return $currElement;
    },

    interpretIndexStepNode : function (indexStepNode, $currElement) {

        // Check node type; throw error if wrong type
        if (indexStepNode.type !== "indexStep") {

            throw EPUCFI.RuntimeError(indexStepNode, "interpretIndexStepNode", "node type error");
        }

        // Step
        var $stepTarget = EPUBcfi.CFIInstructions.getNextNode(indexStepNode.stepLength, $currElement, undefined);

        // return target element
        return $stepTarget;
    },

    interpretIndirectionStepNode : function (indirectionStepNode, $currElement, $packageDocument) {

        // Check node type; throw error if wrong type
        if (indirectionStepNode.type !== "indirectionStep") {

            throw EPUBcfi.RuntimeError(indirectionStepNode, "interpretIndirectionStepNode", "node type error");
        }

        // indirection step
        var $stepTarget = EPUBcfi.CFIInstructions.followIndirectionStep(
            indirectionStepNode.stepLength, 
            $currElement,
            undefined,
            $packageDocument);

        // return target element
        return $stepTarget;
    },

    interpretTextTerminus : function (terminusNode, $currElement) {

        if (terminusNode.type !== "textTerminus") {

            throw EPUBcfi.RuntimeError(terminusNode, "interpretTextTerminus", "node type error");
        }

        var $elementInjectedInto = EPUBcfi.CFIInstructions.textTermination(
            $currElement, 
            terminusNode.offsetValue, 
            this._textCFIElement);

        return $elementInjectedInto;
    }
};