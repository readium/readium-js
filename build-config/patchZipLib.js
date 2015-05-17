
var args = process.argv.slice(2);

console.log("patchZipLib.js arguments: ");
console.log(args);


console.log(process.cwd());
//process.exit(-1);

var fs = require("fs");

var filePath = process.cwd() + "/node_modules/zip-js/WebContent/zip-ext.js";

fs.readFile(
    filePath,
    {encoding: 'utf-8'},
    function(err, fileContents) {
        if (!err) {

            fileContents = fileContents.replace(
                '(request.getResponseHeader("Accept-Ranges")',
                '(true || request.getResponseHeader("Accept-Ranges")');

            // fileContents = fileContents.replace(
            //     'request.send();',
            //     'request.setRequestHeader(); request.send();');

            fs.writeFile(
                filePath,
                fileContents,
                function(error) {
                    if (error) throw error;
                }
            );
        } else {
            console.log(err);
        }
    }
);
