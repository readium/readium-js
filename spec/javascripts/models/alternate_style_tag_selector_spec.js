describe("Readium.Models.AlternateStyleTagSelector", function() {

	var getEPubContentDom = function () {
		
		var epubContentDoc = 
			'<?xml version="1.0" encoding="UTF-8"?> \
			 <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" \
			 xmlns:epub="http://www.idpf.org/2007/ops"> \
			 <head> \
			 	<meta charset="utf-8"></meta> \
				<title>The Waste Land</title> \
			 </head> \
			 <body> \
			 </body> \
			 </html>';

		var parser = new window.DOMParser();
		var epubDom = parser.parseFromString(epubContentDoc, 'text/xml');

		return epubDom;
	};

	describe("style tag selection", function () {

		it ("ignores commented out style elements", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<!--<link rel="stylesheet" ref="day_orig.css" class="day"   title="day_orig"/>-->'
					   + '<link rel="stylesheet" href="day.css"   class="day"     title="day"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["day"], testEPubDom);

			expect($('link[title="day_orig"]', testEPubDom)[0]).toEqual(undefined);
			expect($('link[title="day"]', testEPubDom)[0].disabled).toEqual(false);
		});

		it ("activates an alternate style sheet with a single tag", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="stylesheet"           href="night.css" class="night"   title="night"/>'
					   + '<link rel="alternate stylesheet" href="day.css"   class="day"     title="day"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["day"], testEPubDom);

			expect($('link[title="night"]', testEPubDom)[0].disabled).toEqual(true);
			expect($('link[title="day"]', testEPubDom)[0].disabled).toEqual(false);
		});

		it ("activates an alternate style set with a single tag", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" href="vertical.css" class="vertical" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="day"      title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="night"    title="Vertical Night"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal" title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="day.css"        class="day"        title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal" title="Horizontal Night"/>'
					   + '<link rel="stylesheet" href="night.css"      class="night"      title="Horizontal Night"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["night"], testEPubDom);

			expect($($('link[title="Vertical Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[1])[0].disabled).toEqual(false);
		});

		it ("activates a style set if only alternate style sets are provided, using a subset of tags", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" href="vertical.css" class="vertical" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="day"      title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="night"    title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="horizontal.css" class="horizontal" title="Horizontal Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"        class="day"        title="Horizontal Day"/>'
					   + '<link rel="alternate stylesheet" href="horizontal.css" class="horizontal" title="Horizontal Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"      class="night"      title="Horizontal Night"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["night"], testEPubDom);

			expect($($('link[title="Vertical Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Vertical Night"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[1])[0].disabled).toEqual(true);
		});

		it ("activates a style set if only alternate style sets are provided, with multiple tags in the class attribute", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" href="vertical.css" class="vertical day" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="vertical day" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical night" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="vertical night" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="horizontal.css" class="horizontal day" title="Horizontal Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"        class="horizontal day" title="Horizontal Day"/>'
					   + '<link rel="alternate stylesheet" href="horizontal.css" class="horizontal night" title="Horizontal Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"      class="horizontal night" title="Horizontal Night"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["night", "horizontal"], testEPubDom);

			expect($($('link[title="Vertical Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[1])[0].disabled).toEqual(false);
		});

		it ("activates style sets, in an arbitrary order, with a single tag", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" href="vertical.css" class="vertical" title="Vertical Day"/>'
					   + '<link rel="stylesheet" href="night.css"      class="night"      title="Horizontal Night"/>'
					   + '<link rel="stylesheet" href="day.css"        class="day"        title="Horizontal Day"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="night"    title="Vertical Night"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal" title="Horizontal Day"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical" title="Vertical Night"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal" title="Horizontal Night"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="day"      title="Vertical Day"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["horizontal"], testEPubDom);

			expect($($('link[title="Vertical Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[1])[0].disabled).toEqual(false);
		});

		it ("activates style sets with multiple tags in the class attribute", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" href="vertical.css" class="vertical day" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="vertical day" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical night" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="vertical night" title="Vertical Night"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal day" title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="day.css"        class="horizontal day"   title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal night" title="Horizontal Night"/>'
					   + '<link rel="stylesheet" href="night.css"      class="horizontal night" title="Horizontal Night"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["vertical", "night"], testEPubDom);

			expect($($('link[title="Vertical Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Vertical Night"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[1])[0].disabled).toEqual(true);
		});

		it ("chooses among a preferred and alterate style set tagged the same way", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" href="horizontal2.css" class="horiztonal" title="Horizontal Day 2"/>'
					   + '<link rel="alternate stylesheet" href="day2.css"      class="day"      title="Horizontal Day 2"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="night"    title="Vertical Night"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal" title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="day.css"        class="day"        title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal" title="Horizontal Night"/>'
					   + '<link rel="stylesheet" href="night.css"      class="night"      title="Horizontal Night"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["horizontal", "day"], testEPubDom);

			expect($($('link[title="Horizontal Day 2"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day 2"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[1])[0].disabled).toEqual(true);
		});

		it ("activates style sets with a subset of multiple tags", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" href="vertical.css" class="vertical day anotherTag" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="vertical day anotherTag" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical night anotherTag" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="vertical night anotherTag" title="Vertical Night"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal day anotherTag" title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="day.css"        class="horizontal day anotherTag"   title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal night anotherTag" title="Horizontal Night"/>'
					   + '<link rel="stylesheet" href="night.css"      class="horizontal night anotherTag" title="Horizontal Night"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["horizontal", "day"], testEPubDom);

			expect($($('link[title="Vertical Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[1])[0].disabled).toEqual(true);
		});

		it ("does nothing when no alternate tags are supplied", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" href="vertical.css" class="vertical day" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="vertical day" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical night" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="vertical night" title="Vertical Night"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal day" title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="day.css"        class="horizontal day"   title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal night" title="Horizontal Night"/>'
					   + '<link rel="stylesheet" href="night.css"      class="horizontal night" title="Horizontal Night"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet([], testEPubDom);

			expect($($('link[title="Vertical Day"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Vertical Day"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Vertical Night"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Vertical Night"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[1])[0].disabled).toEqual(false);
		});

		it ("ignores unknown alternate tags", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" href="vertical.css" class="vertical day" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="vertical day" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical night" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="vertical night" title="Vertical Night"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal day" title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="day.css"        class="horizontal day"   title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal night" title="Horizontal Night"/>'
					   + '<link rel="stylesheet" href="night.css"      class="horizontal night" title="Horizontal Night"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["blah", "somethingElse"], testEPubDom);

			expect($($('link[title="Vertical Day"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Vertical Day"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Vertical Night"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Vertical Night"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[1])[0].disabled).toEqual(false);
		});

		it ("ignores mutually exclusive alternate tags", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" href="vertical.css" class="vertical day" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="vertical night" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical night" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="vertical night" title="Vertical Night"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal day" title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="day.css"        class="horizontal day"   title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal night" title="Horizontal Night"/>'
					   + '<link rel="stylesheet" href="night.css"      class="horizontal night" title="Horizontal Night"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["vertical", "night"], testEPubDom);

			expect($($('link[title="Vertical Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Vertical Night"]', testEPubDom)[0])[0].disabled).toEqual(false);
			expect($($('link[title="Vertical Night"]', testEPubDom)[1])[0].disabled).toEqual(false);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Day"]', testEPubDom)[1])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[0])[0].disabled).toEqual(true);
			expect($($('link[title="Horizontal Night"]', testEPubDom)[1])[0].disabled).toEqual(true);
		});

		it ("does not de-activate persistent style sheets", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="stylesheet" href="someStyle1.css"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical day" title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="vertical night" title="Vertical Day"/>'
					   + '<link rel="stylesheet" href="someStyle2.css"/>'
					   + '<link rel="alternate stylesheet" href="vertical.css" class="vertical night" title="Vertical Night"/>'
					   + '<link rel="alternate stylesheet" href="night.css"    class="vertical night" title="Vertical Night"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal day" title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="day.css"        class="horizontal day"   title="Horizontal Day"/>'
					   + '<link rel="stylesheet" href="someStyle3.css"/>'
					   + '<link rel="stylesheet" href="horizontal.css" class="horizontal night" title="Horizontal Night"/>'
					   + '<link rel="stylesheet" href="night.css"      class="horizontal night" title="Horizontal Night"/>'
					   + '<link rel="stylesheet" href="someStyle4.css"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			$('head', testEPubDom)[0].appendChild($(styles)[6]);
			$('head', testEPubDom)[0].appendChild($(styles)[7]);
			$('head', testEPubDom)[0].appendChild($(styles)[8]);
			$('head', testEPubDom)[0].appendChild($(styles)[9]);
			$('head', testEPubDom)[0].appendChild($(styles)[10]);
			$('head', testEPubDom)[0].appendChild($(styles)[11]);

			selector = new Readium.Models.AlternateStyleTagSelector;
			selector.activateAlternateStyleSet(["vertical", "night"], testEPubDom);

			expect($('link[href="someStyle1.css"]', testEPubDom)[0].disabled).toEqual(false);
			expect($('link[href="someStyle2.css"]', testEPubDom)[0].disabled).toEqual(false);
			expect($('link[href="someStyle3.css"]', testEPubDom)[0].disabled).toEqual(false);
			expect($('link[href="someStyle4.css"]', testEPubDom)[0].disabled).toEqual(false);
		});
	});

	describe("activation of style sheets", function () {

		it ("selects when the style sheets are grouped", function() {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" title="styleSet1"/>'
					   + '<link rel="alternate stylesheet" title="styleSet1"/>'
					   + '<link rel="alternate stylesheet" title="styleSet2"/>'
					   + '<link rel="alternate stylesheet" title="styleSet2"/>'
					   + '<link rel="alternate stylesheet" title="styleSet3"/>'
					   + '<link rel="alternate stylesheet" title="styleSet3"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);

			var $bookStyleSheets = $('link[rel*="stylesheet"]', testEPubDom);

			selector = new Readium.Models.AlternateStyleTagSelector;
			$bookStyleSheets = selector._activateStyleSet($bookStyleSheets, "styleSet2");

			expect($($bookStyleSheets[0])[0].disabled).toEqual(true);
			expect($($bookStyleSheets[1])[0].disabled).toEqual(true);
			expect($($bookStyleSheets[2])[0].disabled).toEqual(false);
			expect($($bookStyleSheets[3])[0].disabled).toEqual(false);
			expect($($bookStyleSheets[4])[0].disabled).toEqual(true);
			expect($($bookStyleSheets[5])[0].disabled).toEqual(true);
		});

		it ("selects when the style sheets are in an arbitrary order", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="alternate stylesheet" title="styleSet2"/>'
					   + '<link rel="alternate stylesheet" title="styleSet1"/>'
					   + '<link rel="alternate stylesheet" title="styleSet1"/>'
					   + '<link rel="alternate stylesheet" title="styleSet3"/>'
					   + '<link rel="alternate stylesheet" title="styleSet2"/>'
					   + '<link rel="alternate stylesheet" title="styleSet3"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);

			var $bookStyleSheets = $('link[rel*="stylesheet"]', testEPubDom);

			selector = new Readium.Models.AlternateStyleTagSelector;
			$bookStyleSheets = selector._activateStyleSet($bookStyleSheets, "styleSet2");

			expect($($bookStyleSheets[0])[0].disabled).toEqual(false);
			expect($($bookStyleSheets[1])[0].disabled).toEqual(true);
			expect($($bookStyleSheets[2])[0].disabled).toEqual(true);
			expect($($bookStyleSheets[3])[0].disabled).toEqual(true);
			expect($($bookStyleSheets[4])[0].disabled).toEqual(false);
			expect($($bookStyleSheets[5])[0].disabled).toEqual(true);
		});
	});

	describe("saving original stylesheet attributes", function() {

		it ("saves the first time", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="stylesheet" href="vertical.css"   class="vertical"   title="Vertical Day"/>'
					   + '<link rel="alternate stylesheet" href="day.css"        class="day"        title="Vertical Day"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);

			var $bookStyleSheets = $('link[rel*="stylesheet"]', testEPubDom);

			expect($($bookStyleSheets[0]).data("orig-rel")).toEqual(undefined);
			expect($($bookStyleSheets[1]).data("orig-rel")).toEqual(undefined);

			selector = new Readium.Models.AlternateStyleTagSelector;
			$bookStyleSheets = selector._storeOriginalAttributes($bookStyleSheets);

			expect($($bookStyleSheets[0]).data("orig-rel")).toEqual("stylesheet");
			expect($($bookStyleSheets[1]).data("orig-rel")).toEqual("alternate stylesheet");
		});

		it ("does not change the original style sheet attribute values if they've already been set", function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a set of style sheets grouped into style sets
			var styles = '<link rel="stylesheet"           href="vertical.css" class="vertical" title="Vertical Day" data-orig-rel="correct value 1"/>'
					   + '<link rel="alternate stylesheet" href="day.css"      class="day"      title="Vertical Day" data-orig-rel="correct value 2"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);

			var $bookStyleSheets = $('link[rel*="stylesheet"]', testEPubDom);

			selector = new Readium.Models.AlternateStyleTagSelector;
			$bookStyleSheets = selector._storeOriginalAttributes($bookStyleSheets);

			expect($($bookStyleSheets[0]).data("orig-rel")).toEqual("correct value 1");
			expect($($bookStyleSheets[1]).data("orig-rel")).toEqual("correct value 2");
		});
	});

	describe("style set selection", function () {

		var testEPubDom = getEPubContentDom();

		// Initialize a set of style sheets grouped into style sets
		var styles = '<link rel="alternate stylesheet" href="vertical.css"   class="vertical"   title="Vertical Day" data-orig-rel="alternate stylesheet"/>'
				   + '<link rel="alternate stylesheet" href="day.css"        class="day"        title="Vertical Day" data-orig-rel="alternate stylesheet"/>'
				   + '<link rel="alternate stylesheet" href="vertical.css"   class="vertical"   title="Vertical Night" data-orig-rel="alternate stylesheet"/>'
				   + '<link rel="alternate stylesheet" href="night.css"      class="night"      title="Vertical Night" data-orig-rel="alternate stylesheet"/>'
				   + '<link rel="stylesheet"           href="horizontal.css" class="horizontal" title="Horizontal Day" data-orig-rel="stylesheet"/>'
				   + '<link rel="stylesheet"           href="day.css"        class="day"        title="Horizontal Day" data-orig-rel="stylesheet"/>'
				   + '<link rel="stylesheet"           href="horizontal.css" class="horizontal" title="Horizontal Night" data-orig-rel="stylesheet"/>'
				   + '<link rel="stylesheet"           href="night.css"      class="night"      title="Horizontal Night" data-orig-rel="stylesheet"/>';

		$('head', testEPubDom)[0].appendChild($(styles)[0]);
		$('head', testEPubDom)[0].appendChild($(styles)[1]);
		$('head', testEPubDom)[0].appendChild($(styles)[2]);
		$('head', testEPubDom)[0].appendChild($(styles)[3]);
		$('head', testEPubDom)[0].appendChild($(styles)[4]);
		$('head', testEPubDom)[0].appendChild($(styles)[5]);
		$('head', testEPubDom)[0].appendChild($(styles)[6]);
		$('head', testEPubDom)[0].appendChild($(styles)[7]);

		it ("finds the style set based on tags", function() {

			selector = new Readium.Models.AlternateStyleTagSelector;
			var $bookStyleSheets = $("link[rel*='stylesheet']", testEPubDom);
			var selectedStyle = selector._getStyleSetTitleToActivate($bookStyleSheets, selector._getStyleSetTitles($bookStyleSheets), ["day", "vertical"]);

			expect(selectedStyle).toEqual("Vertical Day");
		});

		it ("finds the style set based on tag subset", function() {

			selector = new Readium.Models.AlternateStyleTagSelector;
			var $bookStyleSheets = $("link[rel*='stylesheet']", testEPubDom);
			var selectedStyle = selector._getStyleSetTitleToActivate($bookStyleSheets, selector._getStyleSetTitles($bookStyleSheets), ["day"]);

			expect(selectedStyle).toEqual("Horizontal Day");
		});

		it ("finds the style set from a set of rel='stylesheet alternate' style sets", function() {

			selector = new Readium.Models.AlternateStyleTagSelector;
			var $bookStyleSheets = $("link[rel*='stylesheet']", testEPubDom);
			var selectedStyle = selector._getStyleSetTitleToActivate($bookStyleSheets, selector._getStyleSetTitles($bookStyleSheets), ["vertical"]);

			expect(selectedStyle).toEqual("Vertical Day");
		});

		it ("returns null if no style tags are provided", function() {

			selector = new Readium.Models.AlternateStyleTagSelector;
			var $bookStyleSheets = $("link[rel*='stylesheet']", testEPubDom);
			var selectedStyle = selector._getStyleSetTitleToActivate($bookStyleSheets, selector._getStyleSetTitles($bookStyleSheets), []);

			expect(selectedStyle).toEqual(null);
		});

		it ("returns the style set even if extra tags are specified", function() {

			selector = new Readium.Models.AlternateStyleTagSelector;
			var $bookStyleSheets = $("link[rel*='stylesheet']", testEPubDom);
			var selectedStyle = selector._getStyleSetTitleToActivate($bookStyleSheets, selector._getStyleSetTitles($bookStyleSheets), ["horizontal", "night", "otherTag"]);

			expect(selectedStyle).toEqual("Horizontal Night");
		});

		var testShortEPubDom = getEPubContentDom();

		// Initialize a set of style sheets grouped into style sets
		var styles = '<link rel="alternate stylesheet" href="vertical.css"   class="vertical"   title="Vertical Day" data-orig-rel="alternate stylesheet"/>'
				   + '<link rel="alternate stylesheet" href="day.css"        class="day"        title="Vertical Day" data-orig-rel="alternate stylesheet"/>';

		$('head', testShortEPubDom)[0].appendChild($(styles)[0]);
		$('head', testShortEPubDom)[0].appendChild($(styles)[1]);

		it ("returns null if the style tags cannot be found", function () {

			selector = new Readium.Models.AlternateStyleTagSelector;
			var $bookStyleSheets = $("link[rel*='stylesheet']", testShortEPubDom);
			var selectedStyle = selector._getStyleSetTitleToActivate($bookStyleSheets, selector._getStyleSetTitles($bookStyleSheets), ["night"]);

			expect(selectedStyle).toEqual(null);
		});
	});

	describe("getting unique style set titles", function () {

		var testEPubDom = getEPubContentDom();

		// Initialize a set of style sheets grouped into style sets
		var styles = '<link rel="stylesheet" href="night.css" class="night" title="nightStyle"/>'
			       + '<link rel="alternate stylesheet" href="day.css" class="day" title="dayStyle"/>'
			       + '<link rel="alternate stylesheet" href="day.css" class="day" title="dayStyle"/>'
			       + '<link rel="alternate stylesheet" href="day.css" class="day" title="otherStyle"/>'
			       + '<link rel="alternate stylesheet" href="day.css" class="day" title="nightStyle"/>'
			       + '<link rel="alternate stylesheet" href="day.css" class="day" title="otherStyle"/>';

		$('head', testEPubDom)[0].appendChild($(styles)[0]);
		$('head', testEPubDom)[0].appendChild($(styles)[1]);
		$('head', testEPubDom)[0].appendChild($(styles)[2]);
		$('head', testEPubDom)[0].appendChild($(styles)[3]);
		$('head', testEPubDom)[0].appendChild($(styles)[4]);
		$('head', testEPubDom)[0].appendChild($(styles)[5]);

		it('gets a unique list of titles', function () {

			selector = new Readium.Models.AlternateStyleTagSelector;
			var $bookStyleSheets = $("link[rel*='stylesheet']", testEPubDom);
			var styleSetTitles = selector._getStyleSetTitles($bookStyleSheets);

			expect(styleSetTitles.length).toEqual(3);
			expect(styleSetTitles[0]).toEqual('nightStyle');
			expect(styleSetTitles[1]).toEqual('dayStyle');
			expect(styleSetTitles[2]).toEqual('otherStyle');
		});
	});

	describe("style set tag matching", function () {

		var testEPubDom = getEPubContentDom();

		// Initialize two style sets, with one style sheet each
		var styles = '<link rel="stylesheet" href="night.css" class="night" title="nightStyle"/>'
			       + '<link rel="alternate stylesheet" href="day.css" class="day" title="dayStyle"/>';

		$('head', testEPubDom)[0].appendChild($(styles)[0]);
		$('head', testEPubDom)[0].appendChild($(styles)[1]);
		
		it ('matched a single alternate style tag', function () {

			selector = new Readium.Models.AlternateStyleTagSelector;
			styleSet = $("link[title='nightStyle']", testEPubDom);

			var numTagMatches = selector._getNumAltStyleTagMatches(styleSet, ["night"]);			
			expect(numTagMatches).toEqual(1);
		});

		// Add a another style sheet to the "nightStyle" style set
		styles += '<link rel="stylesheet" href="vertical.css" class="vertical" title="nightStyle"/>';

		$('head', testEPubDom)[0].appendChild($(styles)[2]);

		it ('matched multiple alternate style tags within a style set', function () {

			selector = new Readium.Models.AlternateStyleTagSelector;
			styleSet = $("link[title='nightStyle']", testEPubDom);

			var numTagMatches = selector._getNumAltStyleTagMatches(styleSet, ["night", "vertical"]);			
			expect(numTagMatches).toEqual(2);
		});

		it ('ignored extra tags that are not included', function () {

			selector = new Readium.Models.AlternateStyleTagSelector;
			styleSet = $("link[title='nightStyle']", testEPubDom);

			var numTagMatches = selector._getNumAltStyleTagMatches(styleSet, ["night", "vertical", "extraTag"]);			
			expect(numTagMatches).toEqual(2);
		});
	});

	describe("alternate tag mutual exclusion", function () {

		it ('does not remove tags within a style set', function () {

			var testEPubDom = getEPubContentDom();

			// Initialize two style sets with one style sheet each
			var styles = '<link rel="stylesheet" href="night.css" class="night" title="nightStyle"/>'
				       + '<link rel="alternate stylesheet" href="vertical.css" class="vertical" title="nightStyle"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			var $styleSet = $("link[title='nightStyle']", testEPubDom);

			selector = new Readium.Models.AlternateStyleTagSelector;
			$styleSet = selector._removeMutuallyExclusiveAltTags($styleSet);

			var mutuallyExclTagsRemoved = false;

			if ($styleSet.filter("link[class*='night']").length === 0 
				|| $styleSet.filter("link[class*='vertical']").length === 0) {

				that.mutuallyExclTagsRemoved = true;
			}

			expect(mutuallyExclTagsRemoved).toEqual(false);
		});

		it('removes a single set of mutually exclusive tags', function () {

			var that = this;
			var testEPubDom = getEPubContentDom();

			// Initialize a style set that has mutually exclusive tags on it
			var styles = '<link rel="stylesheet" href="day.css" class="day" title="dayStyle"/>'
			           + '<link rel="stylesheet" href="night.css" class="night" title="dayStyle"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			var $styleSet = $("link[title='nightStyle']", testEPubDom);

			selector = new Readium.Models.AlternateStyleTagSelector;
			$styleSet = selector._removeMutuallyExclusiveAltTags($styleSet);

			var mutuallyExclTagsRemoved = true;

			if ($styleSet.filter("link[class*='night']").length > 0 
				|| $styleSet.filter("link[class*='vertical']").length > 0) {

				that.mutuallyExclTagsRemoved = false;
			}

			expect(mutuallyExclTagsRemoved).toEqual(true);
		});

		it('removes two sets of mutually exclusive tags', function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a style set that contains two sets of mutually exclusive tags
			var styles = '<link rel="stylesheet" href="day.css" class="day" title="dayStyle"/>'
			           + '<link rel="stylesheet" href="night.css" class="night" title="dayStyle"/>'
			           + '<link rel="stylesheet" href="night.css" class="horizontal" title="dayStyle"/>'
			           + '<link rel="stylesheet" href="night.css" class="vertical" title="dayStyle"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			var $styleSet = $("link[title='dayStyle']", testEPubDom);

			var that = this;

			selector = new Readium.Models.AlternateStyleTagSelector;
			$styleSet = selector._removeMutuallyExclusiveAltTags($styleSet);

			var mutuallyExclTagsRemoved = true;

			_.each(["day", "night", "horizontal", "vertical"], function(altTag) {

				if ($styleSet.filter("link[class*='" + altTag + "']").length === 0) {

					that.mutuallyExclTagsRemoved = false;
				}
			});

			expect(mutuallyExclTagsRemoved).toEqual(true);
		});

		it('removes two sets of mutually exclusive tags with multiple redundant tags', function () {

			var testEPubDom = getEPubContentDom();

			// Initialize a style set that contains two sets of mutually exclusive tags
			var styles = '<link rel="stylesheet" href="day.css" class="day" title="dayStyle"/>'
			           + '<link rel="stylesheet" href="night.css" class="night" title="dayStyle"/>'
			           + '<link rel="stylesheet" href="night.css" class="horizontal" title="dayStyle"/>'
			           + '<link rel="stylesheet" href="night.css" class="horizontal" title="dayStyle"/>'
			           + '<link rel="stylesheet" href="night.css" class="vertical" title="dayStyle"/>'
			           + '<link rel="stylesheet" href="night.css" class="night" title="dayStyle"/>';

			$('head', testEPubDom)[0].appendChild($(styles)[0]);
			$('head', testEPubDom)[0].appendChild($(styles)[1]);
			$('head', testEPubDom)[0].appendChild($(styles)[2]);
			$('head', testEPubDom)[0].appendChild($(styles)[3]);
			$('head', testEPubDom)[0].appendChild($(styles)[4]);
			$('head', testEPubDom)[0].appendChild($(styles)[5]);
			var $styleSet = $("link[title='dayStyle']", testEPubDom);

			var that = this;

			selector = new Readium.Models.AlternateStyleTagSelector;
			$styleSet = selector._removeMutuallyExclusiveAltTags($styleSet);

			var mutuallyExclTagsRemoved = true;

			_.each(["day", "night", "vertical", "horizontal"], function(altTag) {

				if ($styleSet.filter("link[class*='" + altTag + "']").length === 0) {

					that.mutuallyExclTagsRemoved = false;
				}
			});

			expect(mutuallyExclTagsRemoved).toEqual(true);
		});
	});
});