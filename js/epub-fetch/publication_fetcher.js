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

define(['jquery', 'URIjs', './markup_parser', './plain_resource_fetcher', './zip_resource_fetcher',
    './content_document_fetcher', './resource_cache', './encryption_handler', './discover_content_type'],
    function ($, URI, MarkupParser, PlainResourceFetcher, ZipResourceFetcher, ContentDocumentFetcher,
              ResourceCache, EncryptionHandler, ContentTypeDiscovery) {

    var PublicationFetcher = function(bookRoot, jsLibRoot, sourceWindow, cacheSizeEvictThreshold, contentDocumentTextPreprocessor, renditionSelection) {

        var self = this;

        self.contentTypePackageReadStrategyMap = {
            'application/oebps-package+xml': 'exploded',
            'application/epub+zip': 'zipped',
            'application/zip': 'zipped'
        };

        var _shouldConstructDomProgrammatically;
        var _resourceFetcher;
        var _encryptionHandler;

        var _packageFullPath;
        var _packageDocumentAbsoluteUrl;
		
        var _packageDom;
        var _packageDomInitializationDeferred;
        var _publicationResourcesCache = new ResourceCache(sourceWindow, cacheSizeEvictThreshold);

		var _mediaQuery = undefined;
		var _mediaQueryEventCallback = undefined;
		
        var _contentDocumentTextPreprocessor = contentDocumentTextPreprocessor;
		var _renditionSelection = renditionSelection;

        this.markupParser = new MarkupParser();

        function isExploded() {

            var ext = ".epub";
            return bookRoot.indexOf(ext, bookRoot.length - ext.length) === -1;
        }
		
        this.initialize =  function(callback) {
            var isEpubExploded = isExploded();

            // Non exploded EPUBs (i.e. zipped .epub documents) should be fetched in a programmatical manner:
            _shouldConstructDomProgrammatically = !isEpubExploded;

            createResourceFetcher(isEpubExploded, function(resourceFetcher) {
    
                self.getPackageFullPath(
                    function(packageDocumentRelativePath, multipleRenditions) {
                        _packageFullPath = packageDocumentRelativePath;
                        _packageDocumentAbsoluteUrl = resourceFetcher.resolveURI(packageDocumentRelativePath);
                        
                        callback(resourceFetcher, multipleRenditions);
                    },
                    function(error) {
                        console.error("unable to find package document: " + error);
        
                        callback(resourceFetcher, undefined);
                    }
                );
            });
        };



        // INTERNAL FUNCTIONS

        function _handleError(err) {
            if (err) {
                if (err.message) {
                    console.error(err.message);
                }
                if (err.stack) {
                    console.error(err.stack);
                }
            }
            console.error(err);
        }


		var buildRenditionMapping = function(callback, multipleRenditions, containerXmlDom, packageFullPath, cacheOpfDom) {

			var doCallback = true;
		
			multipleRenditions.mappings = [];
				
			var linkMapping = $('link[rel=mapping]', containerXmlDom);
			if (linkMapping.length) {
				var href = linkMapping.attr("href");
				console.debug('link[rel=mapping] @href ==> ' + href);
				if (href) {
					
					var hrefParentFolder = "";
					var slashi = href.lastIndexOf("/");
					if (slashi > 0) {
						hrefParentFolder = href.substr(0, slashi);
					}
					hrefParentFolder = "/" + hrefParentFolder;
					console.debug(hrefParentFolder);
					
					doCallback = false;
					
					self.getXmlFileDom(href,
						function (mappingDom) {
							//var nav = $('nav[epub\\:type=resource-map]', mappingDom);
							//var nav = $('nav[type=resource-map]', mappingDom);
							var navs = $('nav', mappingDom);
							if (navs.length) {
								for (var i = 0; i < navs.length; i++) {
									var nav = $(navs[i]);
									
									var epubtype = nav.attr("epub:type");
									if (epubtype !== "resource-map") {
										continue;
									}
									var uls = $('ul', nav);
									for (var j = 0; j < uls.length; j++) {
										var ul = $(uls[j]);
											
										var mappingUL = [];
										multipleRenditions.mappings.push(mappingUL);
											
										var lias = $('li > a', ul);
										for (var k = 0; k < lias.length; k++) {
											var lia = $(lias[k]);
											var ahref = lia.attr("href");
											var arendition = lia.attr("epub:rendition");
											
											var mapping = {};
											mappingUL.push(mapping);
											
											mapping.href = ahref;
											mapping.rendition = arendition;
											
											var hashi = mapping.href.indexOf("#epubcfi");
											
											// this is relative to the mapping HTML doc, not to the root of the EPUB file tree
											mapping.opf = mapping.rendition;
											if (!mapping.opf) {
												if (hashi > 0) {
													var opfPath = mapping.href.substr(0, hashi);
													mapping.opf = opfPath;
												}
											}
											mapping.opf = hrefParentFolder + "/" + mapping.opf;
											
											var cfiOpfSpineItem = undefined;
											mapping.cfiFull = undefined;
											mapping.cfiPartial = undefined;
											if (hashi > 0) {
												var offset = hashi + 9;
												mapping.cfiFull = mapping.href.substr(offset, mapping.href.length-offset-1);
												cfiOpfSpineItem = mapping.cfiFull;
												
												var excli = mapping.cfiFull.indexOf("!");
												if (excli > 0) {
													var offset = excli + 1;
													mapping.cfiPartial = mapping.cfiFull.substr(offset, mapping.cfiFull.length-offset);
													cfiOpfSpineItem = mapping.cfiFull.substr(0, offset-1);
												}
											}
											
											//OPF: packageFullPath
											//MAPPING: href
											
											mapping.target = undefined;
											if (mapping.rendition) {
												// this is relative to the mapping HTML doc, not to the root of the EPUB file tree
												mapping.target = mapping.href;
												mapping.target = hrefParentFolder + "/" + mapping.target;
											} else {
												// this is relative to the root of the EPUB file tree
												
												//console.debug("cfiOpfSpineItem: " + cfiOpfSpineItem);
												var slashi = cfiOpfSpineItem.lastIndexOf("/");
												if (slashi > 0) {
													var nStr = cfiOpfSpineItem.substr(slashi + 1, 1);
													var n = parseInt(nStr);
													n = n / 2 - 1;
													// n is zero-based index of spine item child element in OPF
													
													if (mapping.opf) {
														var f = function() {
															var itemRefIndex = n;
															var thisOpfPath = mapping.opf.substr(1);
															var mapping_ = mapping;
															
															var thisOpfPathParentFolder = "";
															var slashi = thisOpfPath.lastIndexOf("/");
															if (slashi > 0) {
																thisOpfPathParentFolder = thisOpfPath.substr(0, slashi);
															}
															thisOpfPathParentFolder = "/" + thisOpfPathParentFolder;
															//console.debug(">>> " + thisOpfPathParentFolder);
															
															var processOpfDom = function(opfDom) {
															
																var itemRefs = $('itemref', opfDom);
																if (itemRefs.length) {
																	var itemRef = $(itemRefs[itemRefIndex]);
																	var idref = itemRef.attr("idref");
																	mapping_.idref = idref;
																
																	var item = $('#' + idref, opfDom);
																	if (item.length) {
																		var itemHref = item.attr("href");
																		mapping_.target = itemHref;
																		mapping_.target = thisOpfPathParentFolder + "/" + mapping_.target;
																		//console.debug(">>> " + mapping_.target);
																		//console.debug(mapping_);
																	}
																}
															};
															
															var dom = cacheOpfDom[thisOpfPath];
															if (dom) {
																//console.debug("*** CACHED OPF DOM: " + thisOpfPath);
																processOpfDom(dom);
															}
															else {
																// Async!
																// Should never occur,
																// because the cacheOpfDom array was initialised in populateCacheOpfDom(),
																// based upon renditions declared in META-INF/container.xml
																console.debug("*** PARSING OPF DOM: " + thisOpfPath);
																self.getXmlFileDom(thisOpfPath,
																	function (opfDom) {
																		cacheOpfDom[thisOpfPath] = opfDom;
																		processOpfDom(opfDom);
																	},
																	function(error) {
																	}
																);
															}
															
														}();
													}
												}
											}
											
											/*
											console.debug("============");
											console.log("- href: " + mapping.href);
											console.log("- rendition: " + mapping.rendition);
											console.log("opf: " + mapping.opf);
											console.log("cfiFull: " + mapping.cfiFull);
											console.log("cfiPartial: " + mapping.cfiPartial);
											console.log("target: " + mapping.target);
											*/
										}
									}
								}
							}
							callback(packageFullPath, multipleRenditions);
						},
						function(error) {
							callback(packageFullPath, multipleRenditions);
						}
					);
				}
			}
			
			if (doCallback) callback(packageFullPath, multipleRenditions);
		};
		
		var populateCacheOpfDom = function(i, multipleRenditions, cacheOpfDom, callback) {
		
			var next = function(j) {
				if (j < multipleRenditions.renditions.length) {
					console.debug("next populateCacheOpfDom");
					populateCacheOpfDom(j, multipleRenditions, cacheOpfDom, callback);
				} else {
					console.debug("callback populateCacheOpfDom");
					callback();
				}
			};
		
			var rendition = multipleRenditions.renditions[i];
		
			var thisOpfPath = rendition.opfPath.substr(1);
		
			if (cacheOpfDom[thisOpfPath]) {
				
				next(i+1);
				return;
			}
		
			self.getXmlFileDom(thisOpfPath,
				function (opfDom) {
					console.error("....cacheOpfDom: " + thisOpfPath);
					cacheOpfDom[thisOpfPath] = opfDom;
					
					next(i+1);
				},
				function(error) {
					next(i+1);
				}
			);
			
		};
		
        var getRootFile = function(containerXmlDom, multipleRenditions) {
			//console.debug(containerXmlDom.documentElement.innerHTML);
			
			console.debug("@@@@@@@@@@@@@@@@@@ getRootFile");
				
		
			//console.debug("_renditionSelectionrenditionMedia: ", _renditionSelection.renditionMedia);
			console.debug("_renditionSelection.renditionLayout: ", _renditionSelection.renditionLayout);
			console.debug("_renditionSelection.renditionLanguage: ", _renditionSelection.renditionLanguage);
			console.debug("_renditionSelection.renditionAccessMode: ", _renditionSelection.renditionAccessMode);
			
			
            var rootFiles = $('rootfile', containerXmlDom);
			//console.debug(rootFiles);
							
			multipleRenditions.renditions = [];
			multipleRenditions.selectedIndex = -1;
		
		
			var rootFile = undefined;
			if (rootFiles.length == 1) {
				rootFile = rootFiles;
			
				var renditionMedia = rootFile.attr('rendition:media');
				var renditionLayout = rootFile.attr('rendition:layout');
				var renditionLanguage = rootFile.attr('rendition:language');
				var renditionAccessMode = rootFile.attr('rendition:accessMode');
				
				var rendition = {};
		
				rendition.Media = renditionMedia;
				rendition.Layout = renditionLayout;
				rendition.Language = renditionLanguage;
				rendition.AccessMode = renditionAccessMode;
				rendition.Label = renditionLabel;
				
				rendition.opfPath = "/" + rootFile.attr('full-path');
				console.debug("opfPath: ", rendition.opfPath);
				
				multipleRenditions.renditions.push(rendition);
				multipleRenditions.selectedIndex = 0;
			
			} else {
				for (var i = 0; i < rootFiles.length; i++) {
					var rendition = {};
				
					rendition.Media = undefined;
					rendition.Layout = undefined;
					rendition.Language = undefined;
					rendition.AccessMode = undefined;
					rendition.Label = undefined;
					rendition.opfPath = undefined;
					
					multipleRenditions.renditions.push(rendition);
				}
				
				var selectedIndex = -1;
			
				for (var i = rootFiles.length - 1; i >= 0; i--) {
					
					console.debug("----- ROOT FILE #" + i);
					
					var rendition = multipleRenditions.renditions[i];
					
					var rf = $(rootFiles[i]);
						
					var renditionMedia = rf.attr('rendition:media');
					var renditionLayout = rf.attr('rendition:layout');
					var renditionLanguage = rf.attr('rendition:language');
					var renditionAccessMode = rf.attr('rendition:accessMode');
					
					var renditionLabel = rf.attr('rendition:label');
					
					console.debug("renditionMedia: ", renditionMedia);
					console.debug("renditionLayout: ", renditionLayout);
					console.debug("renditionLanguage: ", renditionLanguage);
					console.debug("renditionAccessMode: ", renditionAccessMode);
					
					console.debug("renditionLabel: ", renditionLabel);
					
					rendition.Media = renditionMedia;
					rendition.Layout = renditionLayout;
					rendition.Language = renditionLanguage;
					rendition.AccessMode = renditionAccessMode;
					rendition.Label = renditionLabel;
					
					rendition.opfPath = "/" + rf.attr('full-path');
					console.debug("opfPath: ", rendition.opfPath);
					
					var selected = true;
					if (renditionMedia && renditionMedia !== "" && window.matchMedia) {
						
						if (_mediaQueryEventCallback) {
							_mediaQuery.removeListener(_mediaQueryEventCallback);
							
							_mediaQueryEventCallback = undefined;
							_mediaQuery = undefined;
						}
						
						_mediaQuery = window.matchMedia(renditionMedia);
						
						_mediaQueryEventCallback = function(mq) {
							console.debug("Rendition Selection Media Query changed: " + mq.media + " (" + mq.matches + ")");
							if (mq.matches) {
								// noop
							}
							if (_renditionSelection && _renditionSelection.renditionReload) {
								_renditionSelection.renditionReload();
							}
						};
						
						_mediaQuery.addListener(_mediaQueryEventCallback);
						
						if (!_mediaQuery.matches) {
							console.debug("=== EJECTED: renditionMedia");
							
							selected = selected && false;
							//continue;
						}
					}
console.log("######################################");
console.debug(_renditionSelection);
console.log("######################################");
					if (_renditionSelection && (typeof _renditionSelection.renditionLayout !== "undefined") && renditionLayout && renditionLayout !== "") {
						if (_renditionSelection.renditionLayout !== renditionLayout) {
							console.debug("=== EJECTED: renditionLayout");
							
							selected = selected && false;
							//continue;
						}
					}
					
					if (_renditionSelection && (typeof _renditionSelection.renditionLanguage !== "undefined") && renditionLanguage && renditionLanguage !== "") {
						
						// TODO: language tag (+ script subtag) match algorithm RFC 4647 http://www.ietf.org/rfc/rfc4647.txt
						if (_renditionSelection.renditionLanguage !== renditionLanguage) {
							var langTags1 = _renditionSelection.renditionLanguage.split("-");
							var langTags2 = renditionLanguage.split("-");
							
							console.debug(langTags1[0]);
							console.debug(langTags2[0]);
							
							if (langTags1[0] !== langTags2[0]) {								
								console.debug("=== EJECTED: renditionLanguage");
									
								selected = selected && false;
								//continue;
							}
						}
					}
					
					if (_renditionSelection && (typeof _renditionSelection.renditionAccessMode !== "undefined") && renditionAccessMode && renditionAccessMode !== "") {
						if (_renditionSelection.renditionAccessMode !== renditionAccessMode) {
							console.debug("=== EJECTED: renditionAccessMode");
							
							selected = selected && false;
							//continue;
						}
					}
					
					if (selected && !rootFile) {
						rootFile = rf;
						selectedIndex = i;
						//break;
					}
				}
				
				if (!rootFile
					// first-time load, or app with no preferences at all
					|| (_renditionSelection && (typeof _renditionSelection.renditionAccessMode === "undefined") && (typeof _renditionSelection.renditionLanguage === "undefined") && (typeof _renditionSelection.renditionLayout === "undefined"))
				) {
					// fallback to index zero ... is that a valid interpretation of the EPUB3 specification??
					// See Processing Model:
					//http://www.idpf.org/epub/renditions/multiple/epub-multiple-renditions.html#h.4n44azuq1490
					
					selectedIndex = 0;
					rootFile = $(rootFiles[selectedIndex]);
				}
				
				multipleRenditions.selectedIndex = selectedIndex;
			}
			
            var packageFullPath = rootFile.attr('full-path');
			return packageFullPath;
        };
		
		
		var _multipleRenditions = undefined;
		
        this.getPackageFullPath = function(callback, onerror) {
			if (_packageFullPath) {
				callback(_packageFullPath, _multipleRenditions);
				return;
			}
			
            self.getXmlFileDom('META-INF/container.xml', function(containerXmlDom) {
				
				_multipleRenditions = {};
			
                _packageFullPath = getRootFile(containerXmlDom, _multipleRenditions);
				
				var cacheOpfDom = {};

				if (_multipleRenditions.renditions.length) {
					populateCacheOpfDom(0, _multipleRenditions, cacheOpfDom, function() {
						buildRenditionMapping(callback, _multipleRenditions, containerXmlDom, _packageFullPath, cacheOpfDom);
					});
				} else {
					buildRenditionMapping(callback, _multipleRenditions, containerXmlDom, _packageFullPath, cacheOpfDom);
				}
				
            }, onerror);
        };

        var readEncriptionData = function(callback) {
            self.getXmlFileDom('META-INF/encryption.xml', function (encryptionDom, error) {

                if(error) {
                    console.log(error);
                    console.log("Document doesn't make use of encryption.");
                    _encryptionHandler = new EncryptionHandler(undefined);
                    callback();
                }
                else {

                    var encryptions = [];


                    var encryptedData = $('EncryptedData', encryptionDom);
                    encryptedData.each(function (index, encryptedData) {
                        var encryptionAlgorithm = $('EncryptionMethod', encryptedData).first().attr('Algorithm');

                        encryptions.push({algorithm: encryptionAlgorithm});

                        // For some reason, jQuery selector "" against XML DOM sometimes doesn't match properly
                        var cipherReference = $('CipherReference', encryptedData);
                        cipherReference.each(function (index, CipherReference) {
                            var cipherReferenceURI = $(CipherReference).attr('URI');
                            console.log('Encryption/obfuscation algorithm ' + encryptionAlgorithm + ' specified for ' +
                                cipherReferenceURI);
                            encryptions[cipherReferenceURI] = encryptionAlgorithm;
                        });
                    });
                }

            });
        };
		
        function createResourceFetcher(isExploded, callback) {
            if (isExploded) {
                console.log('using new PlainResourceFetcher');
                _resourceFetcher = new PlainResourceFetcher(self, bookRoot);
                callback(_resourceFetcher);
            } else {
                console.log('using new ZipResourceFetcher');
                _resourceFetcher = new ZipResourceFetcher(self, bookRoot, jsLibRoot);
                callback(_resourceFetcher);
            }
        }

        
        // PUBLIC API

        /**
         * Determine whether the documents fetched using this fetcher require special programmatic handling.
         * (resolving of internal resource references).
         * @returns {*} true if documents fetched using this fetcher require special programmatic handling
         * (resolving of internal resource references). Typically needed for zipped EPUBs or exploded EPUBs that contain
         * encrypted resources specified in META-INF/encryption.xml.
         *
         * false if documents can be fed directly into a window or iframe by src URL without using special fetching logic.
         */
        this.shouldConstructDomProgrammatically = function (){
            return _shouldConstructDomProgrammatically;
        };

        /**
         * Determine whether the media assets (audio, video, images) within content documents require special
         * programmatic handling.
         * @returns {*} true if content documents fetched using this fetcher require programmatic fetching
         * of media assets. Typically needed for zipped EPUBs.
         *
         * false if paths to media assets are accessible directly for the browser through their paths relative to
         * the base URI of their content document.
         */
        this.shouldFetchMediaAssetsProgrammatically = function() {
            return _shouldConstructDomProgrammatically && !isExploded();
        };

        this.getBookRoot = function() {
            return bookRoot;
        };

        this.getJsLibRoot = function() {
            return jsLibRoot;
        };

        this.flushCache = function() {
            _publicationResourcesCache.flushCache();
        };

        this.cleanup = function() {
            self.flushCache();

			if (_mediaQueryEventCallback) {
				_mediaQuery.removeListener(_mediaQueryEventCallback);
				_mediaQueryEventCallback = undefined;
			}
        };

        this.getPackageUrl = function() {
            return _packageDocumentAbsoluteUrl;
        };
        
        this.getPackageFullPathRelativeToBase = function() {
              return _packageFullPath;
        };

        this.fetchContentDocument = function (attachedData, loadedDocumentUri, contentDocumentResolvedCallback, errorCallback) {

            // Resources loaded for previously fetched document no longer need to be pinned:
            // DANIEL: what about 2-page synthetic spread of fixed layout documents / spine items?
            // See https://github.com/readium/readium-js/issues/104
            _publicationResourcesCache.unPinResources();


            var contentDocumentFetcher = new ContentDocumentFetcher(self, attachedData.spineItem, loadedDocumentUri, _publicationResourcesCache, _contentDocumentTextPreprocessor);
            contentDocumentFetcher.fetchContentDocumentAndResolveDom(contentDocumentResolvedCallback, function (err) {
                _handleError(err);
                errorCallback(err);
            });
        };

        this.getFileContentsFromPackage = function(filePathRelativeToPackageRoot, callback, onerror) {

            _resourceFetcher.fetchFileContentsText(filePathRelativeToPackageRoot, function (fileContents) {
                callback(fileContents);
            }, onerror);
        };



        this.getXmlFileDom = function (xmlFilePathRelativeToPackageRoot, callback, onerror) {
            self.getFileContentsFromPackage(xmlFilePathRelativeToPackageRoot, function (xmlFileContents) {
                var fileDom = self.markupParser.parseXml(xmlFileContents);
                callback(fileDom);
            }, onerror);
        };

        this.getPackageDom = function (callback, onerror) {
            if (_packageDom) {
                callback(_packageDom);
            } else {
                // TODO: use jQuery's Deferred
                // Register all callbacks interested in initialized packageDom, launch its instantiation only once
                // and broadcast to all callbacks registered during the initialization once it's done:
                if (_packageDomInitializationDeferred) {
                    _packageDomInitializationDeferred.done(callback);
                } else {
                    _packageDomInitializationDeferred = $.Deferred();
                    _packageDomInitializationDeferred.done(callback);

                    self.getPackageFullPath(function (packageFullPath, multipleRenditions) {                        
                        self.getXmlFileDom(packageFullPath, function (packageDom) {
                            _packageDom = packageDom;
                            _packageDomInitializationDeferred.resolve(packageDom);
                            _packageDomInitializationDeferred = undefined;
                        })
                    }, onerror);
                }
            }
        };

        // Note that if the relativeToPackagePath parameter is in fact absolute
        // (starting with "/", already relative to the EPUB archive's base folder)
        // then the returned value is relativeToPackagePath.
        this.convertPathRelativeToPackageToRelativeToBase = function (relativeToPackagePath) {
            return new URI(relativeToPackagePath).absoluteTo(_packageFullPath).toString();
        };

        // Note that the relativeToPackagePath parameter can in fact be absolute
        // (starting with "/", already relative to the EPUB archive's base folder)
        // For example: /META-INF/
        this.relativeToPackageFetchFileContents = function(relativeToPackagePath, fetchMode, fetchCallback, onerror) {

            if (! onerror) {
                onerror = _handleError;
            }

            // ZIP resource fetcher does not support absolute URLs outside of the EPUB archive
            // (e.g. MathJax.js and annotations.css)
            if (//!isExploded()
                _shouldConstructDomProgrammatically // includes isExploded() and obfuscated fonts
                &&
                new URI(relativeToPackagePath).scheme() !== '') {

                  if (fetchMode === 'blob') {

                      var xhr = new XMLHttpRequest();
                      xhr.open('GET', relativeToPackagePath, true);
                      xhr.responseType = 'arraybuffer';
                      xhr.onerror = onerror;

                      xhr.onload = function (loadEvent) {
                        var blob = new Blob([xhr.response], {
                            type: ContentTypeDiscovery.identifyContentTypeFromFileName(relativeToPackagePath)
                        });
                        fetchCallback(blob);
                      };

                      xhr.send();

                  } else if (fetchMode === 'data64uri') {
                      console.error("data64uri??");
                  } else {

                      $.ajax({
                          // encoding: "UTF-8",
                          // mimeType: "text/plain; charset=UTF-8",
                          // beforeSend: function( xhr ) {
                          //     xhr.overrideMimeType("text/plain; charset=UTF-8");
                          // },
                          isLocal: false,
                          url: relativeToPackagePath,
                          dataType: 'text', //https://api.jquery.com/jQuery.ajax/
                          async: true,
                          success: function (result) {
                              fetchCallback(result);
                          },
                          error: function (xhr, status, errorThrown) {
                              console.error('Error when AJAX fetching ' + relativeToPackagePath);
                              console.error(status);
                              console.error(errorThrown);

                              // // isLocal = false with custom URI scheme / protocol results in false fail on Firefox (Chrome okay)
                              // if (status === "error" && (!errorThrown || !errorThrown.length) && xhr.responseText && xhr.responseText.length)
                              // {
                              //     console.error(xhr);
                              //     if (typeof xhr.getResponseHeader !== "undefined") console.error(xhr.getResponseHeader("Content-Type"));
                              //     if (typeof xhr.getAllResponseHeaders !== "undefined") console.error(xhr.getAllResponseHeaders());
                              //     if (typeof xhr.responseText !== "undefined") console.error(xhr.responseText);
                              //
                              //     // success
                              //     fetchCallback(xhr.responseText);
                              //     return;
                              // }

                              onerror(errorThrown);
                          }
                    });
                }

                return;
            }

            var pathRelativeToEpubRoot = decodeURIComponent(self.convertPathRelativeToPackageToRelativeToBase(relativeToPackagePath));

            // In case we received an absolute path, convert it to relative form or the fetch will fail:
            if (pathRelativeToEpubRoot.charAt(0) === '/') {
                pathRelativeToEpubRoot = pathRelativeToEpubRoot.substr(1);
            }

            var fetchFunction = _resourceFetcher.fetchFileContentsText;
            if (fetchMode === 'blob') {
                fetchFunction = _resourceFetcher.fetchFileContentsBlob;
            } else if (fetchMode === 'data64uri') {
                console.error("data64uri??");
                fetchFunction = _resourceFetcher.fetchFileContentsData64Uri;
            }
            fetchFunction.call(_resourceFetcher, pathRelativeToEpubRoot, fetchCallback, onerror);
        };



        this.getRelativeXmlFileDom = function (filePath, callback, errorCallback) {
            self.getXmlFileDom(self.convertPathRelativeToPackageToRelativeToBase(filePath), callback, errorCallback);
        };

        // Currently needed for deobfuscating fonts
        this.setPackageMetadata = function(packageMetadata, settingFinishedCallback) {

            self.getXmlFileDom('META-INF/encryption.xml', function (encryptionDom) {

                var encryptionData = EncryptionHandler.CreateEncryptionData(packageMetadata.id, encryptionDom);

                _encryptionHandler = new EncryptionHandler(encryptionData);

                if (_encryptionHandler.isEncryptionSpecified()) {
                    // EPUBs that use encryption for any resources should be fetched in a programmatical manner:
                    _shouldConstructDomProgrammatically = true;
                }

                settingFinishedCallback();


            }, function(error){

                console.log("Document doesn't make use of encryption.");
                _encryptionHandler = new EncryptionHandler(undefined);

                settingFinishedCallback();
            });
        };

        this.getDecryptionFunctionForRelativePath = function(pathRelativeToRoot) {
            return _encryptionHandler.getDecryptionFunctionForRelativePath(pathRelativeToRoot);
        }
    };

    return PublicationFetcher

});
