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

        describe("injectHighlightMarkersFromCFI()", function () {

            beforeEach(function () {

                var contentDoc = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
                var contentDocDom = (new window.DOMParser).parseFromString(contentDoc, "text/xml");
                this.reflowingAnnotations = new EpubReflowable.ReflowableAnnotations({
                    contentDocumentDOM : contentDocDom
                });
            });

            it("returns a list of selectedElements", function () {

                var expectedNumSelectedElementsFromFixture = 3;
                var annotationInfo = this.reflowingAnnotations.injectHighlightMarkersFromCFI("epubcfi(/6/14!/4/2,/6/1:10,/8/1:10)", "10");
                expect(annotationInfo.selectedElements.length).toBe(expectedNumSelectedElementsFromFixture);
            });
        });

        describe("injectBookmarkMarkerFromCFI()", function () {

            beforeEach(function () {

                var contentDoc = jasmine.getFixtures().read("moby_dick_content_doc.xhtml");
                var contentDocDom = (new window.DOMParser).parseFromString(contentDoc, "text/xml");
                this.reflowingAnnotations = new EpubReflowable.ReflowableAnnotations({
                    contentDocumentDOM : contentDocDom
                }); 
            });

            it("returns a list with a single injected bookmark element", function () {

                var annotationInfo = this.reflowingAnnotations.injectBookmarkMarkerFromCFI("epubcfi(/6/14!/4/2/6/1:10)", "10");
                expect(annotationInfo.selectedElements.length).toBe(1);
            });

            it("injects a bookmark marker", function () {

                var annotationInfo = this.reflowingAnnotations.injectBookmarkMarkerFromCFI("epubcfi(/6/14!/4/2/6/1:10)", "10");
                expect($(annotationInfo.selectedElements[0]).hasClass("bookmark-marker")).toBe(true);
            });
        });

        describe("getSelectionInfo()", function () {

            beforeEach(function () {
                this.reflowingAnnotations = new EpubReflowable.ReflowableAnnotations();
                var elements = "<html> \
                                    <div id='ancestor'> \
                                        <div id='a'> \
                                            <div id='b'> \
                                                test test test test \
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
                                               test test test test \
                                            </div> \
                                        </div> \
                                    </div> \
                                </html>";

                this.$elements = $((new window.DOMParser()).parseFromString(elements, "text/xml"));
            });

            it("returns the expected array of selected elements", function () {

                var annotationInfo;
                var selectedElements = [];
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

            it("returns a generated CFI for the range", function () {

            });
        });

        describe("generateRangeCFI()", function () {

            beforeEach(function () {
                this.reflowingAnnotations = new EpubReflowable.ReflowableAnnotations();
                var elements = "<html> \
                                    <div id='ancestor'> \
                                        <div id='a'> \
                                            <div id='b'> \
                                                test test test test \
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
                                               test test test test \
                                            </div> \
                                        </div> \
                                    </div> \
                                </html>";

                this.$elements = $((new window.DOMParser()).parseFromString(elements, "text/xml"));
            });

            it("can generate a range between a start and end text node", function () {

                var rangeCFIComponent;
                var selectedElements = [];
                var selection = document.createRange();
                selection.setStart($("#b", this.$elements)[0].firstChild, 30);
                selection.setEnd($("#h", this.$elements)[0].firstChild, 40);

                rangeCFIComponent = this.reflowingAnnotations.generateRangeCFI(selection);
                expect(rangeCFIComponent).toBe("!/2[ancestor],/2[a]/2[b]/1:30,/4[e]/4[h]/1:40");
            });
        });

        describe("findSelectedElements()", function () {

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

        describe("injectHighlightMarkers()", function () {

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

            it("injects markers when start and end node are the same", function () {

                var highlightSelection;
                var selection = document.createRange();
                selection.setStart($("#b", this.$elements)[0].firstChild, 10);
                selection.setEnd($("#b", this.$elements)[0].firstChild, 15);

                highlightSelection = this.reflowingAnnotations.injectHighlightMarkers(selection);

                expect($("#b", this.$elements).contents().length).toBe(5);
            });

            it("injects markers when start and end node are different", function () {

                var selection = document.createRange();
                selection.setStart($("#b", this.$elements)[0].firstChild, 10);
                selection.setEnd($("#c", this.$elements)[0].firstChild, 10);

                highlightSelection = this.reflowingAnnotations.injectHighlightMarkers(selection);

                expect($("#b", this.$elements).contents().length).toBe(3);
                expect($("#c", this.$elements).contents().length).toBe(3);
            });
        });

        describe("private helpers", function () {

            beforeEach(function () {
                this.reflowingAnnotations = new EpubReflowable.ReflowableAnnotations();
            });

            describe("getBookmarkMarker()", function () {

                it("gets the bookmark span html", function () {

                    var expectedSpanHtml = "<span class='bookmark-marker cfi-marker' id='10' data-cfi='epubcfi(/2/2/2/2)'></span>";
                    var resultSpanHtml = this.reflowingAnnotations.getBookmarkMarker("epubcfi(/2/2/2/2)", "10");

                    expect(resultSpanHtml).toBe(expectedSpanHtml);
                });

                it("can convert the html string to a dom element", function () {

                    var resultSpanHtml = this.reflowingAnnotations.getBookmarkMarker("epubcfi(/2/2/2/2)", "10");
                    var $domSpan = $(resultSpanHtml);

                    expect($domSpan.hasClass("bookmark-marker")).toBe(true);
                    expect($domSpan.hasClass("cfi-marker")).toBe(true);
                    expect($domSpan.attr("id")).toBe("10");
                    expect($domSpan.attr("data-cfi")).toBe("epubcfi(/2/2/2/2)");
                });
            });

            describe("getRangeStartMarker()", function () {

                it("gets the range start span html", function () {

                    var expectedSpanHtml = "<span class='range-start-marker cfi-marker' id='start-10' data-cfi='epubcfi(/2/2/2/2)'></span>";
                    var resultSpanHtml = this.reflowingAnnotations.getRangeStartMarker("epubcfi(/2/2/2/2)", "10");

                    expect(resultSpanHtml).toBe(expectedSpanHtml);
                });

                it("can convert the html string to a dom element", function () {

                    var resultSpanHtml = this.reflowingAnnotations.getRangeStartMarker("epubcfi(/2/2/2/2)", "10");
                    var $domSpan = $(resultSpanHtml);

                    expect($domSpan.hasClass("range-start-marker")).toBe(true);
                    expect($domSpan.hasClass("cfi-marker")).toBe(true);
                    expect($domSpan.attr("id")).toBe("start-10");
                    expect($domSpan.attr("data-cfi")).toBe("epubcfi(/2/2/2/2)");
                });
            });

            describe("getRangeEndMarker()", function () {

                it("gets the range end span html", function () {

                    var expectedSpanHtml = "<span class='range-end-marker cfi-marker' id='end-10' data-cfi='epubcfi(/2/2/2/2)'></span>";
                    var resultSpanHtml = this.reflowingAnnotations.getRangeEndMarker("epubcfi(/2/2/2/2)", "10");

                    expect(resultSpanHtml).toBe(expectedSpanHtml);
                });

                it("can convert the html string to a dom element", function () {

                    var resultSpanHtml = this.reflowingAnnotations.getRangeEndMarker("epubcfi(/2/2/2/2)", "10");
                    var $domSpan = $(resultSpanHtml);

                    expect($domSpan.hasClass("range-end-marker")).toBe(true);
                    expect($domSpan.hasClass("cfi-marker")).toBe(true);
                    expect($domSpan.attr("id")).toBe("end-10");
                    expect($domSpan.attr("data-cfi")).toBe("epubcfi(/2/2/2/2)");
                });
            });
        });
    });
});