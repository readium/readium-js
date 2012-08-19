// Description: This object contains members used to configure the behaviour of the epub cfi library.
// REFACTORING CANDIDATE: I'm still not sure how this configuration information should be set and managed.
//   Presently, the object is declared as a literal and users will simply change parameters. Thinking, thinking..

EPUBcfi.Config = {

    // Description: This method retrieves and returns a resource, based on a URL, and returns a document object.
    // Arguments: the resource URL
    // Rationale: The intention here is that this method is overriden to use a retrieval mechanism that makes sense 
    //   for the reading system that the cfi library is being used in. 
    // REFACTORING CANDIDATE: This will be refactored to be an asynchronous call, although this will require changes 
    //   throughout the intepreter.
    retrieveResource : function (resourceURL) {

        var resource;

        $.ajax({

            type: "GET",
            url: resourceURL,
            dataType: "xml",
            async: false,
            success: function (response) {

                resource = response;
            }
        });

        return resource;
    },

    // Description: A hash of default html elements to inject, for each type of cfi terminus
    // Rationale: The intention is that a user can specify the default element to inject for each type of cfi terminus. 
    cfiMarkerElements : {

        textPointMarker : '<span class="cfi_marker"></span>'
    },

    // Description: The URL to the epub's package document. The interpreter requires this to be able to load other resources in the
    //   epub, as all URIs in epub documents are specified relative to the package document. 
    // Rationale: This is currently set as part fo the config object literal. However, this is only for simplicity during the development
    //   process. As this parameter MUST be specified, a more obvious or robust way to require the library user to specify this may be 
    //   desirable.
    packageDocumentURL : ''
};