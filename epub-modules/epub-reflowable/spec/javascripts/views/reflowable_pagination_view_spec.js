describe("EpubReflowable.ReflowablePaginationView", function () {

    describe("initialization", function () {

        beforeEach(function () {

            var spineItem = {
                contentDocumentUri : "",
                title : "an epub", 
                firstPageIsOffset : false,
                pageProgressionDirection : "ltr", 
                spineIndex : 1 
            };

            var viewerSettings = {
                fontSize : 3,
                syntheticLayout : false,
                currentMargin : 3,
                tocVisible : false,
                currentTheme : "default"
            };

            var contentDocumentCFIs = [
                {
                    cfi : "/2/2/2:1",
                    payload : "payload 1",
                    callback : undefined,
                    callbackContext : undefined
                },
                {
                    cfi : "/3/2/3:2",
                    payload : "payload 2",
                    callback : undefined,
                    callbackContext : undefined 
                },
                {
                    cfi : "/4/2/2:1",
                    payload : "payload 3",
                    callback : undefined,
                    callbackContext : undefined
                }
            ];

            var bindings = [{
                    handler : "figure-gallery-impl",
                    media_type : "application/xhtml+xml"
                }
            ];

            this.view = new EpubReflowable.ReflowablePaginationView({
                spineItem : spineItem,
                viewerSettings : viewerSettings,
                contentDocumentCFIs : contentDocumentCFIs,
                bindings : bindings
            });
        });

        it("exists in namespace", function () {

            expect(EpubReflowable.ReflowablePaginationView).toBeDefined();
        });

        it("can be initialized", function () {

            expect(typeof this.view).toBe("object");
        });
    });

    describe("public interface", function () {

        beforeEach(function () {

            var spineItem = {
                contentDocumentUri : "",
                title : "an epub", 
                firstPageIsOffset : false,
                pageProgressionDirection : "ltr", 
                spineIndex : 1 
            };

            var viewerSettings = {
                fontSize : 3,
                syntheticLayout : false,
                currentMargin : 3,
                tocVisible : false,
                currentTheme : "default"
            };

            var contentDocumentCFIs = [
                {
                    cfi : "/2/2/2:1",
                    payload : "payload 1",
                    callback : undefined,
                    callbackContext : undefined
                },
                {
                    cfi : "/3/2/3:2",
                    payload : "payload 2",
                    callback : undefined,
                    callbackContext : undefined 
                },
                {
                    cfi : "/4/2/2:1",
                    payload : "payload 3",
                    callback : undefined,
                    callbackContext : undefined
                }
            ];

            var bindings = [{
                    handler : "figure-gallery-impl",
                    media_type : "application/xhtml+xml"
                }
            ];

            spyOn(EpubReflowable.ReflowablePaginationView.prototype, "paginateContentDocument");
            spyOn(EpubReflowable.ReflowablePagination.prototype, "toggleTwoUp");
            this.view = new EpubReflowable.ReflowablePaginationView({
                spineItem : spineItem,
                viewerSettings : viewerSettings,
                contentDocumentCFIs : contentDocumentCFIs,
                bindings : bindings
            });
            this.view.delegateEvents();
        });

        describe("setFontSize()", function () {

            it("sets the font size", function () {

                this.view.setFontSize(14);
                expect(this.view.viewerModel.get("fontSize")).toBe(14);
            }); 

            it("calls the rePagination handler", function () {

                this.view.setFontSize(12);
                expect(this.view.paginateContentDocument).toHaveBeenCalled();
            });
        });

        describe("setMargin()", function () {

            it("sets the margin", function () {

                this.view.setMargin(3);
                expect(this.view.viewerModel.get("currentMargin")).toBe(3);
            }); 

            it("calls the rePagination handler", function () {

                this.view.setMargin(12);
                expect(this.view.paginateContentDocument).toHaveBeenCalled();
            });
        });

        describe("setTheme()", function () {
        });

        describe("setSyntheticLayout()", function () {
            
            it("sets the synthetic layout to true", function () {

                this.view.setSyntheticLayout(true);
                expect(this.view.viewerModel.get("syntheticLayout")).toBe(true);
            }); 

            it("calls the synthetic layout toggle method", function () {

                this.view.setSyntheticLayout(true);
                expect(this.view.pages.toggleTwoUp).toHaveBeenCalled();
            });

            it("does nothing if the layout is the same", function () {

                this.view.setSyntheticLayout(false);
                expect(this.view.pages.toggleTwoUp).not.toHaveBeenCalled();
            });
        });

        describe("showPageForCFI()", function () {
        });

        describe("events", function () {

            beforeEach(function () {

                var spineItem = {
                    contentDocumentURI : "epub_content/moby_dick/OPS/chapter_002.xhtml",
                    title : "Test from Accessible Epub 3.0", 
                    firstPageIsOffset : false,
                    pageProgressionDirection : "ltr", 
                    spineIndex : 1,
                    isFixedLayout : false
                };

                var viewerSettings = {
                    fontSize : 3,
                    syntheticLayout : false,
                    currentMargin : 3,
                    tocVisible : false,
                    currentTheme : "default"
                };

                var contentDocumentCFIs = [];

                var bindings = [{
                        handler : "figure-gallery-impl",
                        media_type : "application/xhtml+xml"
                    }
                ];

                this.view = new EpubReflowable.ReflowablePaginationView({
                    spineItem : spineItem,
                    viewerSettings : viewerSettings,
                    contentDocumentCFIs : contentDocumentCFIs,
                    bindings : bindings
                });

                spyOn(this.view, "trigger");

                // Rationale: Shortcut this for testing events, otherwise it throws an error
                spyOn(this.view, "moveViewportToPage").andCallFake(function () {});
            });

            // Rationale: Need to load an actual content document
            // it("triggers contentDocumentLoaded once rendered", function () {
            // });

            // Rationale: This only tests whether the event is trigger on the view if the handler is executed; it is not
            //   testing whether the handler actually gets bound to anything. 
            it("triggers linkClicked on click", function () {

                var eventObject = $.Event("click");
                this.view.linkClickHandler(eventObject);
                expect(this.view.trigger).toHaveBeenCalledWith("internalLinkClicked", eventObject);
            });

            it("triggers the nextPage event", function () {

                this.view.pages.set("numberOfPages", 4);
                this.view.nextPage();
                expect(this.view.trigger).toHaveBeenCalledWith("atNextPage");
            });

            it("triggers the previousPage event", function () {

                this.view.pages.set("currentPages", [2]);
                this.view.previousPage();
                expect(this.view.trigger).toHaveBeenCalledWith("atPreviousPage");
            });

            it("triggers layoutChanged: when layout changes to synthetic", function () {

                // Initialize some extra test state
                this.view.viewerModel.set("syntheticLayout", false);

                // Test
                this.view.setSyntheticLayout(true);
                expect(this.view.trigger).toHaveBeenCalledWith("layoutChanged", true);
            });

            it("triggers layoutChanged: when layout changes to single", function () {

                // Initialize some extra test state
                this.view.viewerModel.set("syntheticLayout", true);

                // Test
                this.view.setSyntheticLayout(false);
                expect(this.view.trigger).toHaveBeenCalledWith("layoutChanged", false);
            });

            it("triggers onFirstPage WHILE ON first page", function () {

                this.view.pages.set("currentPages", [1]);
                this.view.viewerModel.set("syntheticLayout", false);
                this.view.previousPage();

                expect(this.view.trigger).toHaveBeenCalledWith("onFirstPage");
            });

            it("triggers onFirstPage WHEN first page reached", function () {

                this.view.pages.set("currentPages", [2]);
                this.view.viewerModel.set("syntheticLayout", false);
                this.view.previousPage();

                expect(this.view.trigger).toHaveBeenCalledWith("onFirstPage");
            });

            it("triggers onLastPage WHILE ON last page", function () {

                this.view.pages.set("numberOfPages", 4);
                this.view.viewerModel.set("syntheticLayout", false);
                this.view.pages.set("currentPages", [4]);
                this.view.nextPage();

                expect(this.view.trigger).toHaveBeenCalledWith("onLastPage");
            });

            it("triggers onLastPage WHEN last page reached", function () {

                this.view.pages.set("numberOfPages", 4);
                this.view.viewerModel.set("syntheticLayout", false);
                this.view.pages.set("currentPages", [3]);
                this.view.nextPage();

                expect(this.view.trigger).toHaveBeenCalledWith("onLastPage");
            });

            // Rationale: These would be cleaner if an actual content document were loaded in the iframe; some
            //   are commented out as the lack of a loaded iframe throws to errors unrelated to the code being
            //   tested here.
            describe("contentChanged event", function () {

                it("triggers the displayedContentChanged event: next page", function () {

                    this.view.nextPage()
                    expect(this.view.trigger).toHaveBeenCalledWith("displayedContentChanged");
                });

                it("triggers the displayedContentChanged event: previous page", function () {

                    this.view.pages.set("currentPages", [2]);
                    this.view.previousPage();
                    expect(this.view.trigger).toHaveBeenCalledWith("displayedContentChanged");
                });

                it("triggers the displayedContentChanged event: show by page number", function () {

                    this.view.pages.set("numberOfPages", 3);
                    this.view.showPageByNumber(3);
                    expect(this.view.trigger).toHaveBeenCalledWith("displayedContentChanged");
                });
                
                // it("triggers the displayedContentChanged event: show by cfi", function () {
                // });

                // it("triggers the displayedContentChanged event: show by id", function () {
                // });

                // it("triggers the displayedContentChanged event: re-pagination", function () {
                // });
            });
        });
    });
});