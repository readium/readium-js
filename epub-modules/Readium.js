
define(['require', 'module', 'console_shim', 'jquery', 'underscore', 'readerView', 'epub-fetch', 'epub-model/package_document_parser', 'epub-fetch/iframe_zip_loader', 'URIjs', 'epub-ui/gestures'],
    function (require, module, console_shim, $, _, readerView, PublicationFetcher, PackageParser, IframeZipLoader, URI, GesturesHandler) {

    console.log('Readium module id: ' + module.id);

    //hack to make URI object global for readers consumption.
    window.URI = URI;

    //polyfill to support Safari 6
    if ('URL' in window === false) {
        if ('webkitURL' in window === false) {
            throw Error('Browser does not support window.URL');
        }

        window.URL = window.webkitURL;
    }

    var Readium = function(readiumOptions, readerOptions){

        var self = this;

        var _currentPublicationFetcher;

        var _iframeZipLoader = new IframeZipLoader(ReadiumSDK, function() { return _currentPublicationFetcher; });

        var jsLibRoot = readiumOptions.jsLibRoot;
        var renderingViewport = readerOptions.el;

        readerOptions.iframeLoader = _iframeZipLoader;

        this.reader = new ReadiumSDK.Views.ReaderView(readerOptions);

        var _gesturesHandler = new GesturesHandler(this.reader,renderingViewport);
        _gesturesHandler.initialize();


        this.openPackageDocument = function(bookRoot, callback, openPageRequest)  {

            _currentPublicationFetcher = new PublicationFetcher(bookRoot, jsLibRoot);

            _currentPublicationFetcher.initialize(function() {

                var _packageParser = new PackageParser(bookRoot, _currentPublicationFetcher);

                _packageParser.parse(function(packageDocJson, packageDocument){
                    var openBookOptions = readiumOptions.openBookOptions || {};
                    var openBookData = $.extend(packageDocument.getPackageData(), openBookOptions);

                    if (openPageRequest) {
                        openBookData.openPageRequest = openPageRequest;
                    }
                    self.reader.openBook(openBookData);

                    var options = {
                        packageDocumentUrl : _currentPublicationFetcher.getPackageUrl(),
                        metadata: packageDocJson.metadata
                    };

                    if (callback){
                        // gives caller access to document metadata like the table of contents
                        callback(packageDocument, options);
                    }
                });
            });
        }

        ReadiumSDK.trigger(ReadiumSDK.Events.READER_INITIALIZED, this.reader);
    };


    return Readium;

});
