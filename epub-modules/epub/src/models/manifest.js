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

        var Manifest = function (manifestJson) {

            var _manifestIndexById = {};
            var _navItem;

            this.manifestLength = function() {
                return manifestJson.length;
            };

            this.getManifestItemByIdref = function (idref) {
                return _manifestIndexById[idref];
            };

            /**
             * Iterate over manifest items and apply callback (synchronously) on each one of them.
             * @param iteratorCallback the iterator callback function, will be called once for each manifest item,
             * and the item will be passed as the (one and only) argument.
             * @returns the Manifest object for chaining.
             */
            this.each = function(iteratorCallback) {
                _.each(manifestJson, iteratorCallback);
                return this;
            };

            this.getNavItem = function () {
                return _navItem;
            };

            // Initialize indexes
            this.each(function(manifestItem) {
                _manifestIndexById[manifestItem.id] = manifestItem;

                if (manifestItem.properties && manifestItem.properties.indexOf("nav") !== -1) {
                    _navItem = manifestItem;
                }
            });

        };
        return Manifest;
    });