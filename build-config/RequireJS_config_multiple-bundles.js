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
    
    process._readium.baseUrl__readium_js = "../js";
    
    process._readium.path__readium_js = "..";
    
    
    process._readium.baseUrl__readium_shared_js = "../js";
    
    process._readium.path__readium_shared_js = "../readium-shared-js";
    
    
    process._readium.baseUrl__readium_cfi_js = "../js";
    
    process._readium.path__readium_cfi_js = "../readium-shared-js/readium-cfi-js";
    
    return true;
}(this)
?
{
    baseUrl: process._readium.baseUrl__readium_js,
    
    mainConfigFile: [
    "../readium-shared-js/readium-cfi-js/build-config/RequireJS_config_multiple-bundles_.js",
    "../readium-shared-js/readium-cfi-js/build-config/RequireJS_config_common.js",
    
    "../readium-shared-js/build-config/RequireJS_config_multiple-bundles_.js",
    "../readium-shared-js/build-config/RequireJS_config_common.js",
    
    "RequireJS_config_common.js",
    "RequireJS_config_multiple-bundles_.js",
    ],
    
    // MUST be in root config file because of access to context-dependent 'config'
    onModuleBundleComplete: function(data) {
        
        //console.log(process.cwd());
        var filePath = process.cwd() + "/readium-shared-js/build-config/RequireJS_config_multiple-bundles_onModuleBundleComplete.js";
        
        var fs = nodeRequire("fs");
        fs.readFile(
            filePath,
            {encoding: 'utf-8'},
            function(err, fileContents) {
                if (!err) {
                    var func = eval("("+fileContents+")");
                    return func(data);
                } else {
                    console.log(err);
                }
            }
        );
    }
}
:
function(){console.log("NOOP");return {};}()
)
