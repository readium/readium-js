// Description: This object contains members used to configure the behaviour of the epub cif library.
// REFACTORING CANDIDATE: Still not sure how this configuration information should be set and managed.
//   Presently, the object is declared as a literal and users will simply change parameters. Thinking, thinking..

EPUBcfi.Config = {

    // Description: This method retrieves and returns a resource, based on a URL
    // Arguments: the resource URL
    // Rationale: The intention here is that this method is overriden to use a retrieval mechanism that makes sense 
    //   for the application the CFI library is being included in. 
    // REFACTORING CANDIDATE: This should be refactored to be an asynchronous call, although this will require changes 
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

    cfiMarkerElements : {

        textPointMarker : '<span class="cfi_marker"></span>'
    },

    packageDocumentURL : ''
}