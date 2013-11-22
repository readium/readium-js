
define(['require', 'module', 'jquery', 'underscore', 'readerView', 'epub-fetch', 'emub-model/package_document_parser', 'emub-model/package_document', 'epub-fetch/iframe_zip_loader'],
    function (require, module, $, _, readerView, ResourceFetcher, PackageParser, PackageDocument, IframeZipLoader) {

    console.log('Readium module id: ' + module.id);

    var Readium = function(renderingViewport, jsLibRoot){

        var self = this;

        var _currentResourceFetcher;

        var _iframeZipLoader = new IframeZipLoader(ReadiumSDK, function() { return _currentResourceFetcher; });

        this.reader = new ReadiumSDK.Views.ReaderView( {el:renderingViewport, iframeLoader: _iframeZipLoader} );
        ReadiumSDK.trigger(ReadiumSDK.Events.READER_INITIALIZED);


       this.openPackageDocument = function(packageDocumentURL)  {

           _currentResourceFetcher = new ResourceFetcher(packageDocumentURL, jsLibRoot);
           var _packageParser = new PackageParser(_currentResourceFetcher);

           _packageParser.parse(function(docJson){

               var packageDocument = new PackageDocument(packageDocumentURL, docJson);
               self.reader.openBook(packageDocument.getPackageData())

           });
       }

    };


    return Readium;

});