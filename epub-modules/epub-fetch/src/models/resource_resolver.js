define(['require', 'module', 'jquery', 'URIjs', './fetch_base'], function (require, module, $, URI, EpubFetchBase) {
    console.log('resource_resolver module id: ' + module.id);

    var ResourceResolver = function(resourceFetcher) {


        var _baseFetcher = new EpubFetchBase();

        function resolveResourceElements (elemName, refAttr, contentDocumentDom, contentDocumentURI, resolutionDeferreds, onerror) {

            var resolvedElems = $(elemName + '[' + refAttr + ']', contentDocumentDom);

            resolvedElems.each(function (index, resolvedElem) {
                var refAttrVal = $(resolvedElem).attr(refAttr);
                var refAttrUri = new URI(refAttrVal);

                if (refAttrUri.scheme() === '') {
                    // Relative URI, fetch from packed EPUB archive:

                    var resolutionDeferred = $.Deferred();
                    resolutionDeferreds.push(resolutionDeferred);
                    var uriRelativeToZipRoot = refAttrUri.absoluteTo(contentDocumentURI).toString();

                    resourceFetcher.relativeToPackageFetchFileContents(uriRelativeToZipRoot, 'blob', function (resourceData) {
                        $(resolvedElem).attr(refAttr, window.URL.createObjectURL(resourceData));
                        resolutionDeferred.resolve();
                    }, onerror);
                }
            });
        }

        this.isExploded = function () {
            return resourceFetcher.isExploded();
        };

        this.resolveInternalPackageResources = function (contentDocumentURI, contentDocumentType, contentDocumentText,
                                                   resolvedDocumentCallback, onerror) {

            var contentDocumentDom = _baseFetcher.parseMarkup(contentDocumentText, contentDocumentType);

            var resolutionDeferreds = [];

            resolveResourceElements('img', 'src', contentDocumentDom, contentDocumentURI,
                resolutionDeferreds, onerror);
            resolveResourceElements('link', 'href', contentDocumentDom, contentDocumentURI,
                resolutionDeferreds, onerror);

            $.when.apply($, resolutionDeferreds).done(function () {
                resolvedDocumentCallback(contentDocumentDom);
            });


        }
    };

    return ResourceResolver;
});