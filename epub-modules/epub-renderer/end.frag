        var EpubRendererModule = function (elementToBindReaderTo, packageData) {

            var reader = new ReadiumSDK.Views.ReaderView({
              el: elementToBindReaderTo
            });

            // Description: The public interface
            return {

                openBook : function () { 
                    return reader.openBook(packageData);
                },
                openSpineItemElementCfi : function (idref, elementCfi) { 
                    return reader.openSpineItemElementCfi(idref, elementCfi); 
                },
                openSpineItemPage: function(idref, pageIndex) {
                    return reader.openSpineItemPage(idref, pageIndex);
                },
                openPageIndex: function(pageIndex) {
                    return reader.openPageIndex(pageIndex);
                },
                openPageRight : function () { 
                    return reader.openPageRight(); 
                },
                openPageLeft : function () { 
                    return reader.openPageLeft(); 
                },
                updateSettings : function (settingsData) {
                    return reader.updateSettings(settingsData);
                },
                bookmarkCurrentPage : function () {
                    return reader.bookmarkCurrentPage();
                }
            };
        };
        return EpubRendererModule;
});