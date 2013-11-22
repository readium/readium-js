
define(['require', 'module', 'jquery', 'underscore', 'readerView', 'epub-fetch', 'epub-model/package_document_parser', 'epub-model/package_document', 'epub-renderer', 'annotations_module'],
    function (require, module, $, _, readerView, ResourceFetcher, PackageParser, PackageDocument, IFrameLoadInterceptor) {

    console.log('Readium module id: ' + module.id);

    var Readium = function(renderingViewport, jsLibRoot){

        var self = this;
        this.reader = new ReadiumSDK.Views.ReaderView( {el:renderingViewport} );

        ReadiumSDK.trigger(ReadiumSDK.Events.READER_INITIALIZED);

        var _loadIFrameInteceptor = new IFrameLoadInterceptor(ReadiumSDK, this.reader, function() { return _currentResourceFetcher; });

        var _currentResourceFetcher;

        this.openPackageDocument = function(packageDocumentURL)  {

            _currentResourceFetcher = new ResourceFetcher(packageDocumentURL, jsLibRoot);
            var _packageParser = new PackageParser(_currentResourceFetcher);

            _packageParser.parse(function(docJson){

                var packageDocument = new PackageDocument(packageDocumentURL, docJson);
                self.reader.openBook(packageDocument.getPackageData())

            });
        }


        this.addSelectionHighlight = function(id, type) {
            return self.reader.getAnnotaitonsManagerForCurrentSpineItem().addSelectionHighlight(id, type);
        },

        this.addHighlight = function(CFI, id, type) {
            return self.reader.getAnnotaitonsManagerForCurrentSpineItem().addHighlight(CFI, id, type);
        },

        this.getCurrentSelectionCFI = function() {
            return self.reader.getAnnotaitonsManagerForCurrentSpineItem().getCurrentSelectionCFI();
        }




    };




    return Readium;

});
