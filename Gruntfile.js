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

module.exports = function(grunt) {
    //"use strict"; 
    //This is disabled because it's picking up octal literal notation that is quoted in a string.
    
    //usage: grunt [server | watch | (--minify &| --syncload)]
    //server: Start a testing server for the website.
    //watch: Automatically recompile part of the project when files are changed.
    //--minify: Compress the build. (Has no effect when server option in use.)

    
    // Compile a list of paths and output files for our modules for requirejs to compile.
    // TODO: Translate the command-line code to this.

    grunt.registerTask('versioning', function(){

        var done = this.async();
        var git = require('gift'),
            fs = require('fs');

        var sharedJsPath = 'epub-modules/epub-renderer/src/readium-shared-js';

        var readiumSharedJsRepo = git(sharedJsPath);
        readiumSharedJsRepo.current_commit(function(err, commit){
            var sharedCommit = commit.id,
                sharedIsClean;

            readiumSharedJsRepo.status(function(err, status){
                sharedIsClean = status.clean;

                var readiumJsRepo = git('.');

                readiumJsRepo.current_commit(function(err, commit){
                    var commit = commit.id,
                        isClean;

                    readiumJsRepo.status(function(err, status){
                        isClean = status.clean;

                        var obj = {
                            readiumJs : {
                                sha: commit,
                                tag: "",
                                clean : isClean
                            },
                            readiumSharedJs : {
                                sha: sharedCommit,
                                tag: "",
                                clean : sharedIsClean
                            }
                        };
                        
                        var path = require('path');
                        //var cmd = "git --git-dir='" + process.cwd() + "/.git' name-rev --tags --name-only " + commit;
                        var cmd = "git --git-dir=\"" + path.join(process.cwd(), ".git") + "\" describe --tags --long " + commit;
                        grunt.log.writeln(cmd);
                        
                        var exec = require('child_process').exec;
                        exec(cmd,
                            { cwd: process.cwd() },
                            function(err, stdout, stderr) {
                                if (err) {
                                    grunt.log.writeln(err);
                                }
                                if (stderr) {
                                    grunt.log.writeln(stderr);
                                }
                                if (stdout) {
                                    grunt.log.writeln(stdout);
                    
                                    obj.readiumJs["tag"] = stdout.trim();
                                }
                                
                                var sharedJsCwd = path.join(process.cwd(), sharedJsPath);
                                //cmd = "git --git-dir='" + process.cwd() + "/" + sharedJsPath + "/.git' name-rev --tags --name-only " + sharedCommit;
                                cmd = "git --git-dir=\"" + path.join(sharedJsCwd, ".git") + "\" describe --tags --long " + sharedCommit;
                                grunt.log.writeln(cmd);
                                exec(cmd,
                                    { cwd: sharedJsCwd },
                                    function(err, stdout, stderr) {
                                        if (err) {
                                            grunt.log.writeln(err);
                                        }
                                        if (stderr) {
                                            grunt.log.writeln(stderr);
                                        }
                                        if (stdout) {
                                            grunt.log.writeln(stdout);

                                            obj.readiumSharedJs["tag"] = stdout.trim();
                                        }

                                        fs.writeFileSync('./version.json', JSON.stringify(obj));
                                        done();
                                    }
                                );
                            }
                        );
                    })
                });
            });

        });
    });

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
        },


    });
    

    require('load-grunt-tasks')(grunt);
    
    grunt.registerTask('default', ['versioning', 'requirejs']);

};
