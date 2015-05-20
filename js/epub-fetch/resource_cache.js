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

define(['underscore'], function (_) {

        var ResourceCache = function(sourceWindow, configuredCacheSizeEvictThreshold) {

            var self = this;
            var _resourcesHash = {};
            var _orderingByLastUseTimestamp = [];
            var _cacheSize = 0;
            var CACHE_SIZE_EVICT_THRESHOLD_DEFAULT = 100000000;
            var cacheSizeEvictThreshold = determineCacheSizeThreshold();

            function getTimestamp() {
                return new Date().getTime();
            }

            function getBrowserHeapLimitInBytes() {
                if (window.performance && window.performance.memory && window.performance.memory.jsHeapSizeLimit) {
                    return window.performance.memory.jsHeapSizeLimit;
                } else {
                    return null;
                }
            }

            function determineCacheSizeThreshold() {
                if (configuredCacheSizeEvictThreshold) {
                    return configuredCacheSizeEvictThreshold;
                }
                var browserHeapLimitInBytes = getBrowserHeapLimitInBytes();
                if (browserHeapLimitInBytes && browserHeapLimitInBytes / 10 > CACHE_SIZE_EVICT_THRESHOLD_DEFAULT) {
                    return browserHeapLimitInBytes / 10;
                } else {
                    return  CACHE_SIZE_EVICT_THRESHOLD_DEFAULT;
                }
            }

            this.getResourceURL = function(resourceAbsoluteHref) {
                var resourceObjectUrl = null;
                var resourceData = _resourcesHash[resourceAbsoluteHref];
                if (resourceData) {
                    resourceObjectUrl = resourceData.url;
                    resourceData.lastUseTimestamp = getTimestamp();
                    updateOrderedIndex(resourceData);
                }
                return resourceObjectUrl;
            };

            function removeCacheEntryFromOrderedIndex(cacheEntry) {
                // Remove the previous entry from the ordered index, if present:
                if (typeof cacheEntry.orderingByLastUseTimestampIdx !== 'undefined') {
                    var orderingByLastUseTimestampIdx = cacheEntry.orderingByLastUseTimestampIdx;
                    _orderingByLastUseTimestamp.splice(orderingByLastUseTimestampIdx, 1);
                    // Decrement index values for all downshifted entries:
                    for (var i = orderingByLastUseTimestampIdx; i < _orderingByLastUseTimestamp.length; i++) {
                        var downshiftedEntry = _orderingByLastUseTimestamp[i];
                        // Assertion
                        if ((downshiftedEntry.orderingByLastUseTimestampIdx - 1) != i) {
                            console.error('algorithm incorrect: downshiftedEntry.orderingByLastUseTimestampIdx: ' +
                                downshiftedEntry.orderingByLastUseTimestampIdx + ', i: ' + i + " -- " + cacheEntry.absoluteHref);
                        }
                        downshiftedEntry.orderingByLastUseTimestampIdx = i;
                    }
                }
            }

            function updateOrderedIndex(cacheEntry) {
                removeCacheEntryFromOrderedIndex(cacheEntry);
                var insertIdx = _.sortedIndex(_orderingByLastUseTimestamp, cacheEntry, 'lastUseTimestamp');
                _orderingByLastUseTimestamp.splice(insertIdx, 0, cacheEntry);
                cacheEntry.orderingByLastUseTimestampIdx = insertIdx;
            }

            this.putResource = function(resourceAbsoluteHref, resourceObjectUrl, resourceDataBlob) {
                this.trimCache();
                var currentTimestamp = getTimestamp();
                var cacheEntry = {
                    url: resourceObjectUrl,
                    absoluteHref: resourceAbsoluteHref,
                    blob: resourceDataBlob,
                    blobSize: resourceDataBlob.size,
                    creationTimestamp: currentTimestamp,
                    lastUseTimestamp: currentTimestamp,
                    pinned: true
                };
                _resourcesHash[resourceAbsoluteHref] = cacheEntry;
                updateOrderedIndex(cacheEntry);
                _cacheSize += resourceDataBlob.size;
            };

            this.evictResource = function(resourceAbsoluteHref) {
                var resourceData = _resourcesHash[resourceAbsoluteHref];
                if (resourceData) {
                    sourceWindow.URL.revokeObjectURL(resourceData.url);
                    _cacheSize -= resourceData.blobSize;
                    removeCacheEntryFromOrderedIndex(resourceData);
                    delete _resourcesHash[resourceAbsoluteHref];
                }
            };

            this.flushCache = function() {
                // TODO: more efficient, but less code reuse: iterate over _sortedIndex first,
                // then assert an empty cache and perform backup cleanup if assertion failed
                for (var resourceAbsoluteHref in _resourcesHash) {
                    this.evictResource(resourceAbsoluteHref);
                }
                // Assertion
                if (_cacheSize != 0) {
                    console.error('cacheSize accounting error! cacheSize: ' + _cacheSize + ', _resourcesHash:');
                    console.error(_resourcesHash);
                }
                _orderingByLastUseTimestamp = [];
                //console.log('Cache contents:');
                //console.log(_resourcesHash);
                //console.log('_orderingByLastUseTimestamp:');
                //console.log(_orderingByLastUseTimestamp);
                //console.log('Cache size:' + _cacheSize);
            };

            this.unPinResources = function() {
                for (var resourceAbsoluteHref in _resourcesHash) {
                    var resourceData = _resourcesHash[resourceAbsoluteHref];
                    resourceData.pinned = false;
                }
            };

            function orderingByLastUseTimestampToString() {
                return _orderingByLastUseTimestamp.reduce(function(previousValue, currentValue) {
                    return previousValue + (previousValue.length > 1 ? ', ' : '') + '[' +
                        currentValue.absoluteHref + ', pinned: ' + currentValue.pinned +
                        ', orderingByLastUseTimestampIdx: ' + currentValue.orderingByLastUseTimestampIdx + ']'
                }, '');
            }

            this.trimCache = function() {
                if (_cacheSize < cacheSizeEvictThreshold) {
                    return;
                }
                console.log('Trimming cache. Current cache size: ' + _cacheSize);

                // Loop through ordered index (by last use timestamp) starting from the least recently used entries.
                // evict unpinned resources until either:
                // 1) cache size drops below CACHE_SIZE_EVICT_THRESHOLD
                // 2) there are no more unpinned resources to evict
                for (var i = 0; i < _orderingByLastUseTimestamp.length; i++) {
                    if (_cacheSize < cacheSizeEvictThreshold) {
                        break;
                    }
                    var cacheEntry = _orderingByLastUseTimestamp[i];
                    if (!cacheEntry.pinned) {
                        var resourceAbsoluteHref = cacheEntry.absoluteHref;
                        //console.log('Preparing to evict ' + resourceAbsoluteHref);
                        //console.log('_orderingByLastUseTimestamp:');
                        //console.log(orderingByLastUseTimestampToString());
                        this.evictResource(resourceAbsoluteHref);
                        //console.log('Evicted ' + resourceAbsoluteHref);
                        //console.log('Current cache size: ' + _cacheSize);
                        //console.log('_orderingByLastUseTimestamp:');
                        //console.log(orderingByLastUseTimestampToString());
                        //console.log('i: ' + i);

                        // The consequent array elements have downshifted by one position.
                        // The i variable now points to a different element - the evicted element's successor
                        // (if not beyond array's end).
                        // Make the i variable remain in place - compensate for its upcoming incrementation:
                        i--;
                    }
                }
                console.log('Cache size after trimming: ' + _cacheSize);
            };
        };

        return ResourceCache;
    });
