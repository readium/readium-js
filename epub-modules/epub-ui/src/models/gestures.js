define(['jquery','jquery_hammer','hammer'], function($,jqueryHammer,Hammer){

    var gesturesHandler = function(reader,viewport){

        var nextPage = function(){
            reader.openPageRight();
        };

        var prevPage = function(){
            reader.openPageLeft();
        };

        this.initialize= function(){

            reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function(iframe,s) {
                console.debug("It's hammer time!");
                //set hammer's document root
                Hammer.DOCUMENT = iframe.contents();
                //hammer's internal touch events need to be redefined? (doesn't work without)
                Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
                Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);

                //set up the hammer gesture events
                //swiping handlers
                var swipingOptions = {prevent_mouseevents: true};
                Hammer(Hammer.DOCUMENT,swipingOptions).on("swipeleft", function() {
                    nextPage();
                });
                Hammer(Hammer.DOCUMENT,swipingOptions).on("swiperight", function() {
                    prevPage();
                });

                //remove stupid ipad safari elastic scrolling
                //TODO: test this with reader ScrollView and FixedView
                $(Hammer.DOCUMENT).on(
                    'touchmove',
                    function(e) {
                        //hack: check if we are not dealing with a scrollview
                        if(iframe.height()<=iframe.parent().height()){
                            e.preventDefault();
                        }
                    }
                );
            });

            //remove stupid ipad safari elastic scrolling (improves UX for gestures)
            //TODO: test this with reader ScrollView and FixedView
            $(viewport).on(
                'touchmove',
                function(e) {
                    e.preventDefault();
                }
            );

            //handlers on viewport
            $(viewport).hammer().on("swipeleft", function() {
                nextPage();
            });
            $(viewport).hammer().on("swiperight", function() {
                prevPage();
            });
        };

    };
    return gesturesHandler;
});