describe("EpubReader.EpubReader", function () {

    describe("initialization", function () {

        var spineInfo = JSON.parse(jasmine.getFixtures().read("spine_info.json"));
        var viewerSettings = JSON.parse(jasmine.getFixtures().read("viewer_settings.json"));

        beforeEach(function () {

            this.reader = new EpubReader.EpubReader({ 
                spineInfo : spineInfo, 
                viewerSettings : viewerSettings 
            });
        });

        it("exists in namespace", function () {

            expect(EpubReader.EpubReader).toBeDefined();
        });

        it("can be initialized", function () {

            expect(typeof this.reader).toBe("object");
        });

        describe("defaults", function () {

            it("sets current pages view as 0", function () {

                expect(this.reader.get("currentPagesViewIndex")).toBe(0);
            });
        });

        describe("expected attributes", function () {

            it("sets the spine", function () {

                expect(this.reader.get("spine")).toBeDefined();
            });

            it("sets the bindings", function () {

                expect(this.reader.get("bindings")).toBeDefined();
            });

            it("sets the viewer settings", function () {

                expect(this.reader.get("viewerSettings")).toBeDefined();
            });

            it("sets the annotations", function () {

                expect(this.reader.get("annotations")).toBeDefined();
            });
        });

        describe("loadSpineItems()", function () {

            beforeEach(function () {

                var spineInfo = JSON.parse(jasmine.getFixtures().read("spine_info.json"));
                var viewerSettings = JSON.parse(jasmine.getFixtures().read("viewer_settings.json"));

                this.reader = new EpubReader.EpubReader({ 
                    spineInfo : spineInfo, 
                    viewerSettings : viewerSettings 
                });
                this.reader.loadSpineItems();
            });

            it("loads the correct number of spine items", function () {

                var numPagesViews = this.reader.get("loadedPagesViews").length;
                expect(numPagesViews).toBe(5);
            });

            it("actually initializes each pages view", function () {

                var loadedPagesViews = this.reader.get("loadedPagesViews");
                expect(loadedPagesViews[0].spineIndexes[0]).toBe(0);
                expect(loadedPagesViews[1].spineIndexes[0]).toBe(1);
                expect(loadedPagesViews[2].spineIndexes[0]).toBe(2);
                expect(loadedPagesViews[3].spineIndexes[0]).toBe(3);
                expect(loadedPagesViews[4].spineIndexes[0]).toBe(4);
            });
        });
    });

    describe("public interface", function () {

        beforeEach(function () {

            var spineInfo = JSON.parse(jasmine.getFixtures().read("spine_info.json"));
            var viewerSettings = JSON.parse(jasmine.getFixtures().read("viewer_settings.json"));

            this.reader = new EpubReader.EpubReader({ 
                spineInfo : spineInfo, 
                viewerSettings : viewerSettings 
            });
            this.reader.loadSpineItems();
        });

        describe("numberOfLoadedPagesViews()", function () {

            it("gets the number of loaded views", function () {

                expect(this.reader.numberOfLoadedPagesViews()).toBe(5);
            });
        });

        describe("hasNextPagesView()", function () {

            it("is true when there is a next page", function () {

                this.reader.set({"currentPagesViewIndex" : 0});
                expect(this.reader.hasNextPagesView()).toBe(true);
            });

            it("is false when there is no next page", function () {

                this.reader.set({"currentPagesViewIndex" : 4});
                expect(this.reader.hasNextPagesView()).toBe(false);
            });
        });

        describe("hasPreviousPagesView()", function () {

            it("is true when there is a previous page", function () {

                this.reader.set({"currentPagesViewIndex" : 1});
                expect(this.reader.hasPreviousPagesView()).toBe(true);
            });

            it("is false when there is no previous page", function () {
                
                this.reader.set({"currentPagesViewIndex" : 0});
                expect(this.reader.hasPreviousPagesView()).toBe(false);
            });
        });

        describe("getCurrentPagesView()", function () {

            it("gets the current pages view", function () {

                this.reader.set({"currentPagesViewIndex" : 1});
                var expectedPagesView = this.reader.get("loadedPagesViews")[1].pagesView;
                var pagesView = this.reader.getCurrentPagesView();
                expect(pagesView === expectedPagesView).toBe(true);
            });
        });
    });

    describe("private helpers", function () {
        
        beforeEach(function () {

            var spineInfo = JSON.parse(jasmine.getFixtures().read("spine_info.json"));
            var viewerSettings = JSON.parse(jasmine.getFixtures().read("viewer_settings.json"));

            this.reader = new EpubReader.EpubReader({ 
                spineInfo : spineInfo, 
                viewerSettings : viewerSettings 
            });
        });

        describe("loadReflowableSpineItem()", function () {

            it("loads a pages view", function () {

                var spineInfo = JSON.parse(jasmine.getFixtures().read("spine_info.json"));
                this.reader.loadReflowableSpineItem(spineInfo.spine[0]);
                var firstPagesView = this.reader.get("loadedPagesViews")[0];
                expect(firstPagesView).toBeDefined();
            });
        });

        describe("getPagesView()", function () {

            it("gets a pages view by spine index", function () {

                this.reader.loadSpineItems();
                var pagesViewInfo = this.reader.getPagesViewInfo(1);
            });
        });
    });
});