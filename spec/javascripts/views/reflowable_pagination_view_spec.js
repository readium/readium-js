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

            spyOn(EpubReflowable.ReflowablePaginationView.prototype, "rePaginationHandler");
            spyOn(EpubReflowable.ReflowablePaginationView.prototype, "themeChangeHandler");
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
                expect(this.view.rePaginationHandler).toHaveBeenCalled();
            });
        });

        describe("setMargin()", function () {

            it("sets the margin", function () {

                this.view.setMargin(3);
                expect(this.view.viewerModel.get("currentMargin")).toBe(3);
            }); 

            it("calls the rePagination handler", function () {

                this.view.setMargin(12);
                expect(this.view.rePaginationHandler).toHaveBeenCalled();
            });
        });

        describe("setTheme()", function () {

            it("sets the theme", function () {

                this.view.setTheme("other");
                expect(this.view.viewerModel.get("currentTheme")).toBe("other");
            }); 

            it("calls the theme changed handler", function () {

                this.view.setTheme("other");
                expect(this.view.themeChangeHandler).toHaveBeenCalled();
            });
        });

        describe("setSyntheticLayout()", function () {
            
            it("sets the synthetic layout to true", function () {

                this.view.setSyntheticLayout(true);
                expect(this.view.viewerModel.get("twoUp")).toBe(true);
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

            it("shows the page", function () {
            });
        });

        describe("insertSelectionMarkers", function () {

            beforeEach(function () {

                var elements = "<div id='ancestor'> \
                                    <div id='a'> \
                                        <div id='b'> start start start \
                                        </div> \
                                        <div id='c'> \
                                        </div> \
                                        <div id='d'> \
                                        </div> \
                                    </div> \
                                    <div id='e'> \
                                        <div id ='f'> \
                                            <div id ='g'> end end end \
                                            </div> \
                                        </div> \
                                        <div id='h'> \
                                        </div> \
                                    </div> \
                                </div>";

                this.$elements = $(elements);
                this.selection = document.createRange();
                this.selection.setStart($("#b", this.$elements)[0].firstChild);
                this.selection.setEnd($("#g", this.$elements)[0].firstChild);
            });

            it("inserts the start and end marker", function () {

                spyOn(this.view, "getCurrentSelectionRange").andReturn(this.selection);
                this.view.insertSelectionMarkers();
            });
        });
    });
});