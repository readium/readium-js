describe("Epub.PageSpreadProperty", function () {

    describe("inferiBooksPageSpread()", function () {

        beforeEach(function () {

            this.pageSpreadDelegate = new Epub.PageSpreadProperty();
        });        

        it("centers the first page", function () {

            var spineIndex = 0;
            var numSpineItems = 10;
            var pageSpreadClass = this.pageSpreadDelegate.inferiBooksPageSpread(spineIndex, numSpineItems);

            expect(pageSpreadClass).toBe("center_page");
        });

        it("centers the last page if it is an even-numbered page", function () {

            var spineIndex = 9;
            var numSpineItems = 10;
            var pageSpreadClass = this.pageSpreadDelegate.inferiBooksPageSpread(spineIndex, numSpineItems);

            expect(pageSpreadClass).toBe("center_page");
        });

        it("assigns right_page to an even-numbered page", function () {

            var spineIndex = 2;
            var numSpineItems = 10;
            var pageSpreadClass = this.pageSpreadDelegate.inferiBooksPageSpread(spineIndex, numSpineItems);

            expect(pageSpreadClass).toBe("right_page");
        });

        it("assigns left_page to an odd-numbered page", function () {
            
            var spineIndex = 3;
            var numSpineItems = 10;
            var pageSpreadClass = this.pageSpreadDelegate.inferiBooksPageSpread(spineIndex, numSpineItems);

            expect(pageSpreadClass).toBe("left_page");
        });
    });

    describe("getPageSpreadFromProperties()", function () { 

        beforeEach(function () {

            this.pageSpreadDelegate = new Epub.PageSpreadProperty();
        });

        it("assigns left_page if property is 'left'", function () {

            var pageSpreadProperty = "left";
            var pageSpreadClass = this.pageSpreadDelegate.getPageSpreadFromProperties(pageSpreadProperty);

            expect(pageSpreadClass).toBe("left_page");
        });

        it("assigns right_page if property is 'right'", function () {

            var pageSpreadProperty = "right";
            var pageSpreadClass = this.pageSpreadDelegate.getPageSpreadFromProperties(pageSpreadProperty);

            expect(pageSpreadClass).toBe("right_page");
        });

        it("assigns center_page if property is 'center'", function () {
            
            var pageSpreadProperty = "center";
            var pageSpreadClass = this.pageSpreadDelegate.getPageSpreadFromProperties(pageSpreadProperty);

            expect(pageSpreadClass).toBe("center_page")
        });

        it("assigns center_page for all other property values", function () {
            
            var pageSpreadProperty = "unspecified property value";
            var pageSpreadClass = this.pageSpreadDelegate.getPageSpreadFromProperties(pageSpreadProperty);

            expect(pageSpreadClass).toBe("center_page");
        });
    });

    

});