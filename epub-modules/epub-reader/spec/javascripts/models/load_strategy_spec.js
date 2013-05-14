describe("EpubReader.LoadStrategy", function () {

    var getSpineObjects = function (fixtureFilename) {

        var packageDocumentXML = jasmine.getFixtures().read(fixtureFilename);
        var epubParser = new EpubParserModule("readium-test/epub-content", packageDocumentXML);
        var packageDocumentObject = epubParser.parse();
        var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
        var spineInfo = epub.getSpineInfo();
        return spineInfo.spine;
    };

    describe("initialization", function () {

        var spineObjects;
        var loader;
        beforeEach(function () {

            spineObjects = getSpineObjects("package_document.xml");
            loader = new EpubReader.LoadStrategy({ 
                spineInfo : spineObjects
            });
        });

        it("exists in namespace", function () {

            expect(EpubReader.LoadStrategy).toBeDefined();
        });

        it("can be instantiated", function () {

            expect(loader).toBeDefined();
        });
    });

    describe("public interface", function () {

        describe("loadSpineItems()", function () {

            describe("reflowable", function () {

                var spineObjects;
                var loader;
                var viewerSettingsMock;
                beforeEach(function () {

                    viewerSettingsMock = { syntheticLayout : false };
                    spineObjects = getSpineObjects("reflowable_pack_doc.xml");

                    loader = new EpubReader.LoadStrategy({ 
                        spineInfo : spineObjects
                    });
                });
                
                it("loads a pages view for each spine object", function () {

                    var loadedPagesViews = loader.loadSpineItems(viewerSettingsMock, undefined, undefined);
                    expect(loadedPagesViews.length).toBe(22);
                });
            });

            describe("fixed", function () {

                var spineObjects;
                var loader;
                var viewerSettingsMock;
                beforeEach(function () {

                    viewerSettingsMock = { syntheticLayout : false };
                    spineObjects = getSpineObjects("fixed_pack_doc.xml");

                    loader = new EpubReader.LoadStrategy({ 
                        spineInfo : spineObjects
                    });
                });

                it("loads a single pages view for all the spine items", function () {

                    var loadedPagesViews = loader.loadSpineItems(viewerSettingsMock, undefined, undefined);
                    expect(loadedPagesViews.length).toBe(1);
                });

                it("loads multiple pages views given a load limit", function () {

                    loader.set("numFixedPagesPerView", 2);
                    var loadedPagesViews = loader.loadSpineItems(viewerSettingsMock, undefined, undefined);
                    expect(loadedPagesViews.length).toBe(5);
                });
            });

            describe("mixed", function () {

                it("loads a pages view for each spine item", function () {

                    var viewerSettingsMock = { syntheticLayout : false };
                    var spineObjects = getSpineObjects("mixed_pack_doc.xml");

                    var loader = new EpubReader.LoadStrategy({ 
                        spineInfo : spineObjects
                    });

                    var loadedPagesViews = loader.loadSpineItems(viewerSettingsMock, undefined, undefined);
                    expect(loadedPagesViews.length).toBe(10);
                });

                it("partitions sets of fixed layout spine objects into a pages view", function () {

                    var viewerSettingsMock = { syntheticLayout : false };
                    var spineObjects = getSpineObjects("mixed_pack_doc_2.xml");

                    var loader = new EpubReader.LoadStrategy({ 
                        spineInfo : spineObjects
                    });

                    var loadedPagesViews = loader.loadSpineItems(viewerSettingsMock, undefined, undefined);

                    expect(loadedPagesViews.length).toBe(10);
                    expect(loadedPagesViews[2].spineIndexes[0]).toBe(2);
                    expect(loadedPagesViews[2].spineIndexes[1]).toBe(3);
                    expect(loadedPagesViews[2].spineIndexes[2]).toBe(4);

                    expect(loadedPagesViews[6].spineIndexes[0]).toBe(8);
                    expect(loadedPagesViews[6].spineIndexes[1]).toBe(9);
                    expect(loadedPagesViews[6].spineIndexes[2]).toBe(10);
                });

                it("partitions sets of fixed layout spine objects into a pages view, respecting the load limit", function () {

                    var viewerSettingsMock = { syntheticLayout : false };
                    var spineObjects = getSpineObjects("mixed_pack_doc_2.xml");

                    var loader = new EpubReader.LoadStrategy({ 
                        spineInfo : spineObjects
                    });

                    loader.set("numFixedPagesPerView", 2);
                    var loadedPagesViews = loader.loadSpineItems(viewerSettingsMock, undefined, undefined);

                    expect(loadedPagesViews.length).toBe(12);
                    expect(loadedPagesViews[2].spineIndexes[0]).toBe(2);
                    expect(loadedPagesViews[2].spineIndexes[1]).toBe(3);

                    expect(loadedPagesViews[3].spineIndexes[0]).toBe(4);

                    expect(loadedPagesViews[7].spineIndexes[0]).toBe(8);
                    expect(loadedPagesViews[7].spineIndexes[1]).toBe(9);
                    
                    expect(loadedPagesViews[8].spineIndexes[0]).toBe(10);
                });
            });
        });
    });

    describe("private helpers", function () {

    });
});