describe("execution of cfi instructions", function () {

	it ("finds the target element on a step", function () {

		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");

		var instructions = EPUBcfi.CFIInstructions;
		var $nextNode = instructions.getNextNode(4, $(contentDoc.firstChild), undefined);
		var nodeType = $nextNode.is("body");

		expect(nodeType).toEqual(true);
	});

	it ("obtains the itemref's corresponding href for a content document", function () {

		var packageDocXML = jasmine.getFixtures().read('moby_dick_package.opf');
		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var packageDoc = domParser.parseFromString(packageDocXML, "text/xml");
		var spineElement = $($(packageDoc.firstChild).children()[2]).children()[6];

		var instructions = EPUBcfi.CFIInstructions;
		var nextNode;
		var calledHref;

		spyOn($, "ajax").andCallFake(function (params) {

			params.success(contentDocXHTML);
		});

		instructions.followIndirectionStep(14, $(spineElement), undefined, $(packageDoc));
		calledHref = $.ajax.mostRecentCall.args[0].url;

		expect(calledHref).toEqual("chapter_001.xhtml");
	});

	it ("returns a character at the specified offset", function () {

		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");

		var instructions = EPUBcfi.CFIInstructions;
		var charAtOffset = instructions.textTermination(6, $($(".body-rw", contentDoc)[0]), "c01p0002", 4);
		
		expect(charAtOffset).toEqual("e");
	});
});