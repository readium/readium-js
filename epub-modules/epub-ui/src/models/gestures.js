define(['jquery','jquery_hammer','hammer'], function($,jqueryHammer,Hammer){

    var gesturesHandler = function(reader){

        this.initialize= function(){
            reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function(iframe,s) {
                console.debug("It's hammer time!");
                //set hammer's document root
                Hammer.DOCUMENT = iframe.contents();
                //hammer's internal touch events need to be redefined? (doesn't work without)
                Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_MOVE, Hammer.detection.detect);
                Hammer.event.onTouch(Hammer.DOCUMENT, Hammer.EVENT_END, Hammer.detection.detect);
                //set up the hammer gesture events

                //swiping
                var swipingOptions = {prevent_mouseevents: true};
                Hammer(Hammer.DOCUMENT,swipingOptions).on("swipeleft", function() {
                    reader.openPageRight();
                });
                Hammer(Hammer.DOCUMENT,swipingOptions).on("swiperight", function() {
                    reader.openPageLeft();
                });

                //remove stupid ipad safari elastic scrolling
                //TODO: test this with reader ScrollView
                $(Hammer.DOCUMENT).bind(
                    'touchmove',
                    function(e) {
                        e.preventDefault();
                    }
                );
            });
        };

    };
    return gesturesHandler;
});