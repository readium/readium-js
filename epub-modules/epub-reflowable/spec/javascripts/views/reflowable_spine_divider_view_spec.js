describe("EpubReflowable.ReflowableSpineDividerView", function () {

    describe("initialization", function () {

        it("exist in namespace", function () {

            expect(EpubReflowable.ReflowableSpineDividerView).toBeDefined();
        });

        it("can be initialized", function () {

            var spineDivider = new EpubReflowable.ReflowableSpineDividerView();
            expect(spineDivider).toBeDefined();
        });

        it("sets a custom style if provided", function () {

            var spineDivider = new EpubReflowable.ReflowableSpineDividerView({"customStyle" : { "color" : "black", "border-width" : "10px" }});
            expect(spineDivider.currentStyle).toEqual({
                "position" : "absolute",
                "z-index" : "2",
                "left" : "50%",
                "top" : "0px",
                "color" : "black",
                "border-width" : "10px"
            });
        }); 

        it("sets no-spine as default", function () {

            var spineDivider = new EpubReflowable.ReflowableSpineDividerView();
            expect(spineDivider.currentStyle).toEqual({
                "position" : "absolute",
                "z-index" : "2",
                "left" : "50%",
                "top" : "0px"
            });
        });
    });

    describe("public interface", function () {

        describe("render()", function () {
            
            var spineDivider;
            beforeEach(function () {

                spineDivider = new EpubReflowable.ReflowableSpineDividerView();
            });

            it("sets the element style", function () {

                spineDivider.render();

                expect(spineDivider.$el.css("position")).toBe("absolute");
                expect(spineDivider.$el.css("left")).toBe("0px"); // Because element is not in the dom
            });
        });

        describe("setCurrentStyle()", function () {

            var spineDivider;
            beforeEach(function () {

                spineDivider = new EpubReflowable.ReflowableSpineDividerView();
            });

            it("sets the current style from a default", function () {

                spineDivider.setCurrentStyle("box-shadow");
                expect(spineDivider.currentStyle).toEqual({
                    "position" : "absolute",
                    "z-index" : "2",
                    "left" : "50%",
                    "height" : "93%",
                    "top" : "3%",
                    "width" : "1px",
                    "-webkit-box-shadow" : "0 0 5px 5px rgba(80, 80, 80, 0.5)"
                });
            });

            it("applies the style to the element from a default", function () {

                spineDivider.setCurrentStyle("box-shadow");

                expect(spineDivider.$el.css("position")).toBe("absolute");
                expect(spineDivider.$el.css("z-index")).toBe("2");
                expect(spineDivider.$el.css("left")).toBe("0px"); // Because element is not in the dom
                expect(spineDivider.$el.css("height")).toBe("93%");
                expect(spineDivider.$el.css("top")).toBe("0px");
                expect(spineDivider.$el.css("-webkit-box-shadow")).toBe("rgba(80, 80, 80, 0.498039) 0px 0px 5px 5px");
            });

            it("does nothing if the default is undefined", function () {

                spineDivider.setCurrentStyle("this is not defined");

                expect(spineDivider.currentStyle).toEqual({
                    "position" : "absolute",
                    "z-index" : "2",
                    "left" : "50%",
                    "top" : "0px"
                });
            });

            it("sets the current style from an object", function () {

                spineDivider.setCurrentStyle({
                    "border-color" : "black",
                    "border-width" : "10px"
                });

                expect(spineDivider.currentStyle).toEqual({
                    "position" : "absolute",
                    "z-index" : "2",
                    "left" : "50%",
                    "top" : "0px",
                    "border-color" : "black",
                    "border-width" : "10px"
                });
            });

            it("applies the style to the element from an object", function () {

                spineDivider.setCurrentStyle({
                    "border-color" : "black",
                    "border-width" : "10px"
                });

                expect(spineDivider.$el.css("position")).toBe("absolute");
                expect(spineDivider.$el.css("z-index")).toBe("2");
                expect(spineDivider.$el.css("left")).toBe("0px"); // Because element is not in the dom
                expect(spineDivider.$el.css("height")).toBe("0px");
                expect(spineDivider.$el.css("border-color")).toBe("black");
                expect(spineDivider.$el.css("border-width")).toBe("10px");
            });
        });
    });

    describe("private helpers", function () {
    });
});