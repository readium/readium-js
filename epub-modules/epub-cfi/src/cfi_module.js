define(
    ['require', 'module', 'jquery', './models/cfi_interpreter', './models/cfi_generator', './models/cfi_instructions'],
    function (require, module, $, Interpreter, Generator, CFIInstructions) {

        var EpubCFIModule = function () {

            // The public interface
            return {

                getContentDocHref: function (CFI, packageDocument) {
                    return Interpreter.getContentDocHref(CFI, packageDocument);
                },
                injectElement: function (CFI, contentDocument, elementToInject, classBlacklist, elementBlacklist,
                                         idBlacklist) {
                    return Interpreter.injectElement(CFI, contentDocument, elementToInject, classBlacklist,
                        elementBlacklist, idBlacklist);
                },
                getTargetElement: function (CFI, contentDocument, classBlacklist, elementBlacklist, idBlacklist) {
                    return Interpreter.getTargetElement(CFI, contentDocument, classBlacklist, elementBlacklist,
                        idBlacklist);
                },
                getTargetElementWithPartialCFI: function (contentDocumentCFI, contentDocument, classBlacklist,
                                                          elementBlacklist, idBlacklist) {
                    return Interpreter.getTargetElementWithPartialCFI(contentDocumentCFI, contentDocument,
                        classBlacklist, elementBlacklist, idBlacklist);
                },
                getTextTerminusInfoWithPartialCFI: function (contentDocumentCFI, contentDocument, classBlacklist,
                                                             elementBlacklist, idBlacklist) {
                    return Interpreter.getTextTerminusInfoWithPartialCFI(contentDocumentCFI, contentDocument,
                        classBlacklist, elementBlacklist, idBlacklist);
                },
                generateCharacterOffsetCFIComponent: function (startTextNode, characterOffset, classBlacklist,
                                                               elementBlacklist, idBlacklist) {
                    return Generator.generateCharacterOffsetCFIComponent(startTextNode, characterOffset, classBlacklist,
                        elementBlacklist, idBlacklist);
                },
                generateElementCFIComponent: function (startElement, classBlacklist, elementBlacklist, idBlacklist) {
                    return Generator.generateElementCFIComponent(startElement, classBlacklist, elementBlacklist,
                        idBlacklist);
                },
                generatePackageDocumentCFIComponent: function (contentDocumentName, packageDocument, classBlacklist,
                                                               elementBlacklist, idBlacklist) {
                    return Generator.generatePackageDocumentCFIComponent(contentDocumentName, packageDocument,
                        classBlacklist, elementBlacklist, idBlacklist);
                },
                generatePackageDocumentCFIComponentWithSpineIndex: function (spineIndex, packageDocument,
                                                                             classBlacklist, elementBlacklist,
                                                                             idBlacklist) {
                    return Generator.generatePackageDocumentCFIComponentWithSpineIndex(spineIndex, packageDocument,
                        classBlacklist, elementBlacklist, idBlacklist);
                },
                generateCompleteCFI: function (packageDocumentCFIComponent, contentDocumentCFIComponent) {
                    return Generator.generateCompleteCFI(packageDocumentCFIComponent, contentDocumentCFIComponent);
                },
                injectElementAtOffset: function ($textNodeList, textOffset, elementToInject) {
                    return CFIInstructions.injectCFIMarkerIntoText($textNodeList, textOffset, elementToInject);
                },
                injectRangeElements: function (rangeCFI, contentDocument, startElementToInject, endElementToInject,
                                               classBlacklist, elementBlacklist, idBlacklist) {
                    return Interpreter.injectRangeElements(rangeCFI, contentDocument, startElementToInject,
                        endElementToInject, classBlacklist, elementBlacklist, idBlacklist);
                },
                getRangeTargetElements: function (rangeCFI, contentDocument, classBlacklist, elementBlacklist,
                                                  idBlacklist) {
                    return Interpreter.getRangeTargetElements(rangeCFI, contentDocument, classBlacklist,
                        elementBlacklist, idBlacklist);
                },
                generateCharOffsetRangeComponent: function (rangeStartElement, startOffset, rangeEndElement, endOffset,
                                                            classBlacklist, elementBlacklist, idBlacklist) {
                    return Generator.generateCharOffsetRangeComponent(rangeStartElement, startOffset, rangeEndElement,
                        endOffset, classBlacklist, elementBlacklist, idBlacklist);
                },
                generateElementRangeComponent: function (rangeStartElement, rangeEndElement, classBlacklist,
                                                         elementBlacklist, idBlacklist) {
                    return Generator.generateElementRangeComponent(rangeStartElement, rangeEndElement, classBlacklist,
                        elementBlacklist, idBlacklist);
                }
            };
        };
        return EpubCFIModule;
    });