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

(
function(thiz){
    
    //console.log(thiz);
    console.log(process.cwd());
    
    process._readium = {};
    
    // Path is relative to mainConfigFile[0]
    process._readium.buildOutputPath = "../../";
    
    // Path is relative to mainConfigFile[0].dir
    process._readium.sharedJsPath = "../../readium-shared-js/";
    
    return true;
}(this)
?
{
    // The order is IMPORTANT!
    // Paths are relative to this file (they are intentionally convoluted, to test the parameterized RequireJS build workflow from readium-js)
    mainConfigFile: [
    "../readium-shared-js/build-config/RequireJS_config_multiple-bundles_.js",
    "../readium-shared-js/build-config/RequireJS_config_common.js"
    ],
    
    // MUST be in root config file because of access to context-dependent 'config'
    onModuleBundleComplete: function(data) {
        console.log("========> onModuleBundleComplete");
        console.log(data.name);

        var fs = nodeRequire("fs");
    
        for (var i = 0; i < config.modules.length; i++) {

            if (config.modules[i].name !== data.name)
                continue;

            //__dirname is RequireJS node_modules bin folder
            var rootPath = process.cwd() + "/build-output/_multiple-bundles/";
            rootPath = rootPath.replace(/\\/g, '/');
            console.log(rootPath);

            var path = config.modules[i].layer.buildPathMap[config.modules[i].name];
            console.log(path);
            
            // var shortpath = path.replace(rootPath, './');
            // console.log(shortpath);
            
            // var pathConfig = {};
            // pathConfig[config.modules[i].name] = shortpath;
            
            data.includedModuleNames = [];
            
            for (var j = 0; j < data.included.length; j++) {
                
                var fullPath = rootPath + data.included[j];
                
                for (var modulePath in config.modules[i].layer.buildFileToModule) {
                    if (fullPath === modulePath) {
                        data.includedModuleNames.push(config.modules[i].layer.buildFileToModule[modulePath]);
                        break;
                    }
                }
            }
            
            var bundleConfig = {};
            bundleConfig[config.modules[i].name] = [];
            
            //for (var moduleName in config.modules[i].layer.modulesWithNames) {
            for (var j = 0; j < data.includedModuleNames.length; j++) {
                var moduleName = data.includedModuleNames[j];
                
                if (moduleName === config.modules[i].name)
                    continue;
                
                bundleConfig[config.modules[i].name].push(moduleName);
                console.log(">> " + moduleName);
            }

            fs.writeFile(
                path + ".bundles.js",
                "require.config({" +
                    //"paths: " + JSON.stringify(pathConfig) + ", " +
                    "bundles: " + JSON.stringify(bundleConfig) + "});",
                function(error) {
                    if (error) throw error;
                }
            );
        }
    }
}
:
function(){console.log("NOOP");return {};}()
)
