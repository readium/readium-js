
define(['require', 'module', 'console_shim', 'jquery', 'underscore', 'readerView', 'epub-fetch', 'emub-model/package_document_parser', 'emub-model/package_document', 'epub-fetch/iframe_zip_loader', 'emub-model/smil_document_parser', 'URIjs', 'epub-ui/gestures'],
    function (require, module, console_shim, $, _, readerView, ResourceFetcher, PackageParser, PackageDocument, IframeZipLoader, SmilParser, URI, GesturesHandler) {

    console.log('Readium module id: ' + module.id);

    var Readium = function(readiumOptions, readerOptions){

        var self = this;

        var _currentResourceFetcher;

        var _iframeZipLoader = new IframeZipLoader(ReadiumSDK, function() { return _currentResourceFetcher; });

        var jsLibRoot = readiumOptions.jsLibRoot;
        var renderingViewport = readerOptions.el;

        readerOptions.iframeLoader = _iframeZipLoader;

        this.reader = new ReadiumSDK.Views.ReaderView(readerOptions);

        ReadiumSDK.trigger(ReadiumSDK.Events.READER_INITIALIZED, this.reader);

        var _gesturesHandler = new GesturesHandler(this.reader,renderingViewport);
        _gesturesHandler.initialize();


        this.openPackageDocument = function(bookRoot, callback)  {

            _currentResourceFetcher = new ResourceFetcher(bookRoot, jsLibRoot);

            _currentResourceFetcher.initialize(function() {

                var _packageParser = new PackageParser(bookRoot, _currentResourceFetcher);

                _packageParser.parse(function(docJson){
                    SmilParser.fillSmilData(docJson, bookRoot, jsLibRoot, _currentResourceFetcher, function() {
                        var packageDocument = new PackageDocument(_currentResourceFetcher.getPackageUrl(), docJson, _currentResourceFetcher);
                        var openBookOptions = readiumOptions.openBookOptions || {};
                        var openBookData = $.extend(packageDocument.getPackageData(), openBookOptions);
                        self.reader.openBook(openBookData);

                        var options = { 
                            packageDocumentUrl : _currentResourceFetcher.getPackageUrl(),
                            metadata: docJson.metadata
                        };

                        if (callback){
                            // gives caller access to document metadata like the table of contents
                            callback(packageDocument, options);
                        }
                    })
                });
            });
       }
    };


    return Readium;

});
