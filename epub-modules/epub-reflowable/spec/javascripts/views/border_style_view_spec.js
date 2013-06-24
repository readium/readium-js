describe("EpubReflowable.BorderStyleView", function () {

    describe("initialization", function () {

        it("exist in namespace", function () {

            expect(EpubReflowable.BorderStyleView).toBeDefined();
        });

        it("can be initialized", function () {

            var borderStyleView = new EpubReflowable.BorderStyleView();
            expect(borderStyleView).toBeDefined();
        });

        it("instantiates the borderSize state", function () {

            var borderStyleView = new EpubReflowable.BorderStyleView();
            expect(borderStyleView.borderSize).toEqual({ top : 0, left : 0, width : 0, height : 0 });
        });

        it("sets a custom style if provided", function () {

            var borderStyleView = new EpubReflowable.BorderStyleView({"customStyle" : { "color" : "black", "border-width" : "10px" }});
            expect(borderStyleView.currentStyle).toEqual({
                "position" : "absolute",
                "top" : "0px",
                "left" : "0px",
                "width" : "0px",
                "height" : "0px",
                "color" : "black",
                "border-width" : "10px"
            });
        }); 

        it("sets no-border as default", function () {

            var borderStyleView = new EpubReflowable.BorderStyleView();
            expect(borderStyleView.currentStyle).toEqual({
                "position" : "absolute",
                "top" : "0px",
                "left" : "0px",
                "width" : "0px",
                "height" : "0px"
            });
        });
    });

    describe("public interface", function () {

        describe("render()", function () {
            
            var borderStyleView;
            beforeEach(function () {

                borderStyleView = new EpubReflowable.BorderStyleView();
            });

            it("updates the border element size", function () {

                var top = 10;
                var left = 10;
                var width = 500;
                var height = 500;
                borderStyleView.render(top, left, width, height);

                expect(borderStyleView.borderSize).toEqual({
                    "top" : 10,
                    "left" : 10,
                    "width" : 500,
                    "height" : 500
                });
            });

            it("updates the current style size", function () {
                
                var top = 10;
                var left = 10;
                var width = 500;
                var height = 500;
                borderStyleView.render(top, left, width, height);

                expect(borderStyleView.currentStyle).toEqual({
                    "position" : "absolute",
                    "top" : "10px",
                    "left" : "10px",
                    "width" : "500px",
                    "height" : "500px"
                });
            });

            it("sets the element style", function () {

                var top = 10;
                var left = 10;
                var width = 500;
                var height = 500;
                borderStyleView.render(top, left, width, height);

                expect(borderStyleView.$el.css("position")).toBe("absolute");
                expect(borderStyleView.$el.css("top")).toBe("10px");
                expect(borderStyleView.$el.css("left")).toBe("10px");
                expect(borderStyleView.$el.css("width")).toBe("500px");
                expect(borderStyleView.$el.css("height")).toBe("500px");
            });
        });

        describe("resizeBorderElement()", function () {

            var borderStyleView;
            beforeEach(function () {

                borderStyleView = new EpubReflowable.BorderStyleView();
            });

            it("updates the border size", function () {

                var top = 10;
                var left = 10;
                var width = 500;
                var height = 500;
                borderStyleView.resizeBorderElement(top, left, width, height);

                expect(borderStyleView.borderSize).toEqual({
                    "top" : 10,
                    "left" : 10,
                    "width" : 500,
                    "height" : 500
                });
            });

            it("updates the current style size", function () {

                var top = 10;
                var left = 10;
                var width = 500;
                var height = 500;
                borderStyleView.resizeBorderElement(top, left, width, height);

                expect(borderStyleView.currentStyle).toEqual({
                    "position" : "absolute",
                    "top" : "10px",
                    "left" : "10px",
                    "width" : "500px",
                    "height" : "500px"
                });
            });

            it("sets the element style", function () {

                var top = 10;
                var left = 10;
                var width = 500;
                var height = 500;
                borderStyleView.resizeBorderElement(top, left, width, height);

                expect(borderStyleView.$el.css("position")).toBe("absolute");
                expect(borderStyleView.$el.css("top")).toBe("10px");
                expect(borderStyleView.$el.css("left")).toBe("10px");
                expect(borderStyleView.$el.css("width")).toBe("500px");
                expect(borderStyleView.$el.css("height")).toBe("500px");
            });
        });

        describe("setCurrentStyle", function () {

            var borderStyleView;
            beforeEach(function () {

                borderStyleView = new EpubReflowable.BorderStyleView();
            });

            it("sets the current style from a default", function () {

                borderStyleView.setCurrentStyle("box-shadow");
                expect(borderStyleView.currentStyle).toEqual({
                    "position" : "absolute",
                    "top" : "0px",
                    "left" : "0px",
                    "width" : "0px",
                    "height" : "0px",
                    "-webkit-box-shadow" : "0 0 5px 5px rgba(80, 80, 80, 0.5)"
                });
            });

            it("applies the style to the element from a default", function () {

                borderStyleView.setCurrentStyle("box-shadow");

                expect(borderStyleView.$el.css("position")).toBe("absolute");
                expect(borderStyleView.$el.css("top")).toBe("0px");
                expect(borderStyleView.$el.css("left")).toBe("0px");
                expect(borderStyleView.$el.css("width")).toBe("0px");
                expect(borderStyleView.$el.css("height")).toBe("0px");
                expect(borderStyleView.$el.css("-webkit-box-shadow")).toBe("rgba(80, 80, 80, 0.498039) 0px 0px 5px 5px");
            });

            it("does nothing if the default is undefined", function () {

                borderStyleView.setCurrentStyle("this is not defined");

                expect(borderStyleView.currentStyle).toEqual({
                    "position" : "absolute",
                    "top" : "0px",
                    "left" : "0px",
                    "width" : "0px",
                    "height" : "0px"
                });
            });

            it("sets the current style from an object", function () {

                borderStyleView.setCurrentStyle({
                    "border-color" : "black",
                    "border-width" : "10px"
                });

                expect(borderStyleView.currentStyle).toEqual({
                    "position" : "absolute",
                    "top" : "0px",
                    "left" : "0px",
                    "width" : "0px",
                    "height" : "0px",
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
                expect(borderStyleView.$el.css("top")).toBe("0px");
                expect(borderStyleView.$el.css("left")).toBe("0px");
                expect(borderStyleView.$el.css("width")).toBe("0px");
                expect(borderStyleView.$el.css("height")).toBe("0px");
                expect(borderStyleView.$el.css("border-color")).toBe("black");
                expect(borderStyleView.$el.css("border-width")).toBe("10px");
            });
        });
    });

    describe("private helpers", function () {
    });
});