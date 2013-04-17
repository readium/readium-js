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
    getContentDocHref : function (CFI, packageDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var $packageDocument = $(packageDocument);
        var decodedCFI = decodeURI(CFI);
        var CFIAST = EPUBcfi.Parser.parse(decodedCFI);

        if (!CFIAST || CFIAST.type !== "CFIAST") { 
            throw EPUBcfi.NodeTypeError(CFIAST, "expected CFI AST root node");
        }

        // Interpet the path node (the package document step)
        var $packageElement = $($("package", $packageDocument)[0]);
        var $currElement = this.interpretIndexStepNode(CFIAST.cfiString.path, $packageElement, classBlacklist, elementBlacklist, idBlacklist);
        foundHref = this.searchLocalPathForHref($currElement, $packageDocument, CFIAST.cfiString.localPath, classBlacklist, elementBlacklist, idBlacklist);

        if (foundHref) {
            return foundHref;
        }
        else {
            return undefined;
        }
    },

    // Description: Inject an arbitrary html element into a position in a content document referenced by a CFI
    injectElement : function (CFI, contentDocument, elementToInject, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(CFI);
        var CFIAST = EPUBcfi.Parser.parse(decodedCFI);
        var indirectionNode;
        var indirectionStepNum;
        var $currElement;

        // Rationale: Since the correct content document for this CFI is already being passed, we can skip to the beginning 
        //   of the indirection step that referenced the content document.
        // Note: This assumes that indirection steps and index steps conform to an interface: an object with stepLength, idAssertion
        indirectionStepNum = this.getFirstIndirectionStepNum(CFIAST);
        indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
        indirectionNode.type = "indexStep";

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, indirectionStepNum, $("html", contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // TODO: detect what kind of terminus; for now, text node termini are the only kind implemented
        $currElement = this.interpretTextTerminusNode(CFIAST.cfiString.localPath.termStep, $currElement, elementToInject);

        // Return the element that was injected into
        return $currElement;
    },

    // Description: Inject an arbitrary html element into a position in a content document referenced by a CFI
    injectRangeElements : function (rangeCFI, contentDocument, startElementToInject, endElementToInject, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(rangeCFI);
        var CFIAST = EPUBcfi.Parser.parse(decodedCFI);
        var indirectionNode;
        var indirectionStepNum;
        var $currElement;
        var $range1TargetElement;
        var $range2TargetElement;

        // Rationale: Since the correct content document for this CFI is already being passed, we can skip to the beginning 
        //   of the indirection step that referenced the content document.
        // Note: This assumes that indirection steps and index steps conform to an interface: an object with stepLength, idAssertion
        indirectionStepNum = this.getFirstIndirectionStepNum(CFIAST);
        indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
        indirectionNode.type = "indexStep";

        // Interpret the rest of the steps in the first local path
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, indirectionStepNum, $("html", contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Interpret the first range local_path
        $range1TargetElement = this.interpretLocalPath(CFIAST.cfiString.range1, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);
        $range1TargetElement = this.interpretTextTerminusNode(CFIAST.cfiString.range1.termStep, $range1TargetElement, startElementToInject);

        // Interpret the second range local_path
        $range2TargetElement = this.interpretLocalPath(CFIAST.cfiString.range2, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);
        $range2TargetElement = this.interpretTextTerminusNode(CFIAST.cfiString.range2.termStep, $range2TargetElement, endElementToInject);

        // Return the element that was injected into
        return {
            startElement : $range1TargetElement[0],
            endElement : $range2TargetElement[0]
        };
    },

    // Description: This method will return the element or node (say, a text node) that is the final target of the 
    //   the CFI.
    getTargetElement : function (CFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(CFI);
        var CFIAST = EPUBcfi.Parser.parse(decodedCFI);
        var indirectionNode;
        var indirectionStepNum;
        var $currElement;
        
        // Rationale: Since the correct content document for this CFI is already being passed, we can skip to the beginning 
        //   of the indirection step that referenced the content document.
        // Note: This assumes that indirection steps and index steps conform to an interface: an object with stepLength, idAssertion
        indirectionStepNum = this.getFirstIndirectionStepNum(CFIAST);
        indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
        indirectionNode.type = "indexStep";

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, indirectionStepNum, $("html", contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Return the element at the end of the CFI
        return $currElement;
    },

    getRangeTargetElements : function (rangeCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(rangeCFI);
        var CFIAST = EPUBcfi.Parser.parse(decodedCFI);
        var indirectionNode;
        var indirectionStepNum;
        var $currElement;
        var $range1TargetElement;
        var $range2TargetElement;
        
        // Rationale: Since the correct content document for this CFI is already being passed, we can skip to the beginning 
        //   of the indirection step that referenced the content document.
        // Note: This assumes that indirection steps and index steps conform to an interface: an object with stepLength, idAssertion
        indirectionStepNum = this.getFirstIndirectionStepNum(CFIAST);
        indirectionNode = CFIAST.cfiString.localPath.steps[indirectionStepNum];
        indirectionNode.type = "indexStep";

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, indirectionStepNum, $("html", contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Interpret first range local_path
        $range1TargetElement = this.interpretLocalPath(CFIAST.cfiString.range1, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);

        // Interpret second range local_path
        $range2TargetElement = this.interpretLocalPath(CFIAST.cfiString.range2, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);

        // Return the element at the end of the CFI
        return {
            startElement : $range1TargetElement[0],
            endElement : $range2TargetElement[0]
        };
    },

    // Description: This method allows a "partial" CFI to be used to reference a target in a content document, without a 
    //   package document CFI component. 
    // Arguments: {
    //     contentDocumentCFI : This is a partial CFI that represents a path in a content document only. This partial must be 
    //        syntactically valid, even though it references a path starting at the top of a content document (which is a CFI that
    //        that has no defined meaning in the spec.)
    //     contentDocument : A DOM representation of the content document to which the partial CFI refers. 
    // }
    // Rationale: This method exists to meet the requirements of the Readium-SDK and should be used with care
    getTargetElementWithPartialCFI : function (contentDocumentCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(contentDocumentCFI);
        var CFIAST = EPUBcfi.Parser.parse(decodedCFI);
        var indirectionNode;
        
        // Interpret the path node 
        var $currElement = this.interpretIndexStepNode(CFIAST.cfiString.path, $("html", contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);

        // Return the element at the end of the CFI
        return $currElement;        
    },

    // Description: This method allows a "partial" CFI to be used, with a content document, to return the text node and offset 
    //    referenced by the partial CFI.
    // Arguments: {
    //     contentDocumentCFI : This is a partial CFI that represents a path in a content document only. This partial must be 
    //        syntactically valid, even though it references a path starting at the top of a content document (which is a CFI that
    //        that has no defined meaning in the spec.)
    //     contentDocument : A DOM representation of the content document to which the partial CFI refers. 
    // }
    // Rationale: This method exists to meet the requirements of the Readium-SDK and should be used with care
    getTextTerminusInfoWithPartialCFI : function (contentDocumentCFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {

        var decodedCFI = decodeURI(contentDocumentCFI);
        var CFIAST = EPUBcfi.Parser.parse(decodedCFI);
        var indirectionNode;
        var textOffset;
        
        // Interpret the path node 
        var $currElement = this.interpretIndexStepNode(CFIAST.cfiString.path, $("html", contentDocument), classBlacklist, elementBlacklist, idBlacklist);

        // Interpret the rest of the steps
        $currElement = this.interpretLocalPath(CFIAST.cfiString.localPath, 0, $currElement, classBlacklist, elementBlacklist, idBlacklist);

        // Return the element at the end of the CFI
        textOffset = parseInt(CFIAST.cfiString.localPath.termStep.offsetValue);
        return { textNode : $currElement,
                 textOffset : textOffset
            };
    },

    // ------------------------------------------------------------------------------------ //
    //  "PRIVATE" HELPERS                                                                   //
    // ------------------------------------------------------------------------------------ //

    getFirstIndirectionStepNum : function (CFIAST) {

        // Find the first indirection step in the local path; follow it like a regular step, as the step in the content document it 
        //   references is already loaded and has been passed to this method
        var stepNum = 0;
        for (stepNum; stepNum <= CFIAST.cfiString.localPath.steps.length - 1 ; stepNum++) {
        
            nextStepNode = CFIAST.cfiString.localPath.steps[stepNum];
            if (nextStepNode.type === "indirectionStep") {
                return stepNum;
            }
        }
    },

    // REFACTORING CANDIDATE: cfiString node and start step num could be merged into one argument, by simply passing the 
    //   starting step... probably a good idea, this would make the meaning of this method clearer.
    interpretLocalPath : function (localPathNode, startStepNum, $currElement, classBlacklist, elementBlacklist, idBlacklist) {

        var stepNum = startStepNum;
        var nextStepNode;
        for (stepNum; stepNum <= localPathNode.steps.length - 1 ; stepNum++) {
        
            nextStepNode = localPathNode.steps[stepNum];
            if (nextStepNode.type === "indexStep") {

                $currElement = this.interpretIndexStepNode(nextStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist);
            }
            else if (nextStepNode.type === "indirectionStep") {

                $currElement = this.interpretIndirectionStepNode(nextStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist);
            }
        }

        return $currElement;
    },

    interpretIndexStepNode : function (indexStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist) {

        // Check node type; throw error if wrong type
        if (indexStepNode === undefined || indexStepNode.type !== "indexStep") {

            throw EPUBcfi.NodeTypeError(indexStepNode, "expected index step node");
        }

        // Index step
        var $stepTarget = EPUBcfi.CFIInstructions.getNextNode(indexStepNode.stepLength, $currElement, classBlacklist, elementBlacklist, idBlacklist);

        // Check the id assertion, if it exists
        if (indexStepNode.idAssertion) {

            if (!EPUBcfi.CFIInstructions.targetIdMatchesIdAssertion($stepTarget, indexStepNode.idAssertion)) {

                throw EPUBcfi.CFIAssertionError(indexStepNode.idAssertion, $stepTarget.attr('id'), "Id assertion failed");
            }
        }

        return $stepTarget;
    },

    interpretIndirectionStepNode : function (indirectionStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist) {

        // Check node type; throw error if wrong type
        if (indirectionStepNode === undefined || indirectionStepNode.type !== "indirectionStep") {

            throw EPUBcfi.NodeTypeError(indirectionStepNode, "expected indirection step node");
        }

        // Indirection step
        var $stepTarget = EPUBcfi.CFIInstructions.followIndirectionStep(
            indirectionStepNode.stepLength, 
            $currElement, 
            classBlacklist, 
            elementBlacklist);

        // Check the id assertion, if it exists
        if (indirectionStepNode.idAssertion) {

            if (!EPUBcfi.CFIInstructions.targetIdMatchesIdAssertion($stepTarget, indirectionStepNode.idAssertion)) {

                throw EPUBcfi.CFIAssertionError(indirectionStepNode.idAssertion, $stepTarget.attr('id'), "Id assertion failed");
            }
        }

        return $stepTarget;
    },

    // REFACTORING CANDIDATE: The logic here assumes that a user will always want to use this terminus
    //   to inject content into the found node. This will not always be the case, and different types of interpretation
    //   are probably desired. 
    interpretTextTerminusNode : function (terminusNode, $currElement, elementToInject) {

        if (terminusNode === undefined || terminusNode.type !== "textTerminus") {

            throw EPUBcfi.NodeTypeError(terminusNode, "expected text terminus node");
        }

        var $injectedElement = EPUBcfi.CFIInstructions.textTermination(
            $currElement, 
            terminusNode.offsetValue, 
            elementToInject
            );

        return $injectedElement;
    },

    searchLocalPathForHref : function ($currElement, $packageDocument, localPathNode, classBlacklist, elementBlacklist, idBlacklist) {

        // Interpret the first local_path node, which is a set of steps and and a terminus condition
        var stepNum = 0;
        var nextStepNode;
        for (stepNum = 0 ; stepNum <= localPathNode.steps.length - 1 ; stepNum++) {
        
            nextStepNode = localPathNode.steps[stepNum];
            if (nextStepNode.type === "indexStep") {
                
                $currElement = this.interpretIndexStepNode(nextStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist);
            }
            else if (nextStepNode.type === "indirectionStep") {

                $currElement = this.interpretIndirectionStepNode(nextStepNode, $currElement, classBlacklist, elementBlacklist, idBlacklist);
            }

            // Found the content document href referenced by the spine item 
            if ($currElement.is("itemref")) {

                return EPUBcfi.CFIInstructions.retrieveItemRefHref($currElement, $packageDocument);
            }
        }

        return undefined;
    }
};