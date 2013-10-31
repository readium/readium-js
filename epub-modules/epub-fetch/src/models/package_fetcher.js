define(['require', 'module', './fetch_base', './discover_content_type', './plain_fetcher', './zip_fetcher',
    './resource_resolver'],
    function (require, module, EpubFetchBase, ContentTypeDiscovery, PlainExplodedFetcher, ZipFetcher,
              ResourceResolver) {
        console.log('package_fetcher module id: ' + module.id);


        var PackageFetcher = function(packageDocumentURL, libDir){

            PackageFetcher.contentTypePackageReadStrategyMap = {
                'application/oebps-package+xml': 'exploded',
                    'application/epub+zip': 'zipped',
                    'application/zip': 'zipped'
            };


            var _contentTypeDiscovery = new ContentTypeDiscovery(packageDocumentURL);
            var _packageContentType = _contentTypeDiscovery.identifyContentType();
            var _packageReadStrategy = getPackageReadStrategy(_packageContentType);
            var _resourceFetcher = createResourceFetcher(packageDocumentURL, libDir, _packageReadStrategy, _contentTypeDiscovery);
            var _resourceResolver = new ResourceResolver(_resourceFetcher);
            var self = this;

            function getPackageReadStrategy(packageContentType) {
                var readStrategy = 'exploded';

                if (packageContentType in PackageFetcher.contentTypePackageReadStrategyMap) {
                    readStrategy = PackageFetcher.contentTypePackageReadStrategyMap[packageContentType]
                }
                return readStrategy;
            }

            function createResourceFetcher(packageDocumentURL, libDir, packageReadStrategy, contentTypeDiscovery) {

                if (packageReadStrategy === 'exploded') {

                    console.log('using new PlainExplodedFetcher');
                    return new PlainExplodedFetcher(packageDocumentURL);

                } else if (packageReadStrategy === 'zipped') {
                    console.log('using new ZipFetcher');
                    return new ZipFetcher(packageDocumentURL, contentTypeDiscovery, libDir);
                } else {
                    throw new Error('Unsupported package read strategy: ' + packageReadStrategy);
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

            this.getPackageContentType = function () {
                return _packageContentType;
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