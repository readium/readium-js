define(['require', 'module', 'jquery', 'underscore'],
    function (require, module, $, _) {

        var Manifest = function (manifestJson) {

            var manifestIndexById = {};
            var navItem;

            _.each(manifestJson, function (manifestItem) {
                manifestIndexById[manifestItem.id] = manifestItem;

                if (manifestItem.properties && manifestItem.properties.indexOf("nav") !== -1) {
                    navItem = manifestItem;
                }
            });

            this.getManifestItemByIdref = function (idref) {
                return manifestIndexById[idref];
            };

            this.getNavItem = function () {
                return navItem;
            };

        };
        return Manifest;
    });