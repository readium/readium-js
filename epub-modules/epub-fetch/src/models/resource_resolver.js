define(['require', 'module', 'jquery', 'URIjs', './fetch_base'], function (require, module, $, URI, EpubFetchBase) {
    console.log('resource_resolver module id: ' + module.id);

    var ResourceResolver = EpubFetchBase.extend({
        initialize: function (attributes) {
        },

        _resolveResourceElements: function (elemName, refAttr, contentDocumentDom, contentDocumentURI,
                                            resolutionDeferreds, onerror) {
            var thisResolver = this;
            var fetcher = thisResolver.get('_resourceFetcher');
            var resolvedElems = $(elemName + '[' + refAttr + ']', contentDocumentDom);

            resolvedElems.each(function (index, resolvedElem) {
                var refAttrVal = $(resolvedElem).attr(refAttr);
                var refAttrUri = new URI(refAttrVal);

                if (refAttrUri.scheme() === '') {
                    // Relative URI, fetch from packed EPUB archive:

                    var resolutionDeferred = $.Deferred();
                    resolutionDeferreds.push(resolutionDeferred);
                    var uriRelativeToZipRoot = refAttrUri.absoluteTo(contentDocumentURI).toString();

                    fetcher.relativeToPackageFetchFileContents(uriRelativeToZipRoot, 'blob', function (resourceData) {
                        $(resolvedElem).attr(refAttr, window.URL.createObjectURL(resourceData));
                        resolutionDeferred.resolve();
                    }, onerror);
                }
            });
        },

        resolveInternalPackageResources: function (contentDocumentURI, contentDocumentType, contentDocumentText,
                                                   resolvedDocumentCallback, onerror) {
            var thisResolver = this;

            var contentDocumentDom = this.parseMarkup(contentDocumentText, contentDocumentType);

            var resolutionDeferreds = [];

            thisResolver._resolveResourceElements('img', 'src', contentDocumentDom, contentDocumentURI,
                resolutionDeferreds, onerror);
            thisResolver._resolveResourceElements('link', 'href', contentDocumentDom, contentDocumentURI,
                resolutionDeferreds, onerror);

            $.when.apply($, resolutionDeferreds).done(function () {
                resolvedDocumentCallback(contentDocumentDom);
            });


        }
    });

    return ResourceResolver;
});