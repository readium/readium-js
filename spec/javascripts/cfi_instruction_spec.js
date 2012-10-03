describe("CFI INSTRUCTION OBJECT", function () {

	it("finds the target element on an index step", function () {

		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");

		var $nextNode = EPUBcfi.CFIInstructions.getNextNode(4, $(contentDoc.firstChild));
		var nodeType = $nextNode.is("body");

		expect(nodeType).toEqual(true);
	});

	// Finds the target element on an iframe indirection step
	it("finds the target element on an iframe indirection step", function () {

		var contentDocXHTML = jasmine.getFixtures().read("content_doc_for_iframe.xhtml");
		var domParser = new window.DOMParser();
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");
		var iframeContentXHTML = jasmine.getFixtures().read("iframe_content.xhtml");

		// Append iframe to the body of the content doc
		var iframe = contentDoc.createElement('iframe');
		contentDoc.body.appendChild(iframe);
		iframe.style.width = "100px";
		iframe.style.height = "100px";

		$(iframe).attr("src", "about:blank");

        setTimeout( function() {
            var doc = iframe.contentWindow.document;
        }, 1 );

		iframe.contentWindow.document.open("text/xml", "replace");
		iframe.contentWindow.document.write(iframeContentXHTML);
		iframe.contentWindow.document.close();

		var $nextNode = EPUBcfi.CFIInstructions.followIndirectionStep(4, $("iframe", contentDoc));

	});

	it("injects text at the specified offset", function () {

		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");

		var $result = EPUBcfi.CFIInstructions.textTermination($($("#c01p0002", $(contentDoc))[0].firstChild), 4, '<span class="epub_cfi"></span>');
		
		expect($result.html()).toEqual('Ther<span xmlns="http://www.w3.org/1999/xhtml" class="epub_cfi"></span>e now is your insular city of the Manhattoes, belted round by wharves as Indian isles by coral reefs—commerce surrounds it with her surf. Right and left, the streets take you waterward. Its extreme downtown is the battery, where that noble mole is washed by waves, and cooled by breezes, which a few hours previous were out of sight of land. Look at the crowds of water-gazers there.');
	});

	it("injects text at the specified offset in the FIRST sub-node, when a target text node is specified as a list", function () {

		// Get a list of text nodes
		var $currNode = $('<div> asdfasd <div class="cfiMarker"></div> aslasjd <div></div> alsjflkds </div>');
		var $targetTextNodeList = EPUBcfi.CFIInstructions.getNextNode(1, $currNode);

		var $result = EPUBcfi.CFIInstructions.textTermination($targetTextNodeList, 4, '<span class="epub_cfi"></span>');
		var $currNodeChildren = $result.contents();
		
		expect($currNodeChildren[0].nodeValue).toEqual(" asd");
		expect($($currNodeChildren[1]).hasClass('epub_cfi')).toEqual(true);
		expect($currNodeChildren[2].nodeValue).toEqual("fasd ");
	});

	it("injects text at the specified offset in the SECOND sub-node, when a target text node is specified as a list", function () {

		// Get a list of text nodes
		var $currNode = $('<div> asdfasd <div class="cfiMarker"></div> aslasjd <div></div> alsjflkds </div>');
		var $targetTextNodeList = EPUBcfi.CFIInstructions.getNextNode(1, $currNode);

		var $result = EPUBcfi.CFIInstructions.textTermination($targetTextNodeList, 12, '<span class="epub_cfi"></span>');
		var $currNodeChildren = $result.contents();
		
		expect($currNodeChildren[2].nodeValue).toEqual(" asl");
		expect($($currNodeChildren[3]).hasClass('epub_cfi')).toEqual(true);
		expect($currNodeChildren[4].nodeValue).toEqual("asjd ");
	});

	it('excludes elements that have a class that indicates they are "cfi markers" and returns a list of text nodes', function () {

		var domParser = new window.DOMParser();
		var xhtml = '<body><div>asdfsd <div class="cfiMarker"></div> ddfd</div><div></div></body>';
		var doc = domParser.parseFromString(xhtml, 'text/xml');
		var $currentNode = $(doc.firstChild.firstChild);

		var $result = EPUBcfi.CFIInstructions.getNextNode(1, $currentNode);
		expect($result.length).toEqual(2);
		expect($result[0].nodeValue).toEqual("asdfsd ");
		expect($result[1].nodeValue).toEqual(" ddfd");
	});

	it('returns the correct text node if the node is in the first position of a set of child nodes', function () {

		var domParser = new window.DOMParser();
		var xhtml = '<div>text1<div></div>text2<div></div>text3</div>';
		var doc = domParser.parseFromString(xhtml, 'text/xml');
		var $currentNode = $(doc.firstChild);

		var $result = EPUBcfi.CFIInstructions.getNextNode(1, $currentNode);
		expect($result.length).toEqual(1);
		expect($result[0].nodeValue).toEqual("text1");
	});

	it('returns the correct text node if the node is between elements in a set of child nodes', function () {

		var domParser = new window.DOMParser();
		var xhtml = '<div>text1<div></div>text2<div></div>text3</div>';
		var doc = domParser.parseFromString(xhtml, 'text/xml');
		var $currentNode = $(doc.firstChild);

		var $result = EPUBcfi.CFIInstructions.getNextNode(3, $currentNode);
		expect($result.length).toEqual(1);
		expect($result[0].nodeValue).toEqual("text2");
	});

	it('returns the correct text node if the node is the last in a set of child nodes', function () {

		var domParser = new window.DOMParser();
		var xhtml = '<div>text1<div></div>text2<div></div>text3</div>';
		var doc = domParser.parseFromString(xhtml, 'text/xml');
		var $currentNode = $(doc.firstChild);

		var $result = EPUBcfi.CFIInstructions.getNextNode(5, $currentNode);
		expect($result.length).toEqual(1);
		expect($result[0].nodeValue).toEqual("text3");
	});
});

