define(['require', 'module', './markup_parser', './discover_content_type', './plain_fetcher', './zip_fetcher',
    './resource_resolver'],
    function (require, module, MarkupParser, ContentTypeDiscovery, PlainExplodedFetcher, ZipFetcher,
              ResourceResolver) {
        console.log('package_fetcher module id: ' + module.id);


        var PackageFetcher = function(packageDocumentURL, libDir){

            PackageFetcher.contentTypePackageReadStrategyMap = {
                'application/oebps-package+xml': 'exploded',
                    'application/epub+zip': 'zipped',
                    'application/zip': 'zipped'
            };

            var _resourceFetcher = createResourceFetcher(packageDocumentURL, libDir);
            var _resourceResolver = new ResourceResolver(_resourceFetcher);
            var self = this;

            function createResourceFetcher(packageDocumentURL, libDir) {

                var readStrategy = 'exploded';

                var packageContentType = ContentTypeDiscovery.identifyContentType(packageDocumentURL);

                if (packageContentType in PackageFetcher.contentTypePackageReadStrategyMap) {
                    readStrategy = PackageFetcher.contentTypePackageReadStrategyMap[packageContentType]
                }

                if (readStrategy === 'exploded') {

                    console.log('using new PlainExplodedFetcher');
                    return new PlainExplodedFetcher(packageDocumentURL);

                } else if (readStrategy === 'zipped') {
                    console.log('using new ZipFetcher');
                    return new ZipFetcher(packageDocumentURL, libDir);
                } else {
                    throw new Error('Unsupported package read strategy: ' + readStrategy);
                }
            }

            this.getPackageDocumentURL = function() {
                return packageDocumentURL;
            };

            this.isPackageExploded = function () {
                return _resourceFetcher.isExploded();
            };

            this.resolveURI = function (epubResourceURI) {
                return _resourceFetcher.resolveURI(epubResourceURI);
            };

            this.relativeToPackageFetchFileContents = function (relativePath, fetchMode, fetchCallback, onrror) {
                return _resourceFetcher.relativeToPackageFetchFileContents(relativePath, fetchMode, fetchCallback, onrror);
            };

            this.getPackageDom = function (callback) {
                return _resourceFetcher.getPackageDom(callback);
            };

            this.resolveInternalPackageResources = function (contentDocumentURI, contentDocumentType, contentDocumentText, resolvedDocumentCallback, onerror) {
                return _resourceResolver.resolveInternalPackageResources(contentDocumentURI, contentDocumentType, contentDocumentText, resolvedDocumentCallback, onerror);
            };

            return self;
        };

        return PackageFetcher;
    });