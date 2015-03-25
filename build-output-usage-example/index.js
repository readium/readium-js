
require(["globalsSetup", "readium-plugin-annotations"], function () {

    require(['Readium'], function (Readium) {

    // ------- Comment above and uncomment below to demonstrate on-demand init/registration of plugin
    // require(['views/reader_view', 'readium-plugin-example'], function (ReaderView, examplePluginConfig) {
        // examplePluginConfig.borderColor = "blue";
        // examplePluginConfig.backgroundColor = "cyan";
    // ------- 

        console.log(Readium.version);

        ReadiumSDK.on(ReadiumSDK.Events.PLUGINS_LOADED, function(reader) {
        
            // readium built-in (should have been require()'d outside this scope)
            console.log(reader.plugins.annotations);
            
            // external (require()'d via Dependency Injection, see examplePluginConfig function parameter passed above)
            console.log(reader.plugins.example);
        });
        
        $(document).ready(function () {
            
            var readiumOptions =
            {
                jsLibRoot: "../build-output/_multiple-bundles/",
                cacheSizeEvictThreshold: undefined,
                useSimpleLoader: true,
                openBookOptions: undefined
            };
            
            var readerOptions = 
            {
                needsFixedLayoutScalerWorkAround: false,
                el:"#viewport",
                annotationCSSUrl: undefined,
                mathJaxUrl: undefined
            };
            
            var readium = new Readium(readiumOptions, readerOptions);
        });
    });
});