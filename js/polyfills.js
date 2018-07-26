const zip = (global.zip = window.zip = require("zip-js/WebContent/zip").zip);
require("zip-js/WebContent/zip-fs");

zip.Inflater = require("zip-js/WebContent/inflate").Inflater;
zip.Deflater = require("zip-js/WebContent/deflate").Deflater;
