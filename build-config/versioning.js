
var args = process.argv.slice(2);

console.log("versioning.js arguments: ");
console.log(args);

console.log(process.cwd());
//process.exit(-1);

var git = require('gift');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var path_readiumJS = process.cwd();
var path_readiumSharedJS = path.join(path_readiumJS, '/readium-shared-js');
var path_readiumCfiJS = path.join(path_readiumSharedJS, '/readium-cfi-js');

var repoVersions = {
    readiumJs: {
        sha: "??",
        tag: "??",
        clean: "??",
        path: path_readiumJS
    },
    readiumSharedJs: {
        sha: "??",
        tag: "??",
        clean: "??",
        path: path_readiumSharedJS
    },
    readiumCfiJs: {
        sha: "??",
        tag: "??",
        clean: "??",
        path: path_readiumCfiJS
    }
};

var repos = [];
for (var repo in repoVersions) {
    
    repos.push({
        name: repo,
        path: repoVersions[repo].path,
        versionInfo: repoVersions[repo]
    });
    
    repoVersions[repo].path = undefined;
}

var nextRepo = function(i) {
    
    if (i >= repos.length) {

        var str = JSON.stringify(repoVersions);
        
        for (var i = 0; i < args.length; i++) {
            fs.writeFileSync(path.join(process.cwd(), '/') + args[i], str);
        }
        
        return;
    }
    
    var repoPath = repos[i].path;
    console.log("\n\n>> Versioning: " + repoPath);
    
    var repoGit = git(repoPath);
    
    repoGit.current_commit(function(err, commit) {
        if (err) {
            console.log("ERROR: 'current_commit'");
            console.log(err);
        }
        
        var repoCommit = commit.id;
        console.log("SHA: " + repoCommit);

        repoGit.status(function(err, status){
            if (err) {
                console.log("ERROR: 'status'");
                console.log(err);
            }
            
            var repoIsClean = status.clean;
            console.log("Clean: " + repoIsClean);
        
            repoVersions[repos[i].name]
            //repos[i].versionInfo
            = {
                sha: repoCommit,
                tag: "",
                clean : repoIsClean
            };
            
            var cmd = "git --git-dir=\""
                        + path.join(repoPath, ".git")
                        + "\" describe --tags --long "   //   "\" name-rev --tags --name-only "
                        + repoCommit;
            
            exec(cmd,
                { cwd: repoPath },
                function(err, stdout, stderr) {
                    if (err) {
                        console.log("ERROR: 'git describe'");
                        console.log(cmd);
                        console.log(err);
                    }
                    if (stderr) {
                        console.log(stderr);
                    }
                    if (stdout) {
                        var tag = stdout.trim();
                        console.log("Tag: " + tag);
        
                        repoVersions[repos[i].name].tag
                        //repos[i].versionInfo.tag
                        = tag;
                    }
                    
                    nextRepo(++i);
                }
            );
        });
    });
}

nextRepo(0);
