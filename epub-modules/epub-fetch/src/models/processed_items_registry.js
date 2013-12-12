define(function () {

        var ProcessedItemsRegistry = function () {

            var self = this;
            var _itemsHash = {};

            this.isProcessed = function (itemString) {
                return itemString in _itemsHash;
            };

            this.markProcessed = function (itemString) {
                _itemsHash[itemString] = true;
            };
        };

        return ProcessedItemsRegistry;
    });