describe('CFI INSTRUCTION ERROR HANDLING', function () {

	// Throws out of range errors for any "following" instructions
	it('throws an out of range error for an index step', function () {

		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");

		// A step of 16 is greater than the number of child elements of the content document
		expect(function () {
			EPUBcfi.CFIInstructions.getNextNode(16, $(contentDoc.firstChild))})
		.toThrow(
			EPUBcfi.OutOfRangeError(7, 2, ""));
	});

	it('throws an out of range error for an indirection step', function () {

		var packageDocXML = jasmine.getFixtures().read('moby_dick_package.opf');
		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var packageDoc = domParser.parseFromString(packageDocXML, "text/xml");
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");
		var spineElement = $($(packageDoc.firstChild).children()[2]).children()[6];

		var nextNode;
		var calledHref;

		spyOn($, "ajax").andCallFake(function (params) {

			params.success(contentDoc);
		});

		// A step of 16 is greater than the number of child elements of the content document
		expect(function () {
			EPUBcfi.CFIInstructions.followIndirectionStep(16, $(spineElement), $(packageDoc))})
		.toThrow(
			EPUBcfi.OutOfRangeError(7, 2, ""));
	});
	
	// Throws a node type error for itemref
	it('throws a node type error if an iframe indirection step is called on a different element', function () {

		var packageDocXML = jasmine.getFixtures().read('moby_dick_package.opf');
		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var packageDoc = domParser.parseFromString(packageDocXML, "text/xml");
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");
		var spineElement = $($(packageDoc.firstChild).children()[2]).children()[6];

		var nextNode;
		var calledHref;

		spyOn($, "ajax").andCallFake(function (params) {

			params.success(contentDoc);
		});

		expect(function () {
			EPUBcfi.CFIInstructions.followIndirectionStep(16, undefined, $(packageDoc))})
		.toThrow(
			EPUBcfi.NodeTypeError(undefined, "expected an iframe element"));
	});

	// Throws terminus errors for invalid text offsets 
	it('throws a terminus error if an invalid text offset is provided', function () {

		var $currentNode = $('<p>  </p>');

		expect(function () {
			EPUBcfi.CFIInstructions.textTermination($($currentNode.contents().firstChild), 84, '<span class="cfiMarker"/>')})
		.toThrow(
			EPUBcfi.TerminusError("Text", "Text offset:84", "no nodes found for termination condition"));
	});
});
