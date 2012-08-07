describe("execution of cfi instructions", function () {

	it ("finds the target element on a step", function () {

		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");

		var $nextNode = EPUBcfi.CFIInstructions.getNextNode(4, $(contentDoc.firstChild), undefined);
		var nodeType = $nextNode.is("body");

		expect(nodeType).toEqual(true);
	});

	it ("obtains the itemref's corresponding href for a content document", function () {

		var packageDocXML = jasmine.getFixtures().read('moby_dick_package.opf');
		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var packageDoc = domParser.parseFromString(packageDocXML, "text/xml");
		var spineElement = $($(packageDoc.firstChild).children()[2]).children()[6];

		var nextNode;
		var calledHref;

		spyOn($, "ajax").andCallFake(function (params) {

			params.success(contentDocXHTML);
		});

		EPUBcfi.CFIInstructions.followIndirectionStep(2, $(spineElement), undefined, $(packageDoc));
		calledHref = $.ajax.mostRecentCall.args[0].url;

		expect(calledHref).toEqual("chapter_001.xhtml");
	});

	it ("returns an element with injected text at the specified offset", function () {

		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");

		var $result = EPUBcfi.CFIInstructions.textTermination($("#c01p0002", $(contentDoc)), 4, '<span class="epub_cfi"></span>');
		
		expect($result.html()).toEqual('Ther<span xmlns="http://www.w3.org/1999/xhtml" class="epub_cfi"></span>e now is your insular city of the Manhattoes, belted round by wharves as Indian isles by coral reefs—commerce surrounds it with her surf. Right and left, the streets take you waterward. Its extreme downtown is the battery, where that noble mole is washed by waves, and cooled by breezes, which a few hours previous were out of sight of land. Look at the crowds of water-gazers there.');
	});

	it ('excludes any child elements of the current node that are CFI markers', function () {

		var $currentNode = $('<div><div></div><div class="cfiMarker"></div><div id="correctDiv"></div><div></div></body></div>');
		var $expectedNode = $('<div id="correctDiv"></div>');

		var $result = EPUBcfi.CFIInstructions.getNextNode(4, $currentNode, undefined);

		expect($result.attr('id')).toEqual($expectedNode.attr('id'));
	});

	it ('excludes any CFI markers in a text node', function () {

		var $currentNode = $('<p>blah blah <span class="cfiMarker"></span> blah blah</p>');
		var expectedResult = 'blah blah <span class="cfiMarker"></span> blah bl<span class="cfiMarker"></span>ah';

		var $result = EPUBcfi.CFIInstructions.textTermination($currentNode, 17, '<span class="cfiMarker"/>');

		expect($result.html()).toEqual(expectedResult);
	});


	// Throws out of range errors for any "following" instructions

	// Throws a node type error for itemref

	// Throws terminus errors for invalid text offsets 
});