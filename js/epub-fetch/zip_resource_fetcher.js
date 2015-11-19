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

define(['jquery', 'URIjs', './discover_content_type', 'zip-ext', 'readium_shared_js/helpers'], function ($, URI, ContentTypeDiscovery, zip, Helpers) {

    var ZipResourceFetcher = function(parentFetcher, libDir) {

        var ebookURL = parentFetcher.getEbookURL();
        var ebookURL_filepath = parentFetcher.getEbookURL_FilePath();
        
        var _checkCrc32 = false;
        var _zipFs;

        var READIUM_ERROR_PREFIX = "READIUM -- ";

        // INTERNAL FUNCTIONS

        // Description: perform a function with an initialized zip filesystem, making sure that such filesystem is initialized.
        // Note that due to a race condition, more than one zip filesystem may be instantiated.
        // However, the last one to be set on the model object will prevail and others would be garbage collected later.
        function withZipFsPerform(callback, onerror) {

                    // if (!(ebookURL instanceof Blob)) 
                    // {onerror("SIMULATING ZIP LIB ERROR...");
                    // return;}
                    
            if (_zipFs) {

                callback(_zipFs, onerror);

            } else {

                if (libDir) {
                        
                    // The Web Worker requires standalone z-worker/inflate/deflate.js files in libDir (i.e. cannot be aggregated/minified/optimised in the final generated single-file build)
                    zip.useWebWorkers = true; // (true by default)
                    zip.workerScriptsPath = libDir;

                } else {
                    
                    zip.useWebWorkers = false; // (true by default)
                }

                _zipFs = new zip.fs.FS();

                if (ebookURL instanceof Blob || ebookURL instanceof File) {

                    _zipFs.importBlob(
                        ebookURL,
                        function () {  
                            callback(_zipFs, onerror);  
                        },
                        function () {
                            console.error("ZIP ERROR");
                            onerror.apply(this, arguments);
                        }
                    );  

                } else {
                        
                    _zipFs.importHttpContent(
                        ebookURL,
                        true,
                        function () {
                            callback(_zipFs, onerror);
                        },
                        function () {
                            console.error("ZIP ERROR");
                            onerror.apply(this, arguments);
                        }
                    );
                }
            }
        }

        function fetchFileContents (relativePathRelativeToPackageRoot, readCallback, onerror) {

            if (typeof relativePathRelativeToPackageRoot === 'undefined') {
                throw 'Fetched file relative path is undefined!';
            }

            withZipFsPerform(
                function (zipFs, onerror) {
                    
                    var entry = zipFs.find(relativePathRelativeToPackageRoot);

                    if (typeof entry === 'undefined' || entry === null) {
                        onerror(new Error(READIUM_ERROR_PREFIX + 'Entry ' + relativePathRelativeToPackageRoot + ' not found in zip ' + ebookURL_filepath));
                    } else {
                        if (entry.directory) {
                            onerror(new Error(READIUM_ERROR_PREFIX + 'Entry ' + relativePathRelativeToPackageRoot + ' is a directory while a file has been expected'));
                        } else {
                            readCallback(entry);
                        }
                    }
                },
                function() {
                    
                    var error = arguments ?
                        (
                            (arguments.length && (arguments[0] instanceof Error)) ?
                            arguments[0]
                            : ((arguments instanceof Error) ? arguments : undefined)
                        )
                        : undefined;
                    
                    // console.log(error);
                    // if (!error) console.log(arguments);
                    
                    var isReadiumError = error ? (error.message.indexOf(READIUM_ERROR_PREFIX) == 0) : false;
                    
                    // we fallback to Blobl for all other types of errors (not just those emanating from the zip lib, but also from the readCallback())
                    if (!isReadiumError && !(ebookURL instanceof Blob) && !(ebookURL instanceof File)) {
                        console.log("Zip lib failed to load zipped EPUB via HTTP, trying alternative HTTP fetch... (" + ebookURL + ")");
                        
                        var xhr = new XMLHttpRequest();
                        
                        //xhr.addEventListener('load', function(){});
                        
                        xhr.onreadystatechange = function(){
                            
                            //console.log("XMLHttpRequest readyState: " + this.readyState);
                            if (this.readyState != 4) return;
                            
                            var success = xhr.status >= 200 && xhr.status < 300 || xhr.status === 304;
                            if (success) {
                                ebookURL = this.response;
                                //ebookURL_filepath = Helpers.getEbookUrlFilePath(ebookURL);
                                //console.log(ebookURL_filepath);
                                
                                _zipFs = undefined;

                                if (ebookURL instanceof Blob || ebookURL instanceof File) {
                                    fetchFileContents(relativePathRelativeToPackageRoot, readCallback, onerror);
                                }
                                else {
                                    onerror(new Error("XMLHttpRequest response not Blob!?"));
                                }
                                
                                return;
                            }
                            
                            onerror(xhr.statusText);
                        };
                        xhr.open('GET', ebookURL, true);
                        xhr.responseType = 'blob';
                        xhr.send(null); 

    //                     $.get(ebookURL, function(data) {
    // console.log(typeof data);
    //                         ebookURL_filepath = Helpers.getEbookUrlFilePath(ebookURL);
    //                         //fetchFileContents(relativePathRelativeToPackageRoot, readCallback, onerror);

    //                     }).fail(function(err) {

    //                         console.log(err);
    //                         onerror.apply(this, arguments);
    //                     });
                        
                    } else {
                        onerror.apply(this, arguments);
                    }
                }
            );
        }


        // PUBLIC API

        this.resolveURI = function (pathRelativeToPackageRoot) {
                
            var pathRelativeToPackageRootUri = undefined;
            try {
                pathRelativeToPackageRootUri = new URI(pathRelativeToPackageRoot);
            } catch(err) {
                console.error(err);
                console.log(pathRelativeToPackageRoot);
            }
            if (pathRelativeToPackageRootUri && pathRelativeToPackageRootUri.is("absolute")) return pathRelativeToPackageRoot; //pathRelativeToPackageRootUri.scheme() == "http://", "https://", "data:", etc.


            var url = ebookURL_filepath;
            
            try {
                //url = new URI(relativeUrl).absoluteTo(url).search('').hash('').toString();
                url = new URI(url).search('').hash('').toString();
            } catch(err) {
                console.error(err);
                console.log(url);
            }
            
            return url + (url.charAt(url.length-1) == '/' ? "" : "/") + pathRelativeToPackageRoot;
        };

        this.fetchFileContentsText = function(relativePathRelativeToPackageRoot, fetchCallback, onerror) {

            fetchFileContents(relativePathRelativeToPackageRoot, function (entry) {
                entry.getText(fetchCallback, undefined, _checkCrc32);
            }, onerror)
        };

        this.fetchFileContentsData64Uri = function(relativePathRelativeToPackageRoot, fetchCallback, onerror) {
            fetchFileContents(relativePathRelativeToPackageRoot, function (entry) {
                entry.getData64URI(ContentTypeDiscovery.identifyContentTypeFromFileName(relativePathRelativeToPackageRoot),
                    fetchCallback, undefined, _checkCrc32);
            }, onerror)
        };

        this.fetchFileContentsBlob = function(relativePathRelativeToPackageRoot, fetchCallback, onerror) {
            var decryptionFunction = parentFetcher.getDecryptionFunctionForRelativePath(relativePathRelativeToPackageRoot);
            if (decryptionFunction) {
                var origFetchCallback = fetchCallback;
                fetchCallback = function (unencryptedBlob) {
                    decryptionFunction(unencryptedBlob, function (decryptedBlob) {
                        origFetchCallback(decryptedBlob);
                    });
                };
            }
            fetchFileContents(relativePathRelativeToPackageRoot, function (entry) {
                entry.getBlob(ContentTypeDiscovery.identifyContentTypeFromFileName(relativePathRelativeToPackageRoot), fetchCallback,
                    undefined, _checkCrc32);
            }, onerror)
        };

    };

    return ZipResourceFetcher;
});
