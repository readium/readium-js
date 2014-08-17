//  Copyright (c) 2014 Readium Foundation and/or its licensees. All rights reserved.
//  
//  Redistribution and use in source and binary forms, with or without modification, 
//  are permitted provided that the following conditions are met:
//  1. Redistributions of source code must retain the above copyright notice, this 
//  list of conditions and the following disclaimer.
//  2. Redistributions in binary form must reproduce the above copyright notice, 
//  this list of conditions and the following disclaimer in the documentation and/or 
//  other materials provided with the distribution.
//  3. Neither the name of the organization nor the names of its contributors may be 
//  used to endorse or promote products derived from this software without specific 
//  prior written permission.

define(function () {

        var ResourceCache = function () {

            var self = this;
            var _resourcesHash = {};

            this.getResourceURL = function(resourceAbsoluteHref) {
                var resourceObjectUrl = null;
                var resourceData = _resourcesHash[resourceAbsoluteHref];
                if (resourceData) {
                    resourceObjectUrl = resourceData.url;
                }
                return resourceObjectUrl;
            };

            this.putResource = function (resourceAbsoluteHref, resourceObjectUrl, resourceDataBlob) {
                _resourcesHash[resourceAbsoluteHref] = {
                    url: resourceObjectUrl,
                    blob: resourceDataBlob
                };
            };

            this.evictResource = function(resourceAbsoluteHref, sourceWindow) {
                var resourceData = _resourcesHash[resourceAbsoluteHref];
                if (resourceData) {
                    console.log('revoking object URL: ' + resourceData.url);
                    sourceWindow.URL.revokeObjectURL(resourceData.url);
                    delete _resourcesHash[resourceAbsoluteHref];
                }
            };

            this.flushCache = function(sourceWindow) {
                console.log('Cache contents:');
                console.log(_resourcesHash);
                console.log('Flushing cache.');
                for (var resourceAbsoluteHref in _resourcesHash) {
                    this.evictResource(resourceAbsoluteHref, sourceWindow);
                }
                console.log('Cache contents:');
                console.log(_resourcesHash);
            };
            // TODO: automatic cache size accounting and management algorithms e.g. LRU.
        };

        return ResourceCache;
    });
