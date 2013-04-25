// REFACTORING CANDIDATE: Need a better name for this
EpubReflowable.ReflowableLayout = Backbone.Model.extend({

    initialize: function (options) {
        // make sure we have proper vendor prefixed props for when we need them
    },

    // ------------------------------------------------------------------------------------ //
    //  "PUBLIC" METHODS (THE API)                                                          //
    // ------------------------------------------------------------------------------------ //

    initializeContentDocument : function (epubContentDocument, epubCFIs, currSpinePosition, readiumFlowingContent, linkClickHandler, handlerContext, currentTheme, flowingWrapper, readiumFlowingContent, keydownHandler, bindings) {

        var triggers;
        var lastPageElementId = this.injectCFIElements(
            epubContentDocument, 
            epubCFIs, 
            currSpinePosition
            );

        // this.applyBindings( readiumFlowingContent, epubContentDocument );
        this.applySwitches( epubContentDocument, readiumFlowingContent ); 
        // this.injectMathJax(epubContentDocument);
        this.injectLinkHandler(epubContentDocument, linkClickHandler, handlerContext);
        triggers = this.parseTriggers(epubContentDocument);
        this.applyTriggers(epubContentDocument, triggers);
        $(epubContentDocument).attr('title');//, Acc.page + ' - ' + Acc.title);

        this.injectTheme(
            currentTheme, 
            epubContentDocument, 
            flowingWrapper
        );

        this.injectKeydownHandler(
            readiumFlowingContent, 
            keydownHandler, 
            handlerContext
        );

        return lastPageElementId;
    },

    injectTheme : function (currentTheme, epubContentDocument, flowingWrapper) {

        var theme = currentTheme;
        if (theme === "default") {
            theme = "default-theme";
        }

        $(epubContentDocument).css({
            "color": this.themes[theme]["color"],
            "background-color": this.themes[theme]["background-color"]
        });
        
        // stop flicker due to application for alternate style sheets
        // just set content to be invisible
        $(flowingWrapper).css("visibility", "hidden");
        this.activateEPubStyle(epubContentDocument, currentTheme);

        // wait for new stylesheets to parse before setting back to visible
        setTimeout(function() {
            $(flowingWrapper).css("visibility", "visible"); 
        }, 100);
    },

    resetEl : function (epubContentDocument, flowingWrapper, spineDivider, zoomer) {

        $("body", epubContentDocument).removeClass("apple-fixed-layout");
        $(flowingWrapper).attr("style", "");
        $(flowingWrapper).toggleClass("two-up", false);
        $(spineDivider).toggle(false);
        // zoomer.reset();

        $(flowingWrapper).css({
            "position": "relative",
            "right": "0px", 
            "top": "0px",
            "-webkit-transform": "scale(1.0) translate(0px, 0px)"
        });
    },

    // ------------------------------------------------------------------------------------ //
    //  PRIVATE HELPERS                                                                     //
    // ------------------------------------------------------------------------------------ //

    // Description: Activates a style set for the ePub, based on the currently selected theme. At present, 
    //   only the day-night alternate tags are available as an option.  
    activateEPubStyle : function (bookDom, currentTheme) {

        var selector;
        
        // Apply night theme for the book; nothing will be applied if the ePub's style sheets do not contain a style
        // set with the 'night' tag
        if (currentTheme === "night-theme") {

            selector = new EpubReflowable.AlternateStyleTagSelector;
            bookDom = selector.activateAlternateStyleSet(["night"], bookDom);

        }
        else {

            selector = new EpubReflowable.AlternateStyleTagSelector;
            bookDom = selector.activateAlternateStyleSet([""], bookDom);
        }
    },

    injectCFIElements : function (epubContentDocument, epubCFIs, currSpinePosition) {

        var that = this;
        var contentDocument;
        var epubCFIs;
        var lastPageElementId;

        // Get the content document (assumes a reflowable publication)
        contentDocument = epubContentDocument;

        // TODO: Could check to make sure the document returned from the iframe has the same name as the 
        //   content document specified by the href returned by the CFI.

        // Inject elements for all the CFIs that reference this content document
        epubCFIs = epubCFIs; // What is this about? 
        _.each(epubCFIs, function (cfi, key) {

            if (cfi.contentDocSpinePos === currSpinePosition) {

                try {
                    
                    EPUBcfi.Interpreter.injectElement(
                        key,
                        contentDocument.parentNode,
                        cfi.payload,
                        ["cfi-marker", "audiError"],
                        [],
                        ["MathJax_Message"]);

                    if (cfi.type === "last-page") {
                        lastPageElementId = $(cfi.payload).attr("id");
                    }
                } 
                catch (e) {

                    console.log("Could not inject CFI");
                }
            }
        });

        // This will be undefined unless there is a "last-page" element injected into the page
        return lastPageElementId;
    },

    // // REFACTORING CANDIDATE: It looks like this could go on the package document itself
    // getBindings: function (packageDocument) {
    //     var packDoc = packageDocument;
    //     var bindings = packDoc.get('bindings');
    //     return bindings.map(function(binding) {
    //         binding.selector = 'object[type="' + binding.media_type + '"]';
    //         binding.url = packDoc.getManifestItemById(binding.handler).get('href');
    //         binding.url = packDoc.resolveUri(binding.url);
    //         return binding;
    //     })
    // },

    // Binding expected by this:
    //   binding.selector
    //   binding.url
    //   binding.media_type
    // applyBindings: function (readiumFlowingContent, epubContentDocument, bindings) {

    //     var bindingHtml = "<iframe scrolling='no' \
    //                             frameborder='0' \
    //                             marginwidth='0' \
    //                             marginheight='0' \
    //                             width='100%' \
    //                             height='100%' \
    //                             class='binding-sandbox'> \
    //                        </iframe>";

    //     // var bindings = this.getBindings(packageDocument);
    //     var i = 0;
    //     for(var i = 0; i < bindings.length; i++) {
    //         $(bindings[i].selector, epubContentDocument.parentNode).each(function() {
    //             var params = [];
    //             var $el = $(readiumFlowingContent);
    //             var data = $el.attr('data');
    //             var url;
    //             // params.push("src=" + packageDocument.resolveUri(data)); // Not sure what this is doing
    //             params.push('type=' + bindings[i].media_type);
    //             url = bindings[i].url + "?" + params.join('&');
    //             // var content = $(bindingTemplate({}));
    //             var content = $(bindingHtml);
    //             // must set src attr separately
    //             content.attr('src', url);
    //             $el.html(content);
    //         });
    //     }
    // },

    applyTriggers: function (epubContentDocument, triggers) {
        for(var i = 0 ; i < triggers.length; i++) {
            triggers[i].subscribe(epubContentDocument.parentNode);
        }
    },

    // Description: For reflowable content we only add what is in the body tag.
    //   Lots of times the triggers are in the head of the dom
    parseTriggers: function (epubContentDocument) {
        var triggers = [];
        $('trigger', epubContentDocument.parentNode).each(function() {
            
            triggers.push(new EpubReflowable.Trigger(epubContentDocument.parentNode) );
        });
        
        return triggers;
    },

    // Description: Parse the epub "switch" tags and hide
    //   cases that are not supported
    applySwitches: function (epubContentDocument, readiumFlowingContent) {

        // helper method, returns true if a given case node
        // is supported, false otherwise
        var isSupported = function(caseNode) {

            var ns = caseNode.attributes["required-namespace"];
            if(!ns) {
                // the namespace was not specified, that should
                // never happen, we don't support it then
                console.log("Encountered a case statement with no required-namespace");
                return false;
            }
            // all the xmlns's that readium is known to support
            // TODO this is going to require maintanence
            var supportedNamespaces = ["http://www.w3.org/1998/Math/MathML"];
            return _.include(supportedNamespaces, ns);
        };

        $('switch', epubContentDocument.parentNode).each(function(ind) {
            
            // keep track of whether or now we found one
            var found = false;

            $('case', readiumFlowingContent).each(function() {

                if( !found && isSupported(readiumFlowingContent) ) {
                    found = true; // we found the node, don't remove it
                }
                else {
                    $(readiumFlowingContent).remove(); // remove the node from the dom
                }
            });

            if(found) {
                // if we found a supported case, remove the default
                $('default', readiumFlowingContent).remove();
            }
        })
    },

    // inject mathML parsing code into an iframe
    injectMathJax: function (epubContentDocument) {

        var doc, script, head;
        doc = epubContentDocument.parentNode;
        head = doc.getElementsByTagName("head")[0];
        // if the content doc is SVG there is no head, and thus
        // mathjax will not be required
        if(head) {
            script = doc.createElement("script");
            script.type = "text/javascript";
            script.src = MathJax.Hub.config.root+"/MathJax.js?config=readium-iframe";
            head.appendChild(script);
        }
    },

    injectLinkHandler: function (epubContentDocument, linkClickHandler, handlerContext) {

        $('a', epubContentDocument).click(function (e) {
            linkClickHandler.call(handlerContext, e);
        });
    },

    injectKeydownHandler : function (readiumFlowingContent, keydownHandler, handlerContext) {

        $(readiumFlowingContent).contents().keydown(function (e) {
            keydownHandler.call(handlerContext, e);
        });
    },

    // Rationale: sadly this is just a reprint of what is already in the
    //   themes stylesheet. It isn't very DRY but the implementation is
    //   cleaner this way
    themes: {
        "default-theme": {
            "background-color": "white",
            "color": "black",
            "mo-color": "#777"
        },

        "vancouver-theme": {
            "background-color": "#DDD",
            "color": "#576b96",
            "mo-color": "#777"
        },

        "ballard-theme": {
            "background-color": "#576b96",
            "color": "#DDD",
            "mo-color": "#888"
        },

        "parchment-theme": {
            "background-color": "#f7f1cf",
            "color": "#774c27",
            "mo-color": "#eebb22"
        },

        "night-theme": {
            "background-color": "#141414",
            "color": "white",
            "mo-color": "#666"
        }
    }
});