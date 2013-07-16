define(['require', 'module', 'jquery', 'underscore', 'backbone', './models/package_document_parser' ],
    function (require, module, $, _, Backbone, PackageDocumentParser) {

        var EpubParserModule = function (epubFetch) {

            var packageDocParser = new PackageDocumentParser({
                epubFetch: epubFetch
            });

            // Description: The public interface
            return {

                parse: function (callback) {
                    return packageDocParser.parse(callback);
                }
            };
        };
        return EpubParserModule;
    });
