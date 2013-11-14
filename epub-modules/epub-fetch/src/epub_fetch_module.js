define(['require', 'module', 'jquery', 'underscore', './models/package_fetcher' ],
    function (require, module, $, _, PackageFetcher) {


        console.log('epub_fetch_module module id: ' + module.id);
        console.log(module.id);

        var EpubFetchModule = function(packageDocumentURL, libDir) {

            var _packageFetcher = new PackageFetcher(packageDocumentURL, libDir);


            this.getPackageDom = function (callback) {
                return _packageFetcher.getPackageDom(callback);
            };

            this.getPackageDocumentURL = function () {
                return _packageFetcher.getPackageDocumentURL();
            };

            this.isPackageExploded = function () {
                return _packageFetcher.isPackageExploded();
            };

            this.resolveURI = function (epubResourceURI) {
                return _packageFetcher.resolveURI(epubResourceURI);
            };

            this.relativeToPackageFetchFileContents = function (relativePath, fetchMode, fetchCallback, onerror) {
                return _packageFetcher.relativeToPackageFetchFileContents(relativePath, fetchMode, fetchCallback,
                    onerror);
            };

            this.resolveInternalPackageResources = function (contentDocumentURI, contentDocumentType, contentDocumentText,
                                                       resolvedDocumentCallback, onerror) {
                return _packageFetcher.resolveInternalPackageResources(contentDocumentURI, contentDocumentType,
                    contentDocumentText, resolvedDocumentCallback, onerror);
            }

        };

        return EpubFetchModule;
    });
