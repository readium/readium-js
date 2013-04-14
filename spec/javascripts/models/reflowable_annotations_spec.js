describe("EpubReflowable.ReflowableAnnotations", function () {

    describe("initialization", function () {

        beforeEach(function () {
            this.reflowingAnnotations = new EpubReflowable.ReflowableAnnotations();
        });

        it("can be initialized", function () {
            expect(this.reflowingAnnotations).toBeDefined();
        });
    });

    describe("public interface", function () {

        beforeEach(function () {
            this.reflowingAnnotations = new EpubReflowable.ReflowableAnnotations();
        });

        describe("getSelectionInfo()", function () {

        });

        describe("findSelectedElements()", function () {

            it("gets elements in pre-order", function () {

                var elements = "<div id='ancestor'> \
                                    <div id='a'> \
                                        <div id='b'> \
                                        </div> \
                                        <div id='c'> \
                                        </div> \
                                        <div id='d'> \
                                        </div> \
                                    </div> \
                                    <div id='e'> \
                                        <div id ='f'> \
                                            <div id ='g'> \
                                            </div> \
                                        </div> \
                                        <div id='h'> \
                                        </div> \
                                    </div> \
                                </div>";

                var $elements = $(elements);
                // Expected order, starting from b, is: b, c, d, e, f, g, h

                var commonAncestor = $elements[0];
                var startElement = $("#b", $elements)[0];
                var endElement = $("#h", $elements)[0];
                var selectedElements = [];
                this.reflowingAnnotations.findSelectedElements(
                    commonAncestor,
                    startElement, 
                    endElement,
                    { startElementFound : false, endElementFound : false },
                    selectedElements,
                    "div"
                );

                expect(selectedElements[0].id).toBe("b");
                expect(selectedElements[1].id).toBe("c");
                expect(selectedElements[2].id).toBe("d");
                expect(selectedElements[3].id).toBe("e");
                expect(selectedElements[4].id).toBe("f");
                expect(selectedElements[5].id).toBe("g");
                expect(selectedElements[6].id).toBe("h");
            });
        });
    });
});