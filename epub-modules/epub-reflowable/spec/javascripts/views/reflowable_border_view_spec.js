describe("EpubReflowable.ReflowableBorderView", function () {

    describe("initialization", function () {

        it("exist in namespace", function () {

            expect(EpubReflowable.ReflowableBorderView).toBeDefined();
        });

        it("can be initialized", function () {

            var borderStyleView = new EpubReflowable.ReflowableBorderView();
            expect(borderStyleView).toBeDefined();
        });

        it("sets a custom style if provided", function () {

            var borderStyleView = new EpubReflowable.ReflowableBorderView({"customStyle" : { "color" : "black", "border-width" : "10px" }});
            expect(borderStyleView.currentStyle).toEqual({
                "position" : "absolute",
                "z-index" : "0",
                "top" : "0px",
                "left" : "0px",
                "width" : "100%",
                "height" : "100%",
                "color" : "black",
                "border-width" : "10px"
            });
        }); 

        it("sets no-border as default", function () {

            var borderStyleView = new EpubReflowable.ReflowableBorderView();
            expect(borderStyleView.currentStyle).toEqual({
                "position" : "absolute",
                "z-index" : "0",
                "top" : "0px",
                "left" : "0px",
                "width" : "100%",
                "height" : "100%"
            });
        });
    });

    describe("public interface", function () {

        describe("render()", function () {

            var borderStyleView;
            beforeEach(function () {

                borderStyleView = new EpubReflowable.ReflowableBorderView();
            });

            it("sets the element style", function () {

                borderStyleView.render();

                expect(borderStyleView.$el.css("position")).toBe("absolute");
                expect(borderStyleView.$el.css("top")).toBe("0px");
                expect(borderStyleView.$el.css("left")).toBe("0px");
                expect(borderStyleView.$el.css("width")).toBe("100%");
                expect(borderStyleView.$el.css("height")).toBe("100%");
            });
        });

        describe("setCurrentStyle", function () {

            var borderStyleView;
            beforeEach(function () {

                borderStyleView = new EpubReflowable.ReflowableBorderView();
            });

            it("sets the current style from a default", function () {

                borderStyleView.setCurrentStyle("box-shadow");
                expect(borderStyleView.currentStyle).toEqual({
                    "position" : "absolute",
                    "z-index" : "0",
                    "top" : "0px",
                    "left" : "0px",
                    "width" : "100%",
                    "height" : "100%",
                    "-webkit-box-shadow" : "0 0 5px 5px rgba(80, 80, 80, 0.5)"
                });
            });

            it("applies the style to the element from a default", function () {

                borderStyleView.setCurrentStyle("box-shadow");

                expect(borderStyleView.$el.css("position")).toBe("absolute");
                expect(borderStyleView.$el.css("z-index")).toBe("0");
                expect(borderStyleView.$el.css("top")).toBe("0px");
                expect(borderStyleView.$el.css("left")).toBe("0px");
                expect(borderStyleView.$el.css("width")).toBe("100%");
                expect(borderStyleView.$el.css("height")).toBe("100%");
                expect(borderStyleView.$el.css("-webkit-box-shadow")).toBe("rgba(80, 80, 80, 0.498039) 0px 0px 5px 5px");
            });

            it("does nothing if the default is undefined", function () {

                borderStyleView.setCurrentStyle("this is not defined");

                expect(borderStyleView.currentStyle).toEqual({
                    "position" : "absolute",
                    "z-index" : "0",
                    "top" : "0px",
                    "left" : "0px",
                    "width" : "100%",
                    "height" : "100%"
                });
            });

            it("sets the current style from an object", function () {

                borderStyleView.setCurrentStyle({
                    "border-color" : "black",
                    "border-width" : "10px"
                });

                expect(borderStyleView.currentStyle).toEqual({
                    "position" : "absolute",
                    "z-index" : "0",
                    "top" : "0px",
                    "left" : "0px",
                    "width" : "100%",
                    "height" : "100%",
                    "border-color" : "black",
                    "border-width" : "10px"
                });
            });

            it("applies the style to the element from an object", function () {

                borderStyleView.setCurrentStyle({
                    "border-color" : "black",
                    "border-width" : "10px"
                });

                expect(borderStyleView.$el.css("position")).toBe("absolute");
                expect(borderStyleView.$el.css("z-index")).toBe("0");
                expect(borderStyleView.$el.css("top")).toBe("0px");
                expect(borderStyleView.$el.css("left")).toBe("0px");
                expect(borderStyleView.$el.css("width")).toBe("100%");
                expect(borderStyleView.$el.css("height")).toBe("100%");
                expect(borderStyleView.$el.css("border-color")).toBe("black");
                expect(borderStyleView.$el.css("border-width")).toBe("10px");
            });
        });
    });

    describe("private helpers", function () {
    });
});