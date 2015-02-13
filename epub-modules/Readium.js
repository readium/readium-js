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


define(['require', 'text!version.json', 'console_shim', 'jquery', 'underscore', 'readerView', 'epub-fetch', 'epub-model/package_document_parser', 'epub-fetch/iframe_zip_loader', 'URIjs', 'cryptoJs'],
    function (require, versionText, console_shim, $, _, readerView, PublicationFetcher, PackageParser, IframeZipLoader, URI, cryptoJs) {

    //hack to make URI object global for readers consumption.
    window.URI = URI;

    //polyfill to support Safari 6
    if ('URL' in window === false) {
        if ('webkitURL' in window === false) {
            throw Error('Browser does not support window.URL');
        }

        window.URL = window.webkitURL;
    }

    var Readium = function(readiumOptions, readerOptions){

        var _options = { mathJaxUrl: readerOptions.mathJaxUrl };

        var _contentDocumentTextPreprocessor = function(src, contentDocumentHtml) {

            function injectedScript() {

                navigator.epubReadingSystem = window.parent.navigator.epubReadingSystem;
                window.parent = window.self;
                window.top = window.self;
            }

            var sourceParts = src.split("/");
            sourceParts.pop(); //remove source file name

            var base = "<base href=\"" + sourceParts.join("/") + "/" + "\"/>";

            var scripts = "<script type=\"text/javascript\">(" + injectedScript.toString() + ")()<\/script>";
            
            if (_options && _options.mathJaxUrl && contentDocumentHtml.indexOf("<math") >= 0) {
                scripts += "<script type=\"text/javascript\" src=\"" + _options.mathJaxUrl + "\"><\/script>";
            }

            return contentDocumentHtml.replace(/(<head.*?>)/, "$1" + base + scripts);
        };
        
        var self = this;

        var _currentPublicationFetcher;

        var jsLibRoot = readiumOptions.jsLibRoot;

        if (!readiumOptions.useSimpleLoader){
            readerOptions.iframeLoader = new IframeZipLoader(ReadiumSDK, function() { return _currentPublicationFetcher; }, _contentDocumentTextPreprocessor);
        }
        else{
            readerOptions.iframeLoader = new ReadiumSDK.Views.IFrameLoader();
        }
        

        this.reader = new ReadiumSDK.Views.ReaderView(readerOptions);

        this.openPackageDocument = function(bookRoot, callback, openPageRequest, renditionSelection)  {
            if (_currentPublicationFetcher) {
                _currentPublicationFetcher.cleanup();
            }

            var cacheSizeEvictThreshold = null;
            if (readiumOptions.cacheSizeEvictThreshold) {
                cacheSizeEvictThreshold = readiumOptions.cacheSizeEvictThreshold;
            }

            _currentPublicationFetcher = new PublicationFetcher(bookRoot, jsLibRoot, window, cacheSizeEvictThreshold, _contentDocumentTextPreprocessor, renditionSelection);

            _currentPublicationFetcher.initialize(function() {

                var _packageParser = new PackageParser(bookRoot, _currentPublicationFetcher);

                _packageParser.parse(function(packageDocument) {
                    var openBookOptions = readiumOptions.openBookOptions || {};
                    var openBookData = $.extend(packageDocument.getSharedJsPackageData(), openBookOptions);

					var multipleRenditions = _currentPublicationFetcher.getMultipleRenditions();
					
                    if (openPageRequest) {
						
						if (multipleRenditions && openPageRequest.opfPath) {
							var rendition = multipleRenditions.renditions[multipleRenditions.selectedIndex];
							if (rendition.opfPath !== openPageRequest.opfPath) {
								console.debug("RENDITION: DIFFERENT");
								
								var nearestMapping = undefined;
									
								if (multipleRenditions.mappings) {
								
									var cfiTokenise = function(cfi) {
//console.log(cfi);
										var arrayOfIndices = [];
										
										var split = cfi.split("/");
										for (var i = 0; i < split.length; i++) {
											var token = split[i];
											var j = token.indexOf("[");
											if (j > 0) {
												token = token.substr(0, token.length - j);
											}
											j = token.indexOf("@");
											if (j > 0) {
												token = token.substr(0, token.length - j);
											}
											if (!token.length) continue;
											
											var index = parseInt(token);
//console.log(index);
											arrayOfIndices.push(index);
										}

										return arrayOfIndices;
									};
									
									// cfi1 <= cfi2
									var cfiIsBeforeOrEqual = function(cfi1, cfi2) {
										
										var i = 0;
										while (i < cfi1.length && i < cfi2.length) {
											if (cfi1[i] > cfi2[i]) return false;
											i++;
										}

										return true;
									};
								
									console.log("ADJUSTING READING LOCATION");
									console.debug(openPageRequest.elementCfi);
									var cfi2 = cfiTokenise(openPageRequest.elementCfi);

									for (var i = 0; i < multipleRenditions.mappings.length; i++) {
										var mappingUL = multipleRenditions.mappings[i];
										
										for (var j = 0; j < mappingUL.length; j++) {
											var mapping = mappingUL[j];
											
											if (openPageRequest.opfPath === mapping.opf && openPageRequest.idref === mapping.idref) {
												var cfi1 = cfiTokenise(mapping.cfiPartial);
												if (nearestMapping) {
													var cfi3 = cfiTokenise(nearestMapping.cfiPartial);
													if (cfiIsBeforeOrEqual(cfi1, cfi3)) {
														break;
													}
												}
												if (cfiIsBeforeOrEqual(cfi1, cfi2)) {
													
													for (var k = 0; k < mappingUL.length; k++) {
														var m = mappingUL[k];
														if (rendition.opfPath === m.opf) {
															nearestMapping = m;
															break;
														}
													}
													
													break;
												}
											}
											
											//mapping.opf
											//openPageRequest.opfPath
											
											//mapping.idref
											//openPageRequest.idref
											
											//mapping.cfiPartial
											//openPageRequest.elementCfi
										}
									}
								}
								if (nearestMapping) {
				console.log("FOUND!");
				console.debug(nearestMapping);
									var elCfi = nearestMapping.cfiPartial;
									var split = elCfi.split("/");
									var lastIndex = split[split.length-1];
									var l = lastIndex.indexOf("@");
									if (l > 0) {
										lastIndex = lastIndex.substr(0, lastIndex.length-l);
									}
									
									var isOdd = (lastIndex % 2) == 1;
									if (isOdd) {
										elCfi = "";
										for (var k = 0; k < split.length-1; k++) {
											var index = split[k];
											if (!index.length) continue;
											elCfi += ("/" + index);
										}
										
				console.debug("ODD: "+elCfi);
									}
									
									var l = elCfi.indexOf("@");
									if (l < 0) {
										elCfi += "@0:0";
									}
									
									openPageRequest.opfPath = nearestMapping.opf;
									openPageRequest.idref = nearestMapping.idref;
									openPageRequest.elementCfi = elCfi;
								} else {
									openPageRequest = undefined;
								}
							} else {
								console.debug("RENDITION: SAME");
							}
						}
						
console.debug(JSON.stringify(openPageRequest));
                        openBookData.openPageRequest = openPageRequest;
                    }
                    self.reader.openBook(openBookData);

                    var options = {
                        packageDocumentUrl: _currentPublicationFetcher.getPackageUrl(),
                        metadata: packageDocument.getMetadata(),
						multipleRenditions: multipleRenditions
                    };

                    if (callback){
                        // gives caller access to document metadata like the table of contents
                        callback(packageDocument, options);
                    }
                });
            });
        };

        this.closePackageDocument = function() {
            if (_currentPublicationFetcher) {
                _currentPublicationFetcher.cleanup();
            }
        };


        //we need global access to the reader object for automation test being able to call it's APIs
        ReadiumSDK.reader = this.reader;

        ReadiumSDK.trigger(ReadiumSDK.Events.READER_INITIALIZED, this.reader);
    };
    
    Readium.version = JSON.parse(versionText);

    return Readium;

});
