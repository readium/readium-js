var initializationTest = function (bookType) {
    
    if (bookType === "fixed") {
        var packageDocumentXML = '<?xml version="1.0" encoding="UTF-8"?> \
    <package xmlns="http://www.idpf.org/2007/opf" prefix="cc: http://creativecommons.org/ns# rendition: http://www.idpf.org/vocab/rendition/#" version="3.0" unique-identifier="bookid" xml:lang="fr" dir="ltr" id="package"> \
        <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"> \
          <dc:identifier id="bookid">code.google.com.epub-samples.page-blanche</dc:identifier> \
          <meta refines="#bookid" property="identifier-type" scheme="onix:codelist5">01</meta> \
          <dc:language>fr</dc:language> \
          <dc:title id="title">Page Blanche</dc:title> \
          <meta refines="#title" property="title-type">main</meta> \
          <dc:creator id="creator1">Boulet</dc:creator> \
          <meta refines="#creator1" property="file-as">Boulet</meta> \
          <meta refines="#creator1" property="role" scheme="marc:relators">aut</meta> \
          <meta refines="#creator1" property="display-seq">1</meta> \
          <dc:creator id="creator2">Bagieu Pénélope</dc:creator> \
          <meta refines="#creator2" property="file-as">Bagieu, Pénélope</meta> \
          <meta refines="#creator2" property="role" scheme="marc:relators">ill</meta> \
          <meta refines="#creator2" property="display-seq">2</meta> \
          <dc:publisher>éditions Delcourt</dc:publisher> \
          <dc:date>2012-01-18</dc:date> \
            <dc:rights xml:lang="en">This work is shared with the public using the Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0) license.</dc:rights> \
            <link rel="cc:license" href="http://creativecommons.org/licenses/by-sa/3.0/"/> \
            <dc:contributor id="contributor">Vincent Gros</dc:contributor> \
            <meta refines="#contributor" property="role" scheme="marc:relators">mrk</meta> \
            <meta refines="#contributor" property="file-as">Gros, Vincent</meta> \
            <meta property="dcterms:modified">2012-08-28T18:00:00Z</meta> \
          <meta property="rendition:layout">pre-paginated</meta> \
          <meta property="rendition:orientation">auto</meta> \
          <meta property="rendition:spread">auto</meta> \
          <meta name="cover" content="cover"/> \
       </metadata> \
       <manifest> \
          <item id="css" href="Style/style.css" media-type="text/css"/> \
          <item id="nav" href="Navigation/nav.xhtml" properties="nav" media-type="application/xhtml+xml"/> \
          <item id="ncx" href="Navigation/toc.ncx" media-type="application/x-dtbncx+xml" /> \
          <item id="id-cover-xhtml" href="Content/cover.xhtml" media-type="application/xhtml+xml"/> \
          <item id="white-xhtml" href="Content/PageBlanche_Page_000.xhtml" media-type="application/xhtml+xml"/> \
          <item id="id-PageBlanche_Page_001-xhtml" href="Content/PageBlanche_Page_001.xhtml" media-type="application/xhtml+xml"/> \
          <item id="id-PageBlanche_Page_002-xhtml" href="Content/PageBlanche_Page_002.xhtml" media-type="application/xhtml+xml"/> \
          <item id="id-PageBlanche_Page_003-xhtml" href="Content/PageBlanche_Page_003.xhtml" media-type="application/xhtml+xml"/> \
          <item id="id-PageBlanche_Page_004-xhtml" href="Content/PageBlanche_Page_004.xhtml" media-type="application/xhtml+xml"/> \
          <item id="id-PageBlanche_Page_005-xhtml" href="Content/PageBlanche_Page_005.xhtml" media-type="application/xhtml+xml"/> \
          <item id="id-PageBlanche_Page_006-xhtml" href="Content/PageBlanche_Page_006.xhtml" media-type="application/xhtml+xml"/> \
          <item id="id-PageBlanche_Page_007-xhtml" href="Content/PageBlanche_Page_007.xhtml" media-type="application/xhtml+xml"/> \
          <item id="id-PageBlanche_Page_008-xhtml" href="Content/PageBlanche_Page_008.xhtml" media-type="application/xhtml+xml"/> \
          <item id="id-cover-jpg" href="Image/cover.jpg" properties="cover-image" media-type="image/jpeg"/> \
          <item id="id-PageBlanche_Page_001-jpg" href="Image/PageBlanche_Page_001.jpg" media-type="image/jpeg"/> \
          <item id="id-PageBlanche_Page_002-jpg" href="Image/PageBlanche_Page_002.jpg" media-type="image/jpeg"/> \
          <item id="id-PageBlanche_Page_003-jpg" href="Image/PageBlanche_Page_003.jpg" media-type="image/jpeg"/> \
          <item id="id-PageBlanche_Page_004-jpg" href="Image/PageBlanche_Page_004.jpg" media-type="image/jpeg"/> \
          <item id="id-PageBlanche_Page_005-jpg" href="Image/PageBlanche_Page_005.jpg" media-type="image/jpeg"/> \
          <item id="id-PageBlanche_Page_006-jpg" href="Image/PageBlanche_Page_006.jpg" media-type="image/jpeg"/> \
          <item id="id-PageBlanche_Page_007-jpg" href="Image/PageBlanche_Page_007.jpg" media-type="image/jpeg"/> \
          <item id="id-PageBlanche_Page_008-jpg" href="Image/PageBlanche_Page_008.jpg" media-type="image/jpeg"/> \
       </manifest> \
       <spine toc="ncx"> \
          <itemref idref="id-cover-xhtml" properties="page-spread-left"/> \
          <itemref idref="white-xhtml" properties="page-spread-right"/> \
          <itemref idref="id-PageBlanche_Page_001-xhtml" properties="page-spread-left"/> \
          <itemref idref="id-PageBlanche_Page_002-xhtml" properties="page-spread-right"/> \
          <itemref idref="id-PageBlanche_Page_003-xhtml" properties="page-spread-left"/> \
          <itemref idref="id-PageBlanche_Page_004-xhtml" properties="page-spread-right"/> \
          <itemref idref="id-PageBlanche_Page_005-xhtml" properties="page-spread-left"/> \
          <itemref idref="id-PageBlanche_Page_006-xhtml" properties="page-spread-right"/> \
          <itemref idref="id-PageBlanche_Page_007-xhtml" properties="page-spread-left"/> \
          <itemref idref="id-PageBlanche_Page_008-xhtml" properties="page-spread-right"/> \
       </spine> \
    </package>'
  

    var epubParser = new EpubParserModule("epub_content/page-blanche-20121022/EPUB/package.opf", packageDocumentXML);
    var packageDocumentObject = epubParser.parse();
    var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
    var spineInfo = epub.getSpineInfo();
    var spineObjects = spineInfo.spine;

    var viewerSettings = {
        fontSize : 12,
        syntheticLayout : true,
        currentMargin : 3,
        tocVisible : false,
        currentTheme : "default"
    };

    var packDocDOM = (new window.DOMParser()).parseFromString(packageDocumentXML, "text/xml");

    return new EpubReaderModule(
        $("#reader"),
        spineInfo,
        viewerSettings,
        packDocDOM,
        "eager"
    );
  }
  else if (bookType === "reflowable") {

      var reader; 
      $.ajax({
        url : "/view_testing/epub_content/moby_dick/OPS/package.opf",
        async : false,
        success : function (result) {
            
          var packageDocumentXML = result;
          var epubParser = new EpubParserModule("epub_content/moby_dick/OPS/package.opf", packageDocumentXML);
          var packageDocumentObject = epubParser.parse();
          var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
          var spineInfo = epub.getSpineInfo();
          var spineObjects = spineInfo.spine;

          var viewerSettings = {
              fontSize : 12,
              syntheticLayout : false,
              currentMargin : 3,
              tocVisible : false,
              currentTheme : "default"
          };

          var packDocDOM = (new window.DOMParser()).parseFromString(packageDocumentXML, "text/xml");
          
          reader = new EpubReaderModule(
              $("#reader"),
              spineInfo,
              viewerSettings,
              packDocDOM,
              "eager"
          );
        }
      });

      return reader;
    }
    else if (bookType === "mixed") {

        var packageDocumentXML = '<?xml version="1.0" encoding="UTF-8"?> \
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" xml:lang="en" unique-identifier="uid" prefix="rendition: http://www.idpf.org/vocab/rendition/# cc: http://creativecommons.org/ns#"> \
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"> \
    <dc:title id="title">Thomas Cole - The Voyage of Life</dc:title> \
    <dc:creator>Jesse Dylan</dc:creator> \
    <dc:identifier id="uid">code.google.com.epub-samples.cole-voyage-of-life</dc:identifier> \
    <dc:language>en-US</dc:language> \
    <meta property="dcterms:modified">2012-03-20T11:37:00Z</meta> \
    <dc:rights>This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 Unported License.</dc:rights> \
    <link rel="cc:license" href="http://creativecommons.org/licenses/by-sa/3.0/"/> \
    <link rel="cc:attributionURL" href="http://en.wikipedia.org/wiki/The_Voyage_of_Life"/> \
  </metadata> \
  <manifest> \
    <item id="i" href="xhtml/0-intro.xhtml" media-type="application/xhtml+xml"/> \
    <item id="s1a" href="xhtml/1a-childhood-text.xhtml" media-type="application/xhtml+xml" /> \
    <item id="s1b" href="xhtml/1b-childhood-painting.xhtml" media-type="application/xhtml+xml" /> \
    <item id="s2a" href="xhtml/2a-youth-text.xhtml" media-type="application/xhtml+xml" /> \
    <item id="s2b" href="xhtml/2b-youth-painting.xhtml" media-type="application/xhtml+xml" /> \
    <item id="s3a" href="xhtml/3a-manhood-text.xhtml" media-type="application/xhtml+xml" /> \
    <item id="s3b" href="xhtml/3b-manhood-painting.xhtml" media-type="application/xhtml+xml" /> \
    <item id="s4a" href="xhtml/4a-oldage-text.xhtml" media-type="application/xhtml+xml" /> \
    <item id="s4b" href="xhtml/4b-oldage-painting.xhtml" media-type="application/xhtml+xml" /> \
    <item id="s5" href="xhtml/5-significance.xhtml" media-type="application/xhtml+xml" /> \
    <item id="j1_320" href="images/1-childhood-320.jpg" media-type="image/jpeg"/> \
    <item id="j1_1024" href="images/1-childhood-1024.jpg" media-type="image/jpeg"/> \
    <item id="j2_320" href="images/2-youth-320.jpg" media-type="image/jpeg"/> \
    <item id="j2_1024" href="images/2-youth-1024.jpg" media-type="image/jpeg"/> \
    <item id="j3_320" href="images/3-manhood-320.jpg" media-type="image/jpeg"/> \
    <item id="j3_1024" href="images/3-manhood-1024.jpg" media-type="image/jpeg"/> \
    <item id="j4_320" href="images/4-oldage-320.jpg" media-type="image/jpeg"/> \
    <item id="j4_1024" href="images/4-oldage-1024.jpg" media-type="image/jpeg"/> \
    <item id="prt" href="images/portrait.jpg" media-type="image/jpeg" properties="cover-image"/> \
    <item id="nav" href="xhtml/nav.xhtml" media-type="application/xhtml+xml" properties="nav"/> \
    <item id="css" href="css/cole.css" media-type="text/css"/> \
  </manifest> \
  <spine> \
    <itemref idref="i"/> \
    <itemref idref="s1a"/> \
    <itemref idref="s1b" properties="rendition:layout-pre-paginated rendition:orientation-landscape rendition:spread-none"/> \
    <itemref idref="s2a"/> \
    <itemref idref="s2b" properties="rendition:layout-pre-paginated rendition:orientation-landscape rendition:spread-none"/> \
    <itemref idref="s3a"/> \
    <itemref idref="s3b" properties="rendition:layout-pre-paginated rendition:orientation-landscape rendition:spread-none"/> \
    <itemref idref="s4a"/> \
    <itemref idref="s4b" properties="rendition:layout-pre-paginated rendition:orientation-landscape rendition:spread-none"/> \
    <itemref idref="s5"/> \
  </spine> \
</package>'

        var epubParser = new EpubParserModule("epub_content/cole-voyage-of-life-20120320/EPUB/cole.opf", packageDocumentXML);
        var packageDocumentObject = epubParser.parse();
        var epub = new EpubModule(packageDocumentObject, packageDocumentXML);
        var spineInfo = epub.getSpineInfo();
        var spineObjects = spineInfo.spine;

        var viewerSettings = {
            fontSize : 12,
            syntheticLayout : false,
            currentMargin : 3,
            tocVisible : false,
            currentTheme : "default"
        };

        var packDocDOM = (new window.DOMParser()).parseFromString(packageDocumentXML, "text/xml");
        
        return new EpubReaderModule(
            $("#reader"),
            spineInfo,
            viewerSettings,
            packDocDOM,
            "lazy"
        );
    }
};