
require(["readium_shared_js/globalsSetup", "readium_shared_js/globals"], function (GlobalsSetup, Globals) {
    
    
    // TODO: unfortunately this is not a reliable method to discover AMD module availability with RequireJS, because:
    // 1) Almond does not implement .specified() and/or .defined()
    // 2) Package names always return false?
    // PS: not a blocking issue, just something to consider improving
    if (!require.specified) {
        console.log("!require.specified => using RequireJS-Almond as AMD loader?");
    }
    if (!require.defined) {
        console.log("!require.defined => using RequireJS-Almond as AMD loader?");
    }
    
    if (require.specified && require.specified('readium_plugin_highlights')) {    
    //if (require.specified && require.specified('readium_plugin_highlights/main')) {
    //if (require.specified && require.specified('readium_shared_js/plugins/highlights/main') {
    
        //alert("readium_plugin_highlights");
        require(['readium_plugin_highlights'], function (pluginConfig) {
            console.log("readium_plugin_highlights:");
            console.debug(pluginConfig);
        });   
    }

    if (require.specified && require.specified('readium_plugin_example')) {
    //if (require.specified && require.specified('readium_plugin_example/main')) {
    //if (require.specified && require.specified('readium_shared_js/plugins/example/main')) {
    
        //alert("readium_plugin_example");
          require(['readium_plugin_example'], function (examplePluginConfig) {
                console.log("readium_plugin_example:");
                console.debug(examplePluginConfig);
              
                examplePluginConfig.borderColor = "blue";
                examplePluginConfig.backgroundColor = "cyan";
          });
    }



    //require(['jquery', 'Readium'], function ($, Readium) {
    require(['jquery', 'readium_js/Readium'], function ($, Readium) {

        var readium = undefined;
        var altBook = false;

        var readiumOptions =
        {
            jsLibRoot: "../build-output/",
            cacheSizeEvictThreshold: undefined,
            useSimpleLoader: false, // false so we can load ZIP'ed EPUBs
            openBookOptions: {}
        };

              Readium.getVersion(function(version){

            console.log(version);

            window.navigator.epubReadingSystem.name = "readium-js test example demo";
            window.navigator.epubReadingSystem.version = version.readiumJs.version;

            window.navigator.epubReadingSystem.readium = {};

            window.navigator.epubReadingSystem.readium.buildInfo = {};

            window.navigator.epubReadingSystem.readium.buildInfo.dateTime = version.readiumJs.timestamp;
            window.navigator.epubReadingSystem.readium.buildInfo.version = version.readiumJs.version;
            window.navigator.epubReadingSystem.readium.buildInfo.chromeVersion = version.readiumJs.chromeVersion;

            window.navigator.epubReadingSystem.readium.buildInfo.gitRepositories = [];

            // var repo1 = {};
            // repo1.name = "readium-js-viewer";
            // repo1.sha = version.viewer.sha;
            // repo1.tag = version.viewer.tag;
            // repo1.clean = version.viewer.clean;
            // repo1.url = "https://github.com/readium/" + repo1.name + "/tree/" + repo1.sha;
            // window.navigator.epubReadingSystem.readium.buildInfo.gitRepositories.push(repo1);

            var repo2 = {};
            repo2.name = "readium-js";
            repo2.sha = version.readiumJs.sha;
            repo2.version = version.readiumJs.version;
            repo2.tag = version.readiumJs.tag;
            repo2.branch = version.readiumJs.branch;
            repo2.clean = version.readiumJs.clean;
            repo2.release = version.readiumJs.release;
            repo2.timestamp = version.readiumJs.timestamp;
            repo2.url = "https://github.com/readium/" + repo2.name + "/tree/" + repo2.sha;
            window.navigator.epubReadingSystem.readium.buildInfo.gitRepositories.push(repo2);

            var repo3 = {};
            repo3.name = "readium-shared-js";
            repo3.sha = version.readiumSharedJs.sha;
            repo3.version = version.readiumSharedJs.version;
            repo3.tag = version.readiumSharedJs.tag;
            repo3.branch = version.readiumSharedJs.branch;
            repo3.clean = version.readiumSharedJs.clean;
            repo3.release = version.readiumSharedJs.release;
            repo3.timestamp = version.readiumSharedJs.timestamp;
            repo3.url = "https://github.com/readium/" + repo3.name + "/tree/" + repo3.sha;
            window.navigator.epubReadingSystem.readium.buildInfo.gitRepositories.push(repo3);

            if (version.readiumCfiJs)
            {
                var repo4 = {};
                repo4.name = "readium-cfi-js";
                repo4.sha = version.readiumCfiJs.sha;
                repo4.version = version.readiumCfiJs.version;
                repo4.tag = version.readiumCfiJs.tag;
                repo4.branch = version.readiumCfiJs.branch;
                repo4.clean = version.readiumCfiJs.clean;
                repo4.release = version.readiumCfiJs.release;
                repo4.timestamp = version.readiumCfiJs.timestamp;
                repo4.url = "https://github.com/readium/" + repo4.name + "/tree/" + repo4.sha;
                window.navigator.epubReadingSystem.readium.buildInfo.gitRepositories.push(repo4);
            }

            // Debug check:
            //console.debug(JSON.stringify(window.navigator.epubReadingSystem, undefined, 2));

            var origin = window.location.origin;
            if (!origin) {
                origin = window.location.protocol + '//' + window.location.host;
            }
            var prefix = (self.location && self.location.pathname && origin) ? (origin + self.location.pathname + "/..") : "";

            var readerOptions =
            {
                needsFixedLayoutScalerWorkAround: false,
                el:"#viewport",
                annotationCSSUrl: prefix + "/annotations.css",
                mathJaxUrl: "/MathJax.js"
            };

            ReadiumSDK.on(ReadiumSDK.Events.PLUGINS_LOADED, function(reader) {

                Globals.logEvent("PLUGINS_LOADED", "ON", "dev/index.js");
                
                // legacy (should be undefined / null)
                console.log(reader.plugins.annotations);
                
                // same as above, new implementation
                console.log(reader.plugins.highlights);
                
                if (reader.plugins.highlights) {
                    reader.plugins.highlights.initialize({annotationCSSUrl: readerOptions.annotationCSSUrl});
                    reader.plugins.highlights.on("annotationClicked", function(type, idref, cfi, id) {
                        console.log("ANNOTATION CLICK: " + id);
                        reader.plugins.highlights.removeHighlight(id);
                    });
                    reader.plugins.highlights.on("textSelectionEvent", function() {
                        console.log("ANNOTATION SELECT");
                        reader.plugins.highlights.addSelectionHighlight(Math.floor((Math.random()*1000000)), "highlight");
                    });
                }

                // external (require()'d via Dependency Injection, see examplePluginConfig function parameter passed above)
                console.log(reader.plugins.example);
                if (reader.plugins.example) {

                    reader.plugins.example.on("exampleEvent", function(message) {
                        console.log("Example plugin: \n" + message);

                        var altBook_ = altBook;
                        altBook = !altBook;

                        setTimeout(function(){

                        var openPageRequest = undefined; //{idref: bookmark.idref, elementCfi: bookmark.contentCFI};

                        var ebookURL = altBook_ ? "EPUB/epubReadingSystem" : "EPUB/internal_link.epub";

                        readium.openPackageDocument(
                            ebookURL,
                            function(packageDocument, options) {
                                console.log(options.metadata.title);
                                $('#title').text(options.metadata.title);
                            },
                            openPageRequest
                        );

                        }, 200);
                    });
                }
            });

            $(document).ready(function () {

                readium = new Readium(readiumOptions, readerOptions);

                var openPageRequest = undefined; //{idref: bookmark.idref, elementCfi: bookmark.contentCFI};

                var ebookURL = "EPUB/epubReadingSystem"; 

                readium.openPackageDocument(
                    ebookURL,
                    function(packageDocument, options) {
                        console.log(options.metadata.title);
                        $('#title').text(options.metadata.title);
                    },
                    openPageRequest
                );
            });
        });

    });
});
