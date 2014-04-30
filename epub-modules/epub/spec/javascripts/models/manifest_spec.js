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

describe("Epub.Manifest", function () {

    beforeEach(function () {

        var packageDocumentJson = JSON.parse(jasmine.getFixtures().read("package_document.json"));
        this.manifestJson = packageDocumentJson.manifest;
        this.manifest = new Epub.Manifest(this.manifestJson);
    });

    describe("initialization", function () {

        it("exists in namespace", function () {

            expect(Epub.Manifest).toBeDefined();
        });

        it("adds each manifest item", function () {

            var manifestItemsInFixture = 12;
            expect(this.manifest.length).toBe(manifestItemsInFixture);
        });
    });
});