module.exports = function(grunt) {
    //"use strict"; 
    //This is disabled because it's picking up octal literal notation that is quoted in a string.
    
    //usage: grunt [server | watch | (--minify &| --syncload)]
    //server: Start a testing server for the website.
    //watch: Automatically recompile part of the project when files are changed.
    //--minify: Compress the build. (Has no effect when server option in use.)

    
    // Compile a list of paths and output files for our modules for requirejs to compile.
    // TODO: Translate the command-line code to this.



    grunt.initConfig({

        requirejs: {
            compile: {
                options: {
                    mainConfigFile: "rjs_require_config.js",
                    name: "Readium",
                    optimize: grunt.option('minify')?"uglify":"none",
                    out: "out/Readium" +
                        (grunt.option('syncload')?".syncload":"") +
                        (grunt.option('minify')?".min":"") + ".js",
                    include: grunt.option('syncload')?"epub-modules/readium-js/src/define-sync":undefined,
                    almond: grunt.option('minify'),
                    wrap: grunt.option('syncload')?{
                      start: "(function (root, ReadiumModuleFactory) {\nroot.Readium = ReadiumModuleFactory();\n}(this, function () {",
                      end: "var Readium = require('Readium');\nreturn Readium;\n}));",
                    }:undefined
                }
            }
        }

    });
    

    require('load-grunt-tasks')(grunt);
    
    grunt.registerTask('default', ['requirejs']);

};
