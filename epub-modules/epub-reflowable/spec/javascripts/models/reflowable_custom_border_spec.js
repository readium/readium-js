describe("EpubReflowable.ReflowableCustomBorder", function () {

    describe("initialization", function () {

        it("exist in namespace", function () {

            expect(EpubReflowable.ReflowableCustomBorder).toBeDefined();
        });

        it("can be initialized", function () {

            var borderStyleView = new EpubReflowable.ReflowableCustomBorder({ 
                targetElement : $(document.createElement("div"))
            });
            expect(borderStyleView).toBeDefined();
        });

        it("sets a custom style if provided", function () {

            var borderStyleView = new EpubReflowable.ReflowableCustomBorder({"customStyle" : { "color" : "black", "border-width" : "10px" }});
            expect(borderStyleView.currentStyle).toEqual({
                "position" : "relative",
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

            var borderStyleView = new EpubReflowable.ReflowableCustomBorder();
            expect(borderStyleView.currentStyle).toEqual({
                "position" : "relative",
                "z-index" : "0",
                "top" : "0px",
                "left" : "0px",
                "width" : "100%",
                "height" : "100%"
            });
        });
    });

    describe("public interface", function () {

        describe("setCurrentStyle", function () {

            var borderStyleView;
            beforeEach(function () {

                borderStyleView = new EpubReflowable.ReflowableCustomBorder({ 
                    targetElement : $(document.createElement("div"))
                });
            });

            it("sets the current style from a default", function () {

                borderStyleView.setCurrentStyle("box-shadow");
                expect(borderStyleView.currentStyle).toEqual({
                    "position" : "relative",
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

                expect(borderStyleView.$element.css("position")).toBe("relative");
                expect(borderStyleView.$element.css("z-index")).toBe("0");
                expect(borderStyleView.$element.css("top")).toBe("0px");
                expect(borderStyleView.$element.css("left")).toBe("0px");
                expect(borderStyleView.$element.css("width")).toBe("100%");
                expect(borderStyleView.$element.css("height")).toBe("100%");
                expect(borderStyleView.$element.css("-webkit-box-shadow")).toBe("rgba(80, 80, 80, 0.498039) 0px 0px 5px 5px");
            });

            it("does nothing if the default is undefined", function () {

                borderStyleView.setCurrentStyle("this is not defined");

                expect(borderStyleView.currentStyle).toEqual({
                    "position" : "relative",
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
                    "position" : "relative",
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

                expect(borderStyleView.$element.css("position")).toBe("relative");
                expect(borderStyleView.$element.css("z-index")).toBe("0");
                expect(borderStyleView.$element.css("top")).toBe("0px");
                expect(borderStyleView.$element.css("left")).toBe("0px");
                expect(borderStyleView.$element.css("width")).toBe("100%");
                expect(borderStyleView.$element.css("height")).toBe("100%");
                expect(borderStyleView.$element.css("border-color")).toBe("black");
                expect(borderStyleView.$element.css("border-width")).toBe("10px");
            });
        });
    });

    describe("private helpers", function () {
    });
});