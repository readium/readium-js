//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without modification, 
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this 
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice, 
//  this list of conditions and the following disclaimer in the documentation and/or 
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be 
//  used to endorse or promote products derived from this software without specific 
//  prior written permission.

describe('Epub.PackageDocument', function() {
    
    describe("module structure", function () {

        it("exists in the namespace", function() {
            
            expect(Epub.PackageDocument).toBeDefined();
        });
    });

    describe("initialization", function() {

        beforeEach(function() {

            var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document.json"));
            this.packageDocument = new Epub.PackageDocument({ packageDocumentObject : packageDocumentJson });
        });

        it("sets the package document object", function () {

            expect(this.packageDocument.get("packageDocumentObject")).toBeDefined();
        });

        it("creates a spine model", function () {

            expect(this.packageDocument.spine).toBeDefined();
        });

        it("adds all the spine items", function () {

            var numSpineItemsInFixture = 4;
            expect(this.packageDocument.spine.length).toBe(numSpineItemsInFixture);
        });

        it("creates a manifest model", function () {

            expect(this.packageDocument.manifest).toBeDefined();
        });

        it("adds all the manifest items", function () {

            var numManifestItemsInFixture = 12;
            expect(this.packageDocument.manifest.length).toBe(numManifestItemsInFixture);
        });

        it("creates a metadata model", function () {

            expect(this.packageDocument.metadata).toBeDefined();
        });
    });

    describe("public interface", function () {

        beforeEach(function() {

            var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document.json"));
            this.packageDocument = new Epub.PackageDocument({ packageDocumentObject : packageDocumentJson });
        });

        describe("getSpineInfo()", function () {

            it("generates the spine info", function () {

                var spineInfo = this.packageDocument.getSpineInfo();

                expect(spineInfo.spine[0].contentDocumentURI).toBe("path/to/Page_1.html");
                expect(spineInfo.spine[2].contentDocumentURI).toBe("path/to/Page_3.html");
                expect(spineInfo.bindings[0].handler).toBe("figure-gallery-impl");
            });
        });

        describe("pageProgressionDirection()", function () {

        });

        describe("getPackageDocumentDOM", function () {

            beforeEach(function() {

                var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document.json"));
                var packageDocumentXML = jasmine.getFixtures().read("package_document.xml");
                this.packageDocument = new Epub.PackageDocument({ 
                    packageDocumentObject : packageDocumentJson,
                    packageDocument : packageDocumentXML
                });
            });

            it("gets the package document dom", function () {

                var packageDocumentDOM = this.packageDocument.getPackageDocumentDOM();
                expect(packageDocumentDOM).toBeDefined();
            });
        });

        describe("getToc", function () {

            beforeEach(function() {

                var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document.json"));
                this.packageDocument = new Epub.PackageDocument({ packageDocumentObject : packageDocumentJson });
            });

            it("gets the url of toc", function () {
                
                var handler = "path/to/bk01-toc.xhtml";
                var tocUrl = this.packageDocument.getToc();
                expect(tocUrl).toBe(handler);
            });
        });

        describe("generateTocListDOM()", function () {

            var packageDocument;
            beforeEach(function() {

                var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document.json"));
                packageDocument = new Epub.PackageDocument({ packageDocumentObject : packageDocumentJson });
            });

            it("generates DOM TOC from NCX XML", function () {

                var ncxTocXML = jasmine.getFixtures().read("wasteland.ncx");
                var orderedList = packageDocument.generateTocListDOM(ncxTocXML);

                expect($("a", orderedList).length).toBe(6);
            });

            it("generates DOM TOC from nested NCX XML", function () {

                var ncxTocXML = jasmine.getFixtures().read("nested_wasteland.ncx");
                var orderedList = packageDocument.generateTocListDOM(ncxTocXML);

                expect($("a", orderedList).length).toBe(6);
                expect($("ol", orderedList).length).toBe(2); // Two internal ordered lists of nested elements
            });
        });

        describe("tocIsNcx()", function () {

            it("is true when TOC is NCX", function () {

                var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document_ncx.json"));
                var packageDocument = new Epub.PackageDocument({ packageDocumentObject : packageDocumentJson });

                expect(packageDocument.tocIsNcx()).toBe(true);
            });

            it("is false when TOC is XHTML", function () {

                var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document.json"));
                var packageDocument = new Epub.PackageDocument({ packageDocumentObject : packageDocumentJson });

                expect(packageDocument.tocIsNcx()).toBe(false);
            });
        });
    });

    describe("private helpers", function () {

        // These are basic tests, as each of these cases is tested more thoroughly for the page spread property delegate
        describe("assignPageSpreadClass()", function () {

             describe("FXL epub is Apple fixed", function () {

                beforeEach(function () {

                    var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document_apple_fixed.json"));
                    this.packageDocument = new Epub.PackageDocument({ packageDocumentObject : packageDocumentJson });
                    this.packageDocument.assignPageSpreadClass();
                });

                it("infers page-1 is right", function () {

                    this.packageDocument.spine.at(0).get("pageSpreadClass") === "right_page";
                });

                it("infers page-2 is left", function () {

                    this.packageDocument.spine.at(1).get("pageSpreadClass") === "left_page";
                });

                it("infers page-3 is right", function () {

                    this.packageDocument.spine.at(2).get("pageSpreadClass") === "right_page";
                });
             });

             describe("FXL epub; page-1:right; page-2:right; page-3:left", function () {

                beforeEach(function () {

                    var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document_FXL_specified.json"));
                    this.packageDocument = new Epub.PackageDocument({ packageDocumentObject : packageDocumentJson });
                    this.packageDocument.assignPageSpreadClass();
                });

                it("infers page-1 is right", function () {

                    this.packageDocument.spine.at(0).get("pageSpreadClass") === "right_page";
                });

                it("infers page-2 is right", function () {

                    this.packageDocument.spine.at(1).get("pageSpreadClass") === "right_page";
                });

                it("infers page-3 is left", function () {

                    this.packageDocument.spine.at(2).get("pageSpreadClass") === "left_page";
                });
             });

             describe("FXL epub has no page-spread specified", function () {

                beforeEach(function () {

                    var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document_FXL_not_specified.json"));
                    this.packageDocument = new Epub.PackageDocument({ packageDocumentObject : packageDocumentJson });
                    this.packageDocument.assignPageSpreadClass();
                });

                it("infers page-1 is left", function () {

                    this.packageDocument.spine.at(0).get("pageSpreadClass") === "left_page";
                });

                it("infers page-2 is right", function () {

                    this.packageDocument.spine.at(1).get("pageSpreadClass") === "right_page";
                });

                it("infers page-3 is left", function () {

                    this.packageDocument.spine.at(2).get("pageSpreadClass") === "left_page";
                });
             });
        });      
    });
});
