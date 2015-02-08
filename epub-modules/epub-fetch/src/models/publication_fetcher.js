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

define(['require', 'module', 'jquery', 'URIjs', './markup_parser', './plain_resource_fetcher', './zip_resource_fetcher',
    './content_document_fetcher', './resource_cache', './encryption_handler'],
    function (require, module, $, URI, MarkupParser, PlainResourceFetcher, ZipResourceFetcher, ContentDocumentFetcher,
              ResourceCache, EncryptionHandler) {

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
        var _packageDom;
        var _packageDomInitializationDeferred;
        var _publicationResourcesCache = new ResourceCache(sourceWindow, cacheSizeEvictThreshold);

		var _mediaQuery = undefined;
		var _mediaQueryEventCallback = undefined;
		
        var _contentDocumentTextPreprocessor = contentDocumentTextPreprocessor;
		var _renditionSelection = renditionSelection;

        this.markupParser = new MarkupParser();

        this.initialize =  function(callback) {

            var isEpubExploded = isExploded();

            // Non exploded EPUBs (i.e. zipped .epub documents) should be fetched in a programmatical manner:
            _shouldConstructDomProgrammatically = !isEpubExploded;
            createResourceFetcher(isEpubExploded, callback);
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

        function isExploded() {

            var ext = ".epub";
            return bookRoot.indexOf(ext, bookRoot.length - ext.length) === -1;
        }

        function createResourceFetcher(isExploded, callback) {
            if (isExploded) {
                console.log('using new PlainResourceFetcher');
                _resourceFetcher = new PlainResourceFetcher(self, bookRoot);
                _resourceFetcher.initialize(function () {
                    callback(_resourceFetcher);
                });
                return;
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
            return _resourceFetcher.getPackageUrl();
        };

        this.fetchContentDocument = function (attachedData, loadedDocumentUri, contentDocumentResolvedCallback, errorCallback) {

            // Resources loaded for previously fetched document no longer need to be pinned:
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

        this.getPackageFullPath = function(callback, onerror) {
            self.getXmlFileDom('META-INF/container.xml', function (containerXmlDom) {
                var packageFullPath = self.getRootFile(containerXmlDom);
                callback(packageFullPath);
            }, onerror);
        };

        this.getRootFile = function(containerXmlDom) {
			//console.debug(containerXmlDom.documentElement.innerHTML);
		
			//console.debug("_renditionSelectionrenditionMedia: ", _renditionSelection.renditionMedia);
			console.debug("_renditionSelection.renditionLayout: ", _renditionSelection.renditionLayout);
			console.debug("_renditionSelection.renditionLanguage: ", _renditionSelection.renditionLanguage);
			console.debug("_renditionSelection.renditionAccessMode: ", _renditionSelection.renditionAccessMode);
			
			
            var rootFiles = $('rootfile', containerXmlDom);
			//console.debug(rootFiles);
			
			
			var rootFile = undefined;
			if (rootFiles.length == 1 || !_renditionSelection) {
				rootFile = rootFiles;
			} else {
				
				for (var i = rootFiles.length - 1; i >= 0; i--) {
					
					console.debug("----- ROOT FILE #" + i);
					
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
							if (_renditionSelection.renditionMediaQueryCallback) {
								_renditionSelection.renditionMediaQueryCallback();
							}
						};
						
						_mediaQuery.addListener(_mediaQueryEventCallback);
						
						if (!_mediaQuery.matches) {
							console.debug("=== EJECTED: renditionMedia");
							
							selected = selected && false;
							//continue;
						}
					}
					
					if (_renditionSelection.renditionLayout && _renditionSelection.renditionLayout !== "" && renditionLayout && renditionLayout !== "") {
						if (_renditionSelection.renditionLayout !== renditionLayout) {
							console.debug("=== EJECTED: renditionLayout");
							
							selected = selected && false;
							//continue;
						}
					}
					
					if (_renditionSelection.renditionLanguage && _renditionSelection.renditionLanguage !== "" && renditionLanguage && renditionLanguage !== "") {
						
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
					
					if (_renditionSelection.renditionAccessMode && _renditionSelection.renditionAccessMode !== "" && renditionAccessMode && renditionAccessMode !== "") {
						if (_renditionSelection.renditionAccessMode !== renditionAccessMode) {
							console.debug("=== EJECTED: renditionAccessMode");
							
							selected = selected && false;
							//continue;
						}
					}
					
					if (selected) {
						rootFile = rf;
						break;
					}
				}
				
				if (!rootFile) {
					// fallback to index zero ... is that a valid interpretation of the EPUB3 specification??
					// See Processing Model:
					//http://www.idpf.org/epub/renditions/multiple/epub-multiple-renditions.html#h.4n44azuq1490
					
					rootFile = $(rootFiles[0]);
				}
			}
			
            var packageFullPath = rootFile.attr('full-path');
            
			return packageFullPath;
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
                    self.getPackageFullPath(function (packageFullPath) {
                        _packageFullPath = packageFullPath;
                        self.getXmlFileDom(packageFullPath, function (packageDom) {
                            _packageDom = packageDom;
                            _packageDomInitializationDeferred.resolve(packageDom);
                            _packageDomInitializationDeferred = undefined;
                        })
                    }, onerror);
                }
            }
        };

        this.convertPathRelativeToPackageToRelativeToBase = function (relativeToPackagePath) {
            return new URI(relativeToPackagePath).absoluteTo(_packageFullPath).toString();
        };

        this.relativeToPackageFetchFileContents = function(relativeToPackagePath, fetchMode, fetchCallback, onerror) {

            if (! onerror) {
                onerror = _handleError;
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
                fetchFunction = _resourceFetcher.fetchFileContentsData64Uri;
            }
            fetchFunction.call(_resourceFetcher, pathRelativeToEpubRoot, fetchCallback, onerror);
        };



        this.getRelativeXmlFileDom = function (filePath, callback, errorCallback) {
            self.getXmlFileDom(self.convertPathRelativeToPackageToRelativeToBase(filePath), callback, errorCallback);
        };

        function readEncriptionData(callback) {
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
        }

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
