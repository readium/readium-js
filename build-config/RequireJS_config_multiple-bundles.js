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

{
    mainConfigFile: "RequireJS_config_common.js",
    
    optimize: "none",
    generateSourceMaps: true,
    preserveLicenseComments: true,
    
    dir: "../build-output/_multiple-bundles",
    modules:
    [
        {
            name: "readium-external-libs"
        },
        
        {
            name: "readium-plugin-example",
            exclude: ['globals', 'plugins-controller', 'readium-external-libs', 'readium-shared-js']
        },
        
        {
            name: "readium-plugin-annotations",
            exclude: ['globals', 'plugins-controller', 'readium-external-libs', 'readium-shared-js'],
            insertRequire: ["readium-plugin-annotations"]
        },
        
        {
            name: "readium-shared-js",
            exclude: ['readium-external-libs'],
            include: ['globals', 'plugins-controller'],
            insertRequire: ["globalsSetup"]
        }
    ],
    
    packages: [
        {
            name: "plugin-annotations",
            location: "../../plugins/annotations",
            main: "main"
        },
        {
            name: "plugin-example",
            location: "../../plugins",
            main: "example"
        }
    ]
}
