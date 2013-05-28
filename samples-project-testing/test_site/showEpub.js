var showEpub = function (packageDocumentPath) {

    var reader;
    $.ajax({
        url : packageDocumentPath,
        async : false,
        success : function (result) {
            
          var packageDocumentXML = result;
          var epubParser = new EpubParserModule(packageDocumentPath, packageDocumentXML);
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
              packDocDOM
          );
        }
    });

    return reader;
};