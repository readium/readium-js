
require(["globalsSetup", "readium-plugin-annotations"], function () {

    //require(['jquery', 'Readium'], function ($, Readium) {
    require(['jquery', 'Readium', 'readium-plugin-example'], function ($, Readium, examplePluginConfig) {
        
        var readium = undefined;
        var altBook = false;
        
        if (examplePluginConfig) {
            examplePluginConfig.borderColor = "blue";
            examplePluginConfig.backgroundColor = "cyan";
        }
        
        console.log(Readium.version);

        window.navigator.epubReadingSystem.name = "readium-js-example";
        window.navigator.epubReadingSystem.version = "0.0.0";
        
        window.navigator.epubReadingSystem.readium = {};
        
        window.navigator.epubReadingSystem.readium.buildInfo = {};
        
        window.navigator.epubReadingSystem.readium.buildInfo.dateTime = Date.now().toString();
        window.navigator.epubReadingSystem.readium.buildInfo.version = "0.0.0";
        window.navigator.epubReadingSystem.readium.buildInfo.chromeVersion = undefined;
        
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
        repo2.sha = Readium.version.readiumJs.sha;
        repo2.tag = Readium.version.readiumJs.tag;
        repo2.clean = Readium.version.readiumJs.clean;
        repo2.url = "https://github.com/readium/" + repo2.name + "/tree/" + repo2.sha;
        window.navigator.epubReadingSystem.readium.buildInfo.gitRepositories.push(repo2);
        
        var repo3 = {};
        repo3.name = "readium-shared-js";
        repo3.sha = Readium.version.readiumSharedJs.sha;
        repo3.tag = Readium.version.readiumSharedJs.tag;
        repo3.clean = Readium.version.readiumSharedJs.clean;
        repo3.url = "https://github.com/readium/" + repo3.name + "/tree/" + repo3.sha;
        window.navigator.epubReadingSystem.readium.buildInfo.gitRepositories.push(repo3);

        if (Readium.version.readiumCfiJs)
        {
            var repo4 = {};
            repo4.name = "readium-cfi-js";
            repo4.sha = Readium.version.readiumCfiJs.sha;
            repo4.tag = Readium.version.readiumCfiJs.tag;
            repo4.clean = Readium.version.readiumCfiJs.clean;
            repo4.url = "https://github.com/readium/" + repo4.name + "/tree/" + repo4.sha;
            window.navigator.epubReadingSystem.readium.buildInfo.gitRepositories.push(repo4);
        }

        // Debug check:
        //console.debug(JSON.stringify(window.navigator.epubReadingSystem, undefined, 2));
        
        var readiumOptions =
        {
            jsLibRoot: "../build-output/_multiple-bundles/",
            cacheSizeEvictThreshold: undefined,
            useSimpleLoader: false, // false so we can load ZIP'ed EPUBs
            openBookOptions: {}
        };
        
        var prefix = (self.location && self.location.origin && self.location.pathname) ? (self.location.origin + self.location.pathname + "/..") : "";
        
        var readerOptions = 
        {
            needsFixedLayoutScalerWorkAround: false,
            el:"#viewport",
            annotationCSSUrl: prefix + "/annotations.css",
            mathJaxUrl: "/MathJax.js"
        };
        
        ReadiumSDK.on(ReadiumSDK.Events.PLUGINS_LOADED, function(reader) {
        
            // readium built-in (should have been require()'d outside this scope)
            console.log(reader.plugins.annotations);
            reader.plugins.annotations.initialize({annotationCSSUrl: readerOptions.annotationCSSUrl});
            reader.plugins.annotations.on("annotationClicked", function(type, idref, cfi, id) {
                console.log("ANNOTATION CLICK: " + id);
                reader.plugins.annotations.removeHighlight(id);
            });
            reader.plugins.annotations.on("textSelectionEvent", function() {
                console.log("ANNOTATION SELECT");
                reader.plugins.annotations.addSelectionHighlight(Math.floor((Math.random()*1000000)), "highlight");
            });

            // external (require()'d via Dependency Injection, see examplePluginConfig function parameter passed above)
            console.log(reader.plugins.example);
            if (reader.plugins.example) {
                
                reader.plugins.example.on("exampleEvent", function(message) {
                    console.log("Example plugin: \n" + message);
                    
                    var altBook_ = altBook;
                    altBook = !altBook;
                    
                    setTimeout(function(){
                        
                    var openPageRequest = undefined; //{idref: bookmark.idref, elementCfi: bookmark.contentCFI};
                    
                    readium.openPackageDocument(
                        altBook_ ? "EPUB/epubReadingSystem" : "EPUB/internal_link.epub",
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
            
            readium.openPackageDocument(
                "EPUB/epubReadingSystem",
                function(packageDocument, options) {
                    console.log(options.metadata.title);
                    $('#title').text(options.metadata.title);
                },
                openPageRequest
            );
        });
    });
});