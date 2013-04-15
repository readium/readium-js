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

            this.$elements = $(elements);
        });

        describe("getSelectionInfo()", function () {

            it("returns an annotation info object", function () {

                var annotationInfo;
                var selectedElements;
                var selection = document.createRange();
                selection.setStart($("#b", this.$elements)[0]);
                selection.setEnd($("#h", this.$elements)[0]);

                annotationInfo = this.reflowingAnnotations.getSelectionInfo(selection);

                selectedElements = annotationInfo.selectedElements;
                expect(selectedElements[0].id).toBe("b");
                expect(selectedElements[1].id).toBe("c");
                expect(selectedElements[2].id).toBe("d");
                expect(selectedElements[3].id).toBe("e");
                expect(selectedElements[4].id).toBe("f");
                expect(selectedElements[5].id).toBe("g");
                expect(selectedElements[6].id).toBe("h");
            });
        });

        describe("findSelectedElements()", function () {

            it("gets elements in pre-order", function () {

                // Expected order, starting from b, is: b, c, d, e, f, g, h
                var commonAncestor = this.$elements[0];
                var startElement = $("#b", this.$elements)[0];
                var endElement = $("#h", this.$elements)[0];
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