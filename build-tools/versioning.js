console.log(process.cwd());
//process.exit(-1);

var git = require('gift'),
    fs = require('fs');

var sharedJsPath = process.cwd() + '/epub-modules/epub-renderer/src/readium-shared-js';

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
                console.log(cmd);
                
                var exec = require('child_process').exec;
                exec(cmd,
                    { cwd: process.cwd() },
                    function(err, stdout, stderr) {
                        if (err) {
                            console.log(err);
                        }
                        if (stderr) {
                            console.log(stderr);
                        }
                        if (stdout) {
                            console.log(stdout);
            
                            obj.readiumJs["tag"] = stdout.trim();
                        }
                        
                        var sharedJsCwd = sharedJsPath; //path.join(process.cwd(), sharedJsPath);
                        //cmd = "git --git-dir='" + process.cwd() + "/" + sharedJsPath + "/.git' name-rev --tags --name-only " + sharedCommit;
                        cmd = "git --git-dir=\"" + path.join(sharedJsCwd, ".git") + "\" describe --tags --long " + sharedCommit;
                        console.log(cmd);
                        exec(cmd,
                            { cwd: sharedJsCwd },
                            function(err, stdout, stderr) {
                                if (err) {
                                    console.log(err);
                                }
                                if (stderr) {
                                    console.log(stderr);
                                }
                                if (stdout) {
                                    console.log(stdout);

                                    obj.readiumSharedJs["tag"] = stdout.trim();
                                }

                                fs.writeFileSync(process.cwd() + '/build-output/version.json', JSON.stringify(obj));
                            }
                        );
                    }
                );
            })
        });
    });
});