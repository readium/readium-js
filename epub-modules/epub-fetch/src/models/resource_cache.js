define(function () {

        var ResourceCache = function () {

            var self = this;
            var _resourcesHash = {};

            this.getResourceURL = function (resourceAbsoluteHref) {
                return _resourcesHash[resourceAbsoluteHref];
            };

            this.putResourceURL = function (resourceAbsoluteHref, resourceObjectUrl) {
                _resourcesHash[resourceAbsoluteHref] = resourceObjectUrl;
            };
            // TODO: methods to evict resource, destroy cache and release object URLs using window.URL.revokeObjectURL(), automatic
            // cache size accounting and management algorithms like LRU.
        };

        return ResourceCache;
    });
