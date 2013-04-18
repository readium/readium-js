describe("CFI INSTRUCTION OBJECT", function () {

	it("finds the target element on an index step", function () {

		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");

		var $nextNode = EPUBcfi.CFIInstructions.getNextNode(4, $(contentDoc.firstChild), ["cfiMarker"]);
		var nodeType = $nextNode.is("body");

		expect(nodeType).toEqual(true);
	});

	// Finds the target element on an iframe indirection step
	it("finds the target element on an iframe indirection step", function () {

		var iframeContentXHTML = jasmine.getFixtures().read("iframe_content.xhtml");

		// Rationale: Append iframe to the body of the current window. This is a bit hacky, but a document containing an iframe
		//   appears to have to be loaded in a window to create an iframe, with content, as an element of that document. The original
		//   intention was to create a document object and then append an iframe; I was unable to find a way to do this, hence appending
		//   the iframe to the current document (jasmine).
		var iframe = $('<iframe src="' + window.location.href + '"/>')[0];
		document.body.appendChild(iframe);

		iframe.contentDocument.open("text/xml", "replace");
		iframe.contentDocument.write(iframeContentXHTML);
		iframe.contentDocument.close();

		var $nextNode = EPUBcfi.CFIInstructions.followIndirectionStep(4, $("iframe", document), [], []);

		expect($nextNode.attr("id")).toBe("body1");

		// Remove the injected iframe
		$(iframe).remove();
	});

	it("injects text at the specified offset", function () {

		var contentDocXHTML = jasmine.getFixtures().read('moby_dick_content_doc.xhtml');
		var domParser = new window.DOMParser();
		var contentDoc = domParser.parseFromString(contentDocXHTML, "text/xml");

		var $injectedElement = EPUBcfi.CFIInstructions.textTermination($($("#c01p0002", $(contentDoc))[0].firstChild), 4, '<span id="injected" class="epub_cfi"></span>');
		
		expect($injectedElement.attr("id")).toBe("injected");
		expect($injectedElement.parent().attr("id")).toBe("c01p0002");
	});

	it("injects text at the specified offset in the FIRST sub-node, when a target text node is specified as a list", function () {

		// Get a list of text nodes
		var $currNode = $('<div> asdfasd <div class="cfiMarker"></div> aslasjd <div></div> alsjflkds </div>');
		var $targetTextNodeList = EPUBcfi.CFIInstructions.getNextNode(1, $currNode, ["cfiMarker"], []);

		var $injectedElement = EPUBcfi.CFIInstructions.textTermination($targetTextNodeList, 4, '<span class="epub_cfi"></span>');
		var $currNodeChildren = $injectedElement.parent().contents();
		
		expect($currNodeChildren[0].nodeValue).toBe(" asd");
		expect($injectedElement.hasClass('epub_cfi')).toBe(true);
		expect($currNodeChildren[2].nodeValue).toBe("fasd ");
	});

	it("injects text at the specified offset in the SECOND sub-node, when a target text node is specified as a list", function () {

		// Get a list of text nodes
		var $currNode = $('<div> asdfasd <div class="cfiMarker"></div> aslasjd <div></div> alsjflkds </div>');
		var $targetTextNodeList = EPUBcfi.CFIInstructions.getNextNode(1, $currNode, ["cfiMarker"], []);

		var $injectedElement = EPUBcfi.CFIInstructions.textTermination($targetTextNodeList, 12, '<span class="epub_cfi"></span>');
		var $currNodeChildren = $injectedElement.parent().contents();
		
		expect($currNodeChildren[2].nodeValue).toBe(" asl");
		expect($injectedElement.hasClass('epub_cfi')).toBe(true);
		expect($currNodeChildren[4].nodeValue).toBe("asjd ");
	});

	it('excludes elements that have a class that indicates they are "cfi markers" and returns a list of text nodes', function () {

		var domParser = new window.DOMParser();
		var xhtml = '<body><div>asdfsd <div class="cfiMarker"></div> ddfd</div><div></div></body>';
		var doc = domParser.parseFromString(xhtml, 'text/xml');
		var $currentNode = $(doc.firstChild.firstChild);

		var $result = EPUBcfi.CFIInstructions.getNextNode(1, $currentNode, ["cfiMarker"], []);
		expect($result.length).toEqual(2);
		expect($result[0].nodeValue).toEqual("asdfsd ");
		expect($result[1].nodeValue).toEqual(" ddfd");
	});

	it('returns the correct text node if the node is in the first position of a set of child nodes', function () {

		var domParser = new window.DOMParser();
		var xhtml = '<div>text1<div></div>text2<div></div>text3</div>';
		var doc = domParser.parseFromString(xhtml, 'text/xml');
		var $currentNode = $(doc.firstChild);

		var $result = EPUBcfi.CFIInstructions.getNextNode(1, $currentNode, ["cfiMarker"], []);
		expect($result.length).toEqual(1);
		expect($result[0].nodeValue).toEqual("text1");
	});

	it('returns the correct text node if the node is between elements in a set of child nodes', function () {

		var domParser = new window.DOMParser();
		var xhtml = '<div>text1<div></div>text2<div></div>text3</div>';
		var doc = domParser.parseFromString(xhtml, 'text/xml');
		var $currentNode = $(doc.firstChild);

		var $result = EPUBcfi.CFIInstructions.getNextNode(3, $currentNode, ["cfiMarker"], []);
		expect($result.length).toEqual(1);
		expect($result[0].nodeValue).toEqual("text2");
	});

	it('returns the correct text node if the node is the last in a set of child nodes', function () {

		var domParser = new window.DOMParser();
		var xhtml = '<div>text1<div></div>text2<div></div>text3</div>';
		var doc = domParser.parseFromString(xhtml, 'text/xml');
		var $currentNode = $(doc.firstChild);

		var $result = EPUBcfi.CFIInstructions.getNextNode(5, $currentNode, ["cfiMarker"], []);
		expect($result.length).toEqual(1);
		expect($result[0].nodeValue).toEqual("text3");
	});

	it("filters blacklist classes", function () {

		var $elements = $(
			"<div class='blacklistClass1'></div>"
			+ "<div id='survivor-1' class='some-other'></div>"
			+ "<div id='survivor-2' class=''></div>"
			+ "<div id='survivor-3'></div>"
			+ "<div class='blacklistClass2'></div>"
			);

		$result = EPUBcfi.CFIInstructions.applyBlacklist($elements, ["blacklistClass1", "blacklistClass2"], []);

		expect($result[0].id).toEqual("survivor-1");
		expect($result[1].id).toEqual("survivor-2");
		expect($result[2].id).toEqual("survivor-3");
	});

	it("filters multiple blacklist classes", function () {

		var $elements = $(
			"<div class='blacklistClass1'></div>"
			+ "<div id='survivor-1' class='some-other'></div>"
			+ "<div id='survivor-2' class=''></div>"
			+ "<div class='blacklistClass2'></div>"
			+ "<div class='blacklistClass2'></div>"
			+ "<div id='survivor-3'></div>"
			+ "<div class='blacklistClass2'></div>"
			);

		$result = EPUBcfi.CFIInstructions.applyBlacklist($elements, ["blacklistClass1", "blacklistClass2"], []);

		expect($result[0].id).toEqual("survivor-1");
		expect($result[1].id).toEqual("survivor-2");
		expect($result[2].id).toEqual("survivor-3");
	});

	it("filters blacklist elements", function () {

		var $elements = $(
			"<div id='survivor-1'></div>"
			+ "<mathjax></mathjax>"
			+ "<div id='survivor-2' class=''></div>"
			+ "<blacklistElement></blacklistElement>"
			+ "<div id='survivor-3'></div>"
			);

		$result = EPUBcfi.CFIInstructions.applyBlacklist($elements, [], ["mathjax", "blacklistElement"]);

		expect($result[0].id).toEqual("survivor-1");
		expect($result[1].id).toEqual("survivor-2");
		expect($result[2].id).toEqual("survivor-3");
	});

	it("filters blacklist classes with text nodes", function () {

		var $elements = $(
			"<div class='blacklistClass1'></div>"
			+ "textNode-1"
			+ "<div id='survivor-1' class='some-other'></div>"
			+ "<div id='survivor-2' class=''></div>"
			+ "<div id='survivor-3'></div>"
			+ "textNode-2"
			+ "<div class='blacklistClass2'></div>"
			);

		$result = EPUBcfi.CFIInstructions.applyBlacklist($elements, ["blacklistClass1", "blacklistClass2"], []);

		expect($result[0].nodeType).toEqual(3);
		expect($result[1].id).toEqual("survivor-1");
		expect($result[2].id).toEqual("survivor-2");
		expect($result[3].id).toEqual("survivor-3");
		expect($result[4].nodeType).toEqual(3);
	});

	it("filters blacklist elements with text nodes", function () {

		var $elements = $(
			"<div id='survivor-1'></div>"
			+ "<mathjax></mathjax>"
			+ "textNode-1"
			+ "<div id='survivor-2' class=''></div>"
			+ "<blacklistElement></blacklistElement>"
			+ "textNode-2"
			+ "<div id='survivor-3'></div>"
			);

		$result = EPUBcfi.CFIInstructions.applyBlacklist($elements, [], ["mathjax", "blacklistElement"]);

		expect($result[0].id).toEqual("survivor-1");
		expect($result[1].nodeType).toEqual(3);
		expect($result[2].id).toEqual("survivor-2");
		expect($result[3].nodeType).toEqual(3);
		expect($result[4].id).toEqual("survivor-3");
	});

	it("filters blacklist ids with text nodes", function () {

		var $elements = $(
			"<div id='survivor-1'></div>"
			+ "<div id='mathjax'></div>"
			+ "textNode-1"
			+ "<div id='survivor-2' class=''></div>"
			+ "<blacklistElement id='blacklist-1'></blacklistElement>"
			+ "textNode-2"
			+ "<div id='survivor-3'></div>"
			);

		$result = EPUBcfi.CFIInstructions.applyBlacklist($elements, [], [], ["mathjax", "blacklist-1"]);

		expect($result[0].id).toEqual("survivor-1");
		expect($result[1].nodeType).toEqual(3);
		expect($result[2].id).toEqual("survivor-2");
		expect($result[3].nodeType).toEqual(3);
		expect($result[4].id).toEqual("survivor-3");
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
			EPUBcfi.CFIInstructions.getNextNode(16, $(contentDoc.firstChild))}, ["cfiMarker"], [])
		.toThrow(
			EPUBcfi.OutOfRangeError(7, 1, ""));
	});

	it('throws an out of range error for an indirection step', function () {

		var iframeContentXHTML = jasmine.getFixtures().read("iframe_content.xhtml");

		// Rationale: Append iframe to the body of the current window. This is a bit hacky, but a document containing an iframe
		//   appears to have to be loaded in a window to create an iframe, with content, as an element of that document. The original
		//   intention was to create a document object and then append an iframe; I was unable to find a way to do this, hence appending
		//   the iframe to the current document (jasmine).
		var iframe = $('<iframe src="' + window.location.href + '"/>')[0];
		document.body.appendChild(iframe);

		iframe.contentDocument.open("text/xml", "replace");
		iframe.contentDocument.write(iframeContentXHTML);
		iframe.contentDocument.close();

		// A step of 16 is greater than the number of child elements of the content document
		expect(function () {
			EPUBcfi.CFIInstructions.followIndirectionStep(6, $('iframe', document))}, [], [])
		.toThrow(
			EPUBcfi.OutOfRangeError(2, 1, ""));

		// Remove the injected iframe
		$(iframe).remove();
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
			EPUBcfi.CFIInstructions.followIndirectionStep(16, undefined, $(packageDoc))}, [], [])
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
