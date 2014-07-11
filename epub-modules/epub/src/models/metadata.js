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

define(['require', 'module', 'underscore'],
    function (require, module, _) {

        var Metadata = function () {

            var that = this;

            var _mediaItemIndexByRefinesId = {};

            /**
             * Iterate over media items and apply callback (synchronously) on each one of them.
             * @param iteratorCallback the iterator callback function, will be called once for each media item,
             * and the item will be passed as the (one and only) argument.
             * @returns the Metadata object for chaining.
             */
            this.eachMediaItem = function(iteratorCallback) {
                if (that.mediaItems) {
                    _.each(that.mediaItems, iteratorCallback);
                }
                return this;
            };

            this.getMediaItemByRefinesId = function(id) {
                return _mediaItemIndexByRefinesId[id];
            };

            this.setMoMap = function(mediaOverlaysMap) {
                that.media_overlay.smil_models = mediaOverlaysMap;
            };

            // Initialize indexes
            this.eachMediaItem(function(item) {
                var id = item.refines;
                var hash = id.indexOf('#');
                if (hash >= 0) {
                    var start = hash+1;
                    var end = id.length-1;
                    id = id.substr(start, end);
                }
                id = id.trim();

                _mediaItemIndexByRefinesId[id] = item;
            });


        };
        return Metadata;
    });