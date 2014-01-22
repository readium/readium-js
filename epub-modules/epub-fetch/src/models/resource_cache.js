define(function () {

        var ResourceCache = function () {

            var self = this;
            var _resourcesHash = {};

            this.getResourceURL = function (resourceAbsoluteHref) {
                console.log('ResourceCache: looking for [' + resourceAbsoluteHref + ']');
                var resourceObjectUrl = _resourcesHash[resourceAbsoluteHref];
                if (resourceObjectUrl) {
                    console.log('ResourceCache: found [' + resourceAbsoluteHref + '] => [' + resourceObjectUrl + ']');
                }
                return resourceObjectUrl;
            };

            this.putResourceURL = function (resourceAbsoluteHref, resourceObjectUrl) {
                console.log('ResourceCache: putting [' + resourceAbsoluteHref + '] => [' + resourceObjectUrl + ']');
                _resourcesHash[resourceAbsoluteHref] = resourceObjectUrl;
            };
            // TODO: methods to evict resource, destroy cache and release object URLs using window.URL.revokeObjectURL(), automatic
            // cache size accounting and management algorithms like LRU.
        };

        return ResourceCache;
    });
