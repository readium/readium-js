
require(['views/reader_view'], function (ReaderView) {

// ------- Comment above and uncomment below to demonstrate on-demand init/registration of plugin
// require(['views/reader_view', 'readium-plugin-example'], function (ReaderView, examplePluginConfig) {
    // examplePluginConfig.borderColor = "blue";
    // examplePluginConfig.backgroundColor = "cyan";
// ------- 

    ReadiumSDK.on(ReadiumSDK.Events.PLUGINS_LOADED, function() {
    
        // readium built-in (should have been require()'d outside this scope)
        console.log(ReadiumSDK.reader.plugins.annotations);
        
        // external (require()'d via Dependency Injection, see examplePluginConfig function parameter passed above)
        console.log(ReadiumSDK.reader.plugins.example);
    });
    
    $(document).ready(function () {
        

        ReadiumSDK.reader = new ReaderView(
        {
            needsFixedLayoutScalerWorkAround: false,
            el:"#viewport",
            annotationCSSUrl: undefined
        });

        //Globals.emit(Globals.Events.READER_INITIALIZED, ReadiumSDK.reader);
        ReadiumSDK.emit(ReadiumSDK.Events.READER_INITIALIZED, ReadiumSDK.reader);
    });
});