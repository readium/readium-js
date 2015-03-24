/**
 * @license RequireJS text 2.0.12 Copyright (c) 2010-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require, XMLHttpRequest, ActiveXObject,
  define, window, process, Packages,
  java, location, Components, FileUtils */

define('text',['module'], function (module) {
    

    var text, fs, Cc, Ci, xpcIsWindows,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = {},
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.12',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {}

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var modName, ext, temp,
                strip = false,
                index = name.indexOf("."),
                isRelative = name.indexOf('./') === 0 ||
                             name.indexOf('../') === 0;

            if (index !== -1 && (!isRelative || index > 1)) {
                modName = name.substring(0, index);
                ext = name.substring(index + 1, name.length);
            } else {
                modName = name;
            }

            temp = ext || modName;
            index = temp.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = temp.substring(index + 1) === "strip";
                temp = temp.substring(0, index);
                if (ext) {
                    ext = temp;
                } else {
                    modName = temp;
                }
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || uPort === port);
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config && config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config && config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName +
                    (parsed.ext ? '.' + parsed.ext : ''),
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            // Do not load if it is an empty: url
            if (url.indexOf('empty:') === 0) {
                onLoad();
                return;
            }

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                extPart = parsed.ext ? '.' + parsed.ext : '',
                nonStripName = parsed.moduleName + extPart,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + extPart) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node &&
            !process.versions['node-webkit'])) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback, errback) {
            try {
                var file = fs.readFileSync(url, 'utf8');
                //Remove BOM (Byte Mark Order) from utf8 files if it is there.
                if (file.indexOf('\uFEFF') === 0) {
                    file = file.substring(1);
                }
                callback(file);
            } catch (e) {
                if (errback) {
                    errback(e);
                }
            }
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback, headers) {
            var xhr = text.createXhr(), header;
            xhr.open('GET', url, true);

            //Allow plugins direct access to xhr headers
            if (headers) {
                for (header in headers) {
                    if (headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header.toLowerCase(), headers[header]);
                    }
                }
            }

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status || 0;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        if (errback) {
                            errback(err);
                        }
                    } else {
                        callback(xhr.responseText);
                    }

                    if (masterConfig.onXhrComplete) {
                        masterConfig.onXhrComplete(xhr, url);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                if (line !== null) {
                    stringBuffer.append(line);
                }

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    } else if (masterConfig.env === 'xpconnect' || (!masterConfig.env &&
            typeof Components !== 'undefined' && Components.classes &&
            Components.interfaces)) {
        //Avert your gaze!
        Cc = Components.classes;
        Ci = Components.interfaces;
        Components.utils['import']('resource://gre/modules/FileUtils.jsm');
        xpcIsWindows = ('@mozilla.org/windows-registry-key;1' in Cc);

        text.get = function (url, callback) {
            var inStream, convertStream, fileObj,
                readData = {};

            if (xpcIsWindows) {
                url = url.replace(/\//g, '\\');
            }

            fileObj = new FileUtils.File(url);

            //XPCOM, you so crazy
            try {
                inStream = Cc['@mozilla.org/network/file-input-stream;1']
                           .createInstance(Ci.nsIFileInputStream);
                inStream.init(fileObj, 1, 0, false);

                convertStream = Cc['@mozilla.org/intl/converter-input-stream;1']
                                .createInstance(Ci.nsIConverterInputStream);
                convertStream.init(inStream, "utf-8", inStream.available(),
                Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);

                convertStream.readString(inStream.available(), readData);
                convertStream.close();
                inStream.close();
                callback(readData.value);
            } catch (e) {
                throw new Error((fileObj && fileObj.path || '') + ': ' + e);
            }
        };
    }
    return text;
});


define('text!../version.json',[],function () { return '{"readiumJs":{"sha":"30d2cccb862feb37454f581b12528ec0d1e99dd6","tag":"0.15-100-g30d2ccc","clean":false},"readiumSharedJs":{"sha":"d97c6333a91a530cf1fe15c46c4bbc0dcbdfc12d","tag":"0.16-95-gd97c633","clean":true}}';});

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

define('epub-fetch/markup_parser',[],
    function () {

        var MarkupParser = function (){

            var self = this;

            this.parseXml = function(xmlString) {
                return self.parseMarkup(xmlString, 'text/xml');
            };

            this.parseMarkup = function(markupString, contentType) {
                var parser = new window.DOMParser;
                return parser.parseFromString(markupString, contentType);
            };

        };

        return MarkupParser;
});

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

define('epub-fetch/discover_content_type',['jquery', 'URIjs'], function ($, URI) {

    var _instance = undefined;

    var ContentTypeDiscovery = function() {

        var self = this;

        ContentTypeDiscovery.suffixContentTypeMap = {
            css: 'text/css',
            epub: 'application/epub+zip',
            gif: 'image/gif',
            html: 'text/html',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            ncx: 'application/x-dtbncx+xml',
            opf: 'application/oebps-package+xml',
            png: 'image/png',
            svg: 'image/svg+xml',
            xhtml: 'application/xhtml+xml'
        };

        this.identifyContentTypeFromFileName = function(contentUrl) {
            var contentUrlSuffix = URI(contentUrl).suffix();
            var contentType = 'application/octet-stream';
            if (typeof ContentTypeDiscovery.suffixContentTypeMap[contentUrlSuffix] !== 'undefined') {
                contentType = ContentTypeDiscovery.suffixContentTypeMap[contentUrlSuffix];
            }
            return contentType;
        };

        this.identifyContentType = function (contentUrl) {
            // TODO: Make the call asynchronous (which would require a callback and would probably make sense
            // when calling functions are also remodelled for async).

            var contentType = $.ajax({
                type: "HEAD",
                url: contentUrl,
                async: false
            }).getResponseHeader('Content-Type');
            if (contentType === null) {
                contentType = self.identifyContentTypeFromFileName(contentUrl);
                console.log('guessed contentType [' + contentType + '] from URI [' + contentUrl +
                    ']. Configuring the web server to provide the content type is recommended.');

            }

            return contentType;
        }

    };

    if(!_instance) {
        _instance = new ContentTypeDiscovery();
    }

    return _instance;

});

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

define('epub-fetch/plain_resource_fetcher',['jquery', 'URIjs', './discover_content_type'], function ($, URI, ContentTypeDiscovery) {

    var PlainResourceFetcher = function(parentFetcher, baseUrl){

        var self = this;
        var _packageDocumentAbsoluteUrl;
        var _packageDocumentRelativePath;

        // INTERNAL FUNCTIONS

        function fetchFileContents(pathRelativeToPackageRoot, readCallback, onerror) {
            var fileUrl = self.resolveURI(pathRelativeToPackageRoot);

            if (typeof pathRelativeToPackageRoot === 'undefined') {
                throw 'Fetched file relative path is undefined!';
            }

            var xhr = new XMLHttpRequest();
            xhr.open('GET', fileUrl, true);
            xhr.responseType = 'arraybuffer';
            xhr.onerror = onerror;

            xhr.onload = function (loadEvent) {
                readCallback(xhr.response);
            };

            xhr.send();
        }


        // PUBLIC API

        this.initialize = function(callback) {

            parentFetcher.getXmlFileDom('META-INF/container.xml', function (containerXmlDom) {
                _packageDocumentRelativePath = parentFetcher.getRootFile(containerXmlDom);
                _packageDocumentAbsoluteUrl = self.resolveURI(_packageDocumentRelativePath);

                callback();

            }, function(error) {
                console.error("unable to find package document: " + error);
                _packageDocumentAbsoluteUrl = baseUrl;

                callback();
            });
        };

        this.resolveURI = function (pathRelativeToPackageRoot) {
            return baseUrl + "/" + pathRelativeToPackageRoot;
        };


        this.getPackageUrl = function() {
            return _packageDocumentAbsoluteUrl;
        };

        this.fetchFileContentsText = function(pathRelativeToPackageRoot, fetchCallback, onerror) {
            var fileUrl = self.resolveURI(pathRelativeToPackageRoot);

            if (typeof fileUrl === 'undefined') {
                throw 'Fetched file URL is undefined!';
            }
            $.ajax({
                // encoding: "UTF-8",
                // mimeType: "text/plain; charset=UTF-8",
                // beforeSend: function( xhr ) {
                //     xhr.overrideMimeType("text/plain; charset=UTF-8");
                // },
                isLocal: fileUrl.indexOf("http") === 0 ? false : true,
                url: fileUrl,
                dataType: 'text', //https://api.jquery.com/jQuery.ajax/
                async: true,
                success: function (result) {
                    fetchCallback(result);
                },
                error: function (xhr, status, errorThrown) {
                    console.error('Error when AJAX fetching ' + fileUrl);
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
        };

        this.fetchFileContentsBlob = function(pathRelativeToPackageRoot, fetchCallback, onerror) {

            var decryptionFunction = parentFetcher.getDecryptionFunctionForRelativePath(pathRelativeToPackageRoot);
            if (decryptionFunction) {
                var origFetchCallback = fetchCallback;
                fetchCallback = function (unencryptedBlob) {
                    decryptionFunction(unencryptedBlob, function (decryptedBlob) {
                        origFetchCallback(decryptedBlob);
                    });
                };
            }
            fetchFileContents(pathRelativeToPackageRoot, function (contentsArrayBuffer) {
                var blob = new Blob([contentsArrayBuffer], {
                    type: ContentTypeDiscovery.identifyContentTypeFromFileName(pathRelativeToPackageRoot)
                });
                fetchCallback(blob);
            }, onerror);
        };

        this.getPackageDom = function (callback, onerror) {
            self.fetchFileContentsText(_packageDocumentRelativePath, function (packageXml) {
                var packageDom = parentFetcher.markupParser.parseXml(packageXml);
                callback(packageDom);
            }, onerror);
        };

    };

    return PlainResourceFetcher;
});

/*
 Copyright (c) 2013 Gildas Lormeau. All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in
 the documentation and/or other materials provided with the distribution.

 3. The names of the authors may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function(obj) {
	

	var ERR_BAD_FORMAT = "File format is not recognized.";
	var ERR_CRC = "CRC failed.";
	var ERR_ENCRYPTED = "File contains encrypted entry.";
	var ERR_ZIP64 = "File is using Zip64 (4gb+ file size).";
	var ERR_READ = "Error while reading zip file.";
	var ERR_WRITE = "Error while writing zip file.";
	var ERR_WRITE_DATA = "Error while writing file data.";
	var ERR_READ_DATA = "Error while reading file data.";
	var ERR_DUPLICATED_NAME = "File already exists.";
	var CHUNK_SIZE = 512 * 1024;
	
	var TEXT_PLAIN = "text/plain";

	var appendABViewSupported;
	try {
		appendABViewSupported = new Blob([ new DataView(new ArrayBuffer(0)) ]).size === 0;
	} catch (e) {
	}

	function Crc32() {
		this.crc = -1;
	}
	Crc32.prototype.append = function append(data) {
		var crc = this.crc | 0, table = this.table;
		for (var offset = 0, len = data.length | 0; offset < len; offset++)
			crc = (crc >>> 8) ^ table[(crc ^ data[offset]) & 0xFF];
		this.crc = crc;
	};
	Crc32.prototype.get = function get() {
		return ~this.crc;
	};
	Crc32.prototype.table = (function() {
		var i, j, t, table = []; // Uint32Array is actually slower than []
		for (i = 0; i < 256; i++) {
			t = i;
			for (j = 0; j < 8; j++)
				if (t & 1)
					t = (t >>> 1) ^ 0xEDB88320;
				else
					t = t >>> 1;
			table[i] = t;
		}
		return table;
	})();
	
	// "no-op" codec
	function NOOP() {}
	NOOP.prototype.append = function append(bytes, onprogress) {
		return bytes;
	};
	NOOP.prototype.flush = function flush() {};

	function blobSlice(blob, index, length) {
		if (index < 0 || length < 0 || index + length > blob.size)
			throw new RangeError('offset:' + index + ', length:' + length + ', size:' + blob.size);
		if (blob.slice)
			return blob.slice(index, index + length);
		else if (blob.webkitSlice)
			return blob.webkitSlice(index, index + length);
		else if (blob.mozSlice)
			return blob.mozSlice(index, index + length);
		else if (blob.msSlice)
			return blob.msSlice(index, index + length);
	}

	function getDataHelper(byteLength, bytes) {
		var dataBuffer, dataArray;
		dataBuffer = new ArrayBuffer(byteLength);
		dataArray = new Uint8Array(dataBuffer);
		if (bytes)
			dataArray.set(bytes, 0);
		return {
			buffer : dataBuffer,
			array : dataArray,
			view : new DataView(dataBuffer)
		};
	}

	// Readers
	function Reader() {
	}

	function TextReader(text) {
		var that = this, blobReader;

		function init(callback, onerror) {
			var blob = new Blob([ text ], {
				type : TEXT_PLAIN
			});
			blobReader = new BlobReader(blob);
			blobReader.init(function() {
				that.size = blobReader.size;
				callback();
			}, onerror);
		}

		function readUint8Array(index, length, callback, onerror) {
			blobReader.readUint8Array(index, length, callback, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	TextReader.prototype = new Reader();
	TextReader.prototype.constructor = TextReader;

	function Data64URIReader(dataURI) {
		var that = this, dataStart;

		function init(callback) {
			var dataEnd = dataURI.length;
			while (dataURI.charAt(dataEnd - 1) == "=")
				dataEnd--;
			dataStart = dataURI.indexOf(",") + 1;
			that.size = Math.floor((dataEnd - dataStart) * 0.75);
			callback();
		}

		function readUint8Array(index, length, callback) {
			var i, data = getDataHelper(length);
			var start = Math.floor(index / 3) * 4;
			var end = Math.ceil((index + length) / 3) * 4;
			var bytes = obj.atob(dataURI.substring(start + dataStart, end + dataStart));
			var delta = index - Math.floor(start / 4) * 3;
			for (i = delta; i < delta + length; i++)
				data.array[i - delta] = bytes.charCodeAt(i);
			callback(data.array);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	Data64URIReader.prototype = new Reader();
	Data64URIReader.prototype.constructor = Data64URIReader;

	function BlobReader(blob) {
		var that = this;

		function init(callback) {
			that.size = blob.size;
			callback();
		}

		function readUint8Array(index, length, callback, onerror) {
			var reader = new FileReader();
			reader.onload = function(e) {
				callback(new Uint8Array(e.target.result));
			};
			reader.onerror = onerror;
			try {
				reader.readAsArrayBuffer(blobSlice(blob, index, length));
			} catch (e) {
				onerror(e);
			}
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	BlobReader.prototype = new Reader();
	BlobReader.prototype.constructor = BlobReader;

	// Writers

	function Writer() {
	}
	Writer.prototype.getData = function(callback) {
		callback(this.data);
	};

	function TextWriter(encoding) {
		var that = this, blob;

		function init(callback) {
			blob = new Blob([], {
				type : TEXT_PLAIN
			});
			callback();
		}

		function writeUint8Array(array, callback) {
			blob = new Blob([ blob, appendABViewSupported ? array : array.buffer ], {
				type : TEXT_PLAIN
			});
			callback();
		}

		function getData(callback, onerror) {
			var reader = new FileReader();
			reader.onload = function(e) {
				callback(e.target.result);
			};
			reader.onerror = onerror;
			reader.readAsText(blob, encoding);
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	TextWriter.prototype = new Writer();
	TextWriter.prototype.constructor = TextWriter;

	function Data64URIWriter(contentType) {
		var that = this, data = "", pending = "";

		function init(callback) {
			data += "data:" + (contentType || "") + ";base64,";
			callback();
		}

		function writeUint8Array(array, callback) {
			var i, delta = pending.length, dataString = pending;
			pending = "";
			for (i = 0; i < (Math.floor((delta + array.length) / 3) * 3) - delta; i++)
				dataString += String.fromCharCode(array[i]);
			for (; i < array.length; i++)
				pending += String.fromCharCode(array[i]);
			if (dataString.length > 2)
				data += obj.btoa(dataString);
			else
				pending = dataString;
			callback();
		}

		function getData(callback) {
			callback(data + obj.btoa(pending));
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	Data64URIWriter.prototype = new Writer();
	Data64URIWriter.prototype.constructor = Data64URIWriter;

	function BlobWriter(contentType) {
		var data = [], that = this;

		function init(callback) {
			callback();
		}

		function writeUint8Array(array, callback) {
			data.push(appendABViewSupported ? array : array.buffer);
			callback();
		}

		function getData(callback) {
			callback(new Blob(data, {type: contentType}));
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	BlobWriter.prototype = new Writer();
	BlobWriter.prototype.constructor = BlobWriter;

	/** 
	 * inflate/deflate core functions
	 * @param worker {Worker} web worker for the task.
	 * @param initialMessage {Object} initial message to be sent to the worker. should contain
	 *   sn(serial number for distinguishing multiple tasks sent to the worker), and codecClass.
	 *   This function may add more properties before sending.
	 */
	function launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror) {
		var chunkIndex = 0, index, outputSize, sn = initialMessage.sn, crc;

		function onflush() {
			worker.removeEventListener('message', onmessage, false);
			onend(outputSize, crc);
		}

		function onmessage(event) {
			var message = event.data, data = message.data, err = message.error;
			if (err) {
				err.toString = function () { return 'Error: ' + this.message; };
				onreaderror(err);
				return;
			}
			if (message.sn !== sn)
				return;
			if (typeof message.codecTime === 'number')
				worker.codecTime += message.codecTime; // should be before onflush()
			if (typeof message.crcTime === 'number')
				worker.crcTime += message.crcTime;

			switch (message.type) {
				case 'append':
					if (data) {
						outputSize += data.length;
						writer.writeUint8Array(data, function() {
							step();
						}, onwriteerror);
					} else
						step();
					break;
				case 'flush':
					crc = message.crc;
					if (data) {
						outputSize += data.length;
						writer.writeUint8Array(data, function() {
							onflush();
						}, onwriteerror);
					} else
						onflush();
					break;
				case 'progress':
					if (onprogress)
						onprogress(index + message.loaded, size);
					break;
				case 'importScripts': //no need to handle here
				case 'newTask':
				case 'echo':
					break;
				default:
					console.warn('zip.js:launchWorkerProcess: unknown message: ', message);
			}
		}

		function step() {
			index = chunkIndex * CHUNK_SIZE;
			if (index < size) {
				reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function(array) {
					if (onprogress)
						onprogress(index, size);
					var msg = index === 0 ? initialMessage : {sn : sn};
					msg.type = 'append';
					msg.data = array;
					worker.postMessage(msg, [array.buffer]);
					chunkIndex++;
				}, onreaderror);
			} else {
				worker.postMessage({
					sn: sn,
					type: 'flush'
				});
			}
		}

		outputSize = 0;
		worker.addEventListener('message', onmessage, false);
		step();
	}

	function launchProcess(process, reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror) {
		var chunkIndex = 0, index, outputSize = 0,
			crcInput = crcType === 'input',
			crcOutput = crcType === 'output',
			crc = new Crc32();
		function step() {
			var outputData;
			index = chunkIndex * CHUNK_SIZE;
			if (index < size)
				reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function(inputData) {
					var outputData;
					try {
						outputData = process.append(inputData, function(loaded) {
							if (onprogress)
								onprogress(index + loaded, size);
						});
					} catch (e) {
						onreaderror(e);
						return;
					}
					if (outputData) {
						outputSize += outputData.length;
						writer.writeUint8Array(outputData, function() {
							chunkIndex++;
							setTimeout(step, 1);
						}, onwriteerror);
						if (crcOutput)
							crc.append(outputData);
					} else {
						chunkIndex++;
						setTimeout(step, 1);
					}
					if (crcInput)
						crc.append(inputData);
					if (onprogress)
						onprogress(index, size);
				}, onreaderror);
			else {
				try {
					outputData = process.flush();
				} catch (e) {
					onreaderror(e);
					return;
				}
				if (outputData) {
					if (crcOutput)
						crc.append(outputData);
					outputSize += outputData.length;
					writer.writeUint8Array(outputData, function() {
						onend(outputSize, crc.get());
					}, onwriteerror);
				} else
					onend(outputSize, crc.get());
			}
		}

		step();
	}

	function inflate(worker, sn, reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
		var crcType = computeCrc32 ? 'output' : 'none';
		if (obj.zip.useWebWorkers) {
			var initialMessage = {
				sn: sn,
				codecClass: 'Inflater',
				crcType: crcType,
			};
			launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror);
		} else
			launchProcess(new obj.zip.Inflater(), reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror);
	}

	function deflate(worker, sn, reader, writer, level, onend, onprogress, onreaderror, onwriteerror) {
		var crcType = 'input';
		if (obj.zip.useWebWorkers) {
			var initialMessage = {
				sn: sn,
				options: {level: level},
				codecClass: 'Deflater',
				crcType: crcType,
			};
			launchWorkerProcess(worker, initialMessage, reader, writer, 0, reader.size, onprogress, onend, onreaderror, onwriteerror);
		} else
			launchProcess(new obj.zip.Deflater(), reader, writer, 0, reader.size, crcType, onprogress, onend, onreaderror, onwriteerror);
	}

	function copy(worker, sn, reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
		var crcType = 'input';
		if (obj.zip.useWebWorkers && computeCrc32) {
			var initialMessage = {
				sn: sn,
				codecClass: 'NOOP',
				crcType: crcType,
			};
			launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror);
		} else
			launchProcess(new NOOP(), reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror);
	}

	// ZipReader

	function decodeASCII(str) {
		var i, out = "", charCode, extendedASCII = [ '\u00C7', '\u00FC', '\u00E9', '\u00E2', '\u00E4', '\u00E0', '\u00E5', '\u00E7', '\u00EA', '\u00EB',
				'\u00E8', '\u00EF', '\u00EE', '\u00EC', '\u00C4', '\u00C5', '\u00C9', '\u00E6', '\u00C6', '\u00F4', '\u00F6', '\u00F2', '\u00FB', '\u00F9',
				'\u00FF', '\u00D6', '\u00DC', '\u00F8', '\u00A3', '\u00D8', '\u00D7', '\u0192', '\u00E1', '\u00ED', '\u00F3', '\u00FA', '\u00F1', '\u00D1',
				'\u00AA', '\u00BA', '\u00BF', '\u00AE', '\u00AC', '\u00BD', '\u00BC', '\u00A1', '\u00AB', '\u00BB', '_', '_', '_', '\u00A6', '\u00A6',
				'\u00C1', '\u00C2', '\u00C0', '\u00A9', '\u00A6', '\u00A6', '+', '+', '\u00A2', '\u00A5', '+', '+', '-', '-', '+', '-', '+', '\u00E3',
				'\u00C3', '+', '+', '-', '-', '\u00A6', '-', '+', '\u00A4', '\u00F0', '\u00D0', '\u00CA', '\u00CB', '\u00C8', 'i', '\u00CD', '\u00CE',
				'\u00CF', '+', '+', '_', '_', '\u00A6', '\u00CC', '_', '\u00D3', '\u00DF', '\u00D4', '\u00D2', '\u00F5', '\u00D5', '\u00B5', '\u00FE',
				'\u00DE', '\u00DA', '\u00DB', '\u00D9', '\u00FD', '\u00DD', '\u00AF', '\u00B4', '\u00AD', '\u00B1', '_', '\u00BE', '\u00B6', '\u00A7',
				'\u00F7', '\u00B8', '\u00B0', '\u00A8', '\u00B7', '\u00B9', '\u00B3', '\u00B2', '_', ' ' ];
		for (i = 0; i < str.length; i++) {
			charCode = str.charCodeAt(i) & 0xFF;
			if (charCode > 127)
				out += extendedASCII[charCode - 128];
			else
				out += String.fromCharCode(charCode);
		}
		return out;
	}

	function decodeUTF8(string) {
		return decodeURIComponent(escape(string));
	}

	function getString(bytes) {
		var i, str = "";
		for (i = 0; i < bytes.length; i++)
			str += String.fromCharCode(bytes[i]);
		return str;
	}

	function getDate(timeRaw) {
		var date = (timeRaw & 0xffff0000) >> 16, time = timeRaw & 0x0000ffff;
		try {
			return new Date(1980 + ((date & 0xFE00) >> 9), ((date & 0x01E0) >> 5) - 1, date & 0x001F, (time & 0xF800) >> 11, (time & 0x07E0) >> 5,
					(time & 0x001F) * 2, 0);
		} catch (e) {
		}
	}

	function readCommonHeader(entry, data, index, centralDirectory, onerror) {
		entry.version = data.view.getUint16(index, true);
		entry.bitFlag = data.view.getUint16(index + 2, true);
		entry.compressionMethod = data.view.getUint16(index + 4, true);
		entry.lastModDateRaw = data.view.getUint32(index + 6, true);
		entry.lastModDate = getDate(entry.lastModDateRaw);
		if ((entry.bitFlag & 0x01) === 0x01) {
			onerror(ERR_ENCRYPTED);
			return;
		}
		if (centralDirectory || (entry.bitFlag & 0x0008) != 0x0008) {
			entry.crc32 = data.view.getUint32(index + 10, true);
			entry.compressedSize = data.view.getUint32(index + 14, true);
			entry.uncompressedSize = data.view.getUint32(index + 18, true);
		}
		if (entry.compressedSize === 0xFFFFFFFF || entry.uncompressedSize === 0xFFFFFFFF) {
			onerror(ERR_ZIP64);
			return;
		}
		entry.filenameLength = data.view.getUint16(index + 22, true);
		entry.extraFieldLength = data.view.getUint16(index + 24, true);
	}

	function createZipReader(reader, callback, onerror) {
		var inflateSN = 0;

		function Entry() {
		}

		Entry.prototype.getData = function(writer, onend, onprogress, checkCrc32) {
			var that = this;

			function testCrc32(crc32) {
				var dataCrc32 = getDataHelper(4);
				dataCrc32.view.setUint32(0, crc32);
				return that.crc32 == dataCrc32.view.getUint32(0);
			}

			function getWriterData(uncompressedSize, crc32) {
				if (checkCrc32 && !testCrc32(crc32))
					onerror(ERR_CRC);
				else
					writer.getData(function(data) {
						onend(data);
					});
			}

			function onreaderror(err) {
				onerror(err || ERR_READ_DATA);
			}

			function onwriteerror(err) {
				onerror(err || ERR_WRITE_DATA);
			}

			reader.readUint8Array(that.offset, 30, function(bytes) {
				var data = getDataHelper(bytes.length, bytes), dataOffset;
				if (data.view.getUint32(0) != 0x504b0304) {
					onerror(ERR_BAD_FORMAT);
					return;
				}
				readCommonHeader(that, data, 4, false, onerror);
				dataOffset = that.offset + 30 + that.filenameLength + that.extraFieldLength;
				writer.init(function() {
					if (that.compressionMethod === 0)
						copy(that._worker, inflateSN++, reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror);
					else
						inflate(that._worker, inflateSN++, reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror);
				}, onwriteerror);
			}, onreaderror);
		};

		function seekEOCDR(eocdrCallback) {
			// "End of central directory record" is the last part of a zip archive, and is at least 22 bytes long.
			// Zip file comment is the last part of EOCDR and has max length of 64KB,
			// so we only have to search the last 64K + 22 bytes of a archive for EOCDR signature (0x06054b50).
			var EOCDR_MIN = 22;
			if (reader.size < EOCDR_MIN) {
				onerror(ERR_BAD_FORMAT);
				return;
			}
			var ZIP_COMMENT_MAX = 256 * 256, EOCDR_MAX = EOCDR_MIN + ZIP_COMMENT_MAX;

			// In most cases, the EOCDR is EOCDR_MIN bytes long
			doSeek(EOCDR_MIN, function() {
				// If not found, try within EOCDR_MAX bytes
				doSeek(Math.min(EOCDR_MAX, reader.size), function() {
					onerror(ERR_BAD_FORMAT);
				});
			});

			// seek last length bytes of file for EOCDR
			function doSeek(length, eocdrNotFoundCallback) {
				reader.readUint8Array(reader.size - length, length, function(bytes) {
					for (var i = bytes.length - EOCDR_MIN; i >= 0; i--) {
						if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
							eocdrCallback(new DataView(bytes.buffer, i, EOCDR_MIN));
							return;
						}
					}
					eocdrNotFoundCallback();
				}, function() {
					onerror(ERR_READ);
				});
			}
		}

		var zipReader = {
			getEntries : function(callback) {
				var worker = this._worker;
				// look for End of central directory record
				seekEOCDR(function(dataView) {
					var datalength, fileslength;
					datalength = dataView.getUint32(16, true);
					fileslength = dataView.getUint16(8, true);
					if (datalength < 0 || datalength >= reader.size) {
						onerror(ERR_BAD_FORMAT);
						return;
					}
					reader.readUint8Array(datalength, reader.size - datalength, function(bytes) {
						var i, index = 0, entries = [], entry, filename, comment, data = getDataHelper(bytes.length, bytes);
						for (i = 0; i < fileslength; i++) {
							entry = new Entry();
							entry._worker = worker;
							if (data.view.getUint32(index) != 0x504b0102) {
								onerror(ERR_BAD_FORMAT);
								return;
							}
							readCommonHeader(entry, data, index + 6, true, onerror);
							entry.commentLength = data.view.getUint16(index + 32, true);
							entry.directory = ((data.view.getUint8(index + 38) & 0x10) == 0x10);
							entry.offset = data.view.getUint32(index + 42, true);
							filename = getString(data.array.subarray(index + 46, index + 46 + entry.filenameLength));
							entry.filename = ((entry.bitFlag & 0x0800) === 0x0800) ? decodeUTF8(filename) : decodeASCII(filename);
							if (!entry.directory && entry.filename.charAt(entry.filename.length - 1) == "/")
								entry.directory = true;
							comment = getString(data.array.subarray(index + 46 + entry.filenameLength + entry.extraFieldLength, index + 46
									+ entry.filenameLength + entry.extraFieldLength + entry.commentLength));
							entry.comment = ((entry.bitFlag & 0x0800) === 0x0800) ? decodeUTF8(comment) : decodeASCII(comment);
							entries.push(entry);
							index += 46 + entry.filenameLength + entry.extraFieldLength + entry.commentLength;
						}
						callback(entries);
					}, function() {
						onerror(ERR_READ);
					});
				});
			},
			close : function(callback) {
				if (this._worker) {
					this._worker.terminate();
					this._worker = null;
				}
				if (callback)
					callback();
			},
			_worker: null
		};

		if (!obj.zip.useWebWorkers)
			callback(zipReader);
		else {
			createWorker('inflater',
				function(worker) {
					zipReader._worker = worker;
					callback(zipReader);
				},
				function(err) {
					onerror(err);
				}
			);
		}
	}

	// ZipWriter

	function encodeUTF8(string) {
		return unescape(encodeURIComponent(string));
	}

	function getBytes(str) {
		var i, array = [];
		for (i = 0; i < str.length; i++)
			array.push(str.charCodeAt(i));
		return array;
	}

	function createZipWriter(writer, callback, onerror, dontDeflate) {
		var files = {}, filenames = [], datalength = 0;
		var deflateSN = 0;

		function onwriteerror(err) {
			onerror(err || ERR_WRITE);
		}

		function onreaderror(err) {
			onerror(err || ERR_READ_DATA);
		}

		var zipWriter = {
			add : function(name, reader, onend, onprogress, options) {
				var header, filename, date;
				var worker = this._worker;

				function writeHeader(callback) {
					var data;
					date = options.lastModDate || new Date();
					header = getDataHelper(26);
					files[name] = {
						headerArray : header.array,
						directory : options.directory,
						filename : filename,
						offset : datalength,
						comment : getBytes(encodeUTF8(options.comment || ""))
					};
					header.view.setUint32(0, 0x14000808);
					if (options.version)
						header.view.setUint8(0, options.version);
					if (!dontDeflate && options.level !== 0 && !options.directory)
						header.view.setUint16(4, 0x0800);
					header.view.setUint16(6, (((date.getHours() << 6) | date.getMinutes()) << 5) | date.getSeconds() / 2, true);
					header.view.setUint16(8, ((((date.getFullYear() - 1980) << 4) | (date.getMonth() + 1)) << 5) | date.getDate(), true);
					header.view.setUint16(22, filename.length, true);
					data = getDataHelper(30 + filename.length);
					data.view.setUint32(0, 0x504b0304);
					data.array.set(header.array, 4);
					data.array.set(filename, 30);
					datalength += data.array.length;
					writer.writeUint8Array(data.array, callback, onwriteerror);
				}

				function writeFooter(compressedLength, crc32) {
					var footer = getDataHelper(16);
					datalength += compressedLength || 0;
					footer.view.setUint32(0, 0x504b0708);
					if (typeof crc32 != "undefined") {
						header.view.setUint32(10, crc32, true);
						footer.view.setUint32(4, crc32, true);
					}
					if (reader) {
						footer.view.setUint32(8, compressedLength, true);
						header.view.setUint32(14, compressedLength, true);
						footer.view.setUint32(12, reader.size, true);
						header.view.setUint32(18, reader.size, true);
					}
					writer.writeUint8Array(footer.array, function() {
						datalength += 16;
						onend();
					}, onwriteerror);
				}

				function writeFile() {
					options = options || {};
					name = name.trim();
					if (options.directory && name.charAt(name.length - 1) != "/")
						name += "/";
					if (files.hasOwnProperty(name)) {
						onerror(ERR_DUPLICATED_NAME);
						return;
					}
					filename = getBytes(encodeUTF8(name));
					filenames.push(name);
					writeHeader(function() {
						if (reader)
							if (dontDeflate || options.level === 0)
								copy(worker, deflateSN++, reader, writer, 0, reader.size, true, writeFooter, onprogress, onreaderror, onwriteerror);
							else
								deflate(worker, deflateSN++, reader, writer, options.level, writeFooter, onprogress, onreaderror, onwriteerror);
						else
							writeFooter();
					}, onwriteerror);
				}

				if (reader)
					reader.init(writeFile, onreaderror);
				else
					writeFile();
			},
			close : function(callback) {
				if (this._worker) {
					this._worker.terminate();
					this._worker = null;
				}

				var data, length = 0, index = 0, indexFilename, file;
				for (indexFilename = 0; indexFilename < filenames.length; indexFilename++) {
					file = files[filenames[indexFilename]];
					length += 46 + file.filename.length + file.comment.length;
				}
				data = getDataHelper(length + 22);
				for (indexFilename = 0; indexFilename < filenames.length; indexFilename++) {
					file = files[filenames[indexFilename]];
					data.view.setUint32(index, 0x504b0102);
					data.view.setUint16(index + 4, 0x1400);
					data.array.set(file.headerArray, index + 6);
					data.view.setUint16(index + 32, file.comment.length, true);
					if (file.directory)
						data.view.setUint8(index + 38, 0x10);
					data.view.setUint32(index + 42, file.offset, true);
					data.array.set(file.filename, index + 46);
					data.array.set(file.comment, index + 46 + file.filename.length);
					index += 46 + file.filename.length + file.comment.length;
				}
				data.view.setUint32(index, 0x504b0506);
				data.view.setUint16(index + 8, filenames.length, true);
				data.view.setUint16(index + 10, filenames.length, true);
				data.view.setUint32(index + 12, length, true);
				data.view.setUint32(index + 16, datalength, true);
				writer.writeUint8Array(data.array, function() {
					writer.getData(callback);
				}, onwriteerror);
			},
			_worker: null
		};

		if (!obj.zip.useWebWorkers)
			callback(zipWriter);
		else {
			createWorker('deflater',
				function(worker) {
					zipWriter._worker = worker;
					callback(zipWriter);
				},
				function(err) {
					onerror(err);
				}
			);
		}
	}

	function resolveURLs(urls) {
		var a = document.createElement('a');
		return urls.map(function(url) {
			a.href = url;
			return a.href;
		});
	}

	var DEFAULT_WORKER_SCRIPTS = {
		deflater: ['z-worker.js', 'deflate.js'],
		inflater: ['z-worker.js', 'inflate.js']
	};
	function createWorker(type, callback, onerror) {
		if (obj.zip.workerScripts !== null && obj.zip.workerScriptsPath !== null) {
			onerror(new Error('Either zip.workerScripts or zip.workerScriptsPath may be set, not both.'));
			return;
		}
		var scripts;
		if (obj.zip.workerScripts) {
			scripts = obj.zip.workerScripts[type];
			if (!Array.isArray(scripts)) {
				onerror(new Error('zip.workerScripts.' + type + ' is not an array!'));
				return;
			}
			scripts = resolveURLs(scripts);
		} else {
			scripts = DEFAULT_WORKER_SCRIPTS[type].slice(0);
			scripts[0] = (obj.zip.workerScriptsPath || '') + scripts[0];
		}
		var worker = new Worker(scripts[0]);
		// record total consumed time by inflater/deflater/crc32 in this worker
		worker.codecTime = worker.crcTime = 0;
		worker.postMessage({ type: 'importScripts', scripts: scripts.slice(1) });
		worker.addEventListener('message', onmessage);
		function onmessage(ev) {
			var msg = ev.data;
			if (msg.error) {
				worker.terminate(); // should before onerror(), because onerror() may throw.
				onerror(msg.error);
				return;
			}
			if (msg.type === 'importScripts') {
				worker.removeEventListener('message', onmessage);
				worker.removeEventListener('error', errorHandler);
				callback(worker);
			}
		}
		// catch entry script loading error and other unhandled errors
		worker.addEventListener('error', errorHandler);
		function errorHandler(err) {
			worker.terminate();
			onerror(err);
		}
	}

	function onerror_default(error) {
		console.error(error);
	}
	obj.zip = {
		Reader : Reader,
		Writer : Writer,
		BlobReader : BlobReader,
		Data64URIReader : Data64URIReader,
		TextReader : TextReader,
		BlobWriter : BlobWriter,
		Data64URIWriter : Data64URIWriter,
		TextWriter : TextWriter,
		createReader : function(reader, callback, onerror) {
			onerror = onerror || onerror_default;

			reader.init(function() {
				createZipReader(reader, callback, onerror);
			}, onerror);
		},
		createWriter : function(writer, callback, onerror, dontDeflate) {
			onerror = onerror || onerror_default;
			dontDeflate = !!dontDeflate;

			writer.init(function() {
				createZipWriter(writer, callback, onerror, dontDeflate);
			}, onerror);
		},
		useWebWorkers : true,
		/**
		 * Directory containing the default worker scripts (z-worker.js, deflate.js, and inflate.js), relative to current base url.
		 * E.g.: zip.workerScripts = './';
		 */
		workerScriptsPath : null,
		/**
		 * Advanced option to control which scripts are loaded in the Web worker. If this option is specified, then workerScriptsPath must not be set.
		 * workerScripts.deflater/workerScripts.inflater should be arrays of urls to scripts for deflater/inflater, respectively.
		 * Scripts in the array are executed in order, and the first one should be z-worker.js, which is used to start the worker.
		 * All urls are relative to current base url.
		 * E.g.:
		 * zip.workerScripts = {
		 *   deflater: ['z-worker.js', 'deflate.js'],
		 *   inflater: ['z-worker.js', 'inflate.js']
		 * };
		 */
		workerScripts : null,
	};

})(this);

define("zip", (function (global) {
    return function () {
        var ret, fn;
        return ret || global.zip;
    };
}(this)));

/*
 Copyright (c) 2013 Gildas Lormeau. All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright 
 notice, this list of conditions and the following disclaimer in 
 the documentation and/or other materials provided with the distribution.

 3. The names of the authors may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function() {
	

	var CHUNK_SIZE = 512 * 1024;

	var TextWriter = zip.TextWriter, //
	BlobWriter = zip.BlobWriter, //
	Data64URIWriter = zip.Data64URIWriter, //
	Reader = zip.Reader, //
	TextReader = zip.TextReader, //
	BlobReader = zip.BlobReader, //
	Data64URIReader = zip.Data64URIReader, //
	createReader = zip.createReader, //
	createWriter = zip.createWriter;

	function ZipBlobReader(entry) {
		var that = this, blobReader;

		function init(callback) {
			that.size = entry.uncompressedSize;
			callback();
		}

		function getData(callback) {
			if (that.data)
				callback();
			else
				entry.getData(new BlobWriter(), function(data) {
					that.data = data;
					blobReader = new BlobReader(data);
					callback();
				}, null, that.checkCrc32);
		}

		function readUint8Array(index, length, callback, onerror) {
			getData(function() {
				blobReader.readUint8Array(index, length, callback, onerror);
			}, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	ZipBlobReader.prototype = new Reader();
	ZipBlobReader.prototype.constructor = ZipBlobReader;
	ZipBlobReader.prototype.checkCrc32 = false;

	function getTotalSize(entry) {
		var size = 0;

		function process(entry) {
			size += entry.uncompressedSize || 0;
			entry.children.forEach(process);
		}

		process(entry);
		return size;
	}

	function initReaders(entry, onend, onerror) {
		var index = 0;

		function next() {
			index++;
			if (index < entry.children.length)
				process(entry.children[index]);
			else
				onend();
		}

		function process(child) {
			if (child.directory)
				initReaders(child, next, onerror);
			else {
				child.reader = new child.Reader(child.data, onerror);
				child.reader.init(function() {
					child.uncompressedSize = child.reader.size;
					next();
				});
			}
		}

		if (entry.children.length)
			process(entry.children[index]);
		else
			onend();
	}

	function detach(entry) {
		var children = entry.parent.children;
		children.forEach(function(child, index) {
			if (child.id == entry.id)
				children.splice(index, 1);
		});
	}

	function exportZip(zipWriter, entry, onend, onprogress, totalSize) {
		var currentIndex = 0;

		function process(zipWriter, entry, onend, onprogress, totalSize) {
			var childIndex = 0;

			function exportChild() {
				var child = entry.children[childIndex];
				if (child)
					zipWriter.add(child.getFullname(), child.reader, function() {
						currentIndex += child.uncompressedSize || 0;
						process(zipWriter, child, function() {
							childIndex++;
							exportChild();
						}, onprogress, totalSize);
					}, function(index) {
						if (onprogress)
							onprogress(currentIndex + index, totalSize);
					}, {
						directory : child.directory,
						version : child.zipVersion
					});
				else
					onend();
			}

			exportChild();
		}

		process(zipWriter, entry, onend, onprogress, totalSize);
	}

	function addFileEntry(zipEntry, fileEntry, onend, onerror) {
		function getChildren(fileEntry, callback) {
			if (fileEntry.isDirectory)
				fileEntry.createReader().readEntries(callback);
			if (fileEntry.isFile)
				callback([]);
		}

		function process(zipEntry, fileEntry, onend) {
			getChildren(fileEntry, function(children) {
				var childIndex = 0;

				function addChild(child) {
					function nextChild(childFileEntry) {
						process(childFileEntry, child, function() {
							childIndex++;
							processChild();
						});
					}

					if (child.isDirectory)
						nextChild(zipEntry.addDirectory(child.name));
					if (child.isFile)
						child.file(function(file) {
							var childZipEntry = zipEntry.addBlob(child.name, file);
							childZipEntry.uncompressedSize = file.size;
							nextChild(childZipEntry);
						}, onerror);
				}

				function processChild() {
					var child = children[childIndex];
					if (child)
						addChild(child);
					else
						onend();
				}

				processChild();
			});
		}

		if (fileEntry.isDirectory)
			process(zipEntry, fileEntry, onend);
		else
			fileEntry.file(function(file) {
				zipEntry.addBlob(fileEntry.name, file);
				onend();
			}, onerror);
	}

	function getFileEntry(fileEntry, entry, onend, onprogress, onerror, totalSize, checkCrc32) {
		var currentIndex = 0;

		function process(fileEntry, entry, onend, onprogress, onerror, totalSize) {
			var childIndex = 0;

			function addChild(child) {
				function nextChild(childFileEntry) {
					currentIndex += child.uncompressedSize || 0;
					process(childFileEntry, child, function() {
						childIndex++;
						processChild();
					}, onprogress, onerror, totalSize);
				}

				if (child.directory)
					fileEntry.getDirectory(child.name, {
						create : true
					}, nextChild, onerror);
				else
					fileEntry.getFile(child.name, {
						create : true
					}, function(file) {
						child.getData(new zip.FileWriter(file, zip.getMimeType(child.name)), nextChild, function(index) {
							if (onprogress)
								onprogress(currentIndex + index, totalSize);
						}, checkCrc32);
					}, onerror);
			}

			function processChild() {
				var child = entry.children[childIndex];
				if (child)
					addChild(child);
				else
					onend();
			}

			processChild();
		}

		if (entry.directory)
			process(fileEntry, entry, onend, onprogress, onerror, totalSize);
		else
			entry.getData(new zip.FileWriter(fileEntry, zip.getMimeType(entry.name)), onend, onprogress, checkCrc32);
	}

	function resetFS(fs) {
		fs.entries = [];
		fs.root = new ZipDirectoryEntry(fs);
	}

	function bufferedCopy(reader, writer, onend, onprogress, onerror) {
		var chunkIndex = 0;

		function stepCopy() {
			var index = chunkIndex * CHUNK_SIZE;
			if (onprogress)
				onprogress(index, reader.size);
			if (index < reader.size)
				reader.readUint8Array(index, Math.min(CHUNK_SIZE, reader.size - index), function(array) {
					writer.writeUint8Array(new Uint8Array(array), function() {
						chunkIndex++;
						stepCopy();
					});
				}, onerror);
			else
				writer.getData(onend);
		}

		stepCopy();
	}

	function addChild(parent, name, params, directory) {
		if (parent.directory)
			return directory ? new ZipDirectoryEntry(parent.fs, name, params, parent) : new ZipFileEntry(parent.fs, name, params, parent);
		else
			throw "Parent entry is not a directory.";
	}

	function ZipEntry() {
	}

	ZipEntry.prototype = {
		init : function(fs, name, params, parent) {
			var that = this;
			if (fs.root && parent && parent.getChildByName(name))
				throw "Entry filename already exists.";
			if (!params)
				params = {};
			that.fs = fs;
			that.name = name;
			that.id = fs.entries.length;
			that.parent = parent;
			that.children = [];
			that.zipVersion = params.zipVersion || 0x14;
			that.uncompressedSize = 0;
			fs.entries.push(that);
			if (parent)
				that.parent.children.push(that);
		},
		getFileEntry : function(fileEntry, onend, onprogress, onerror, checkCrc32) {
			var that = this;
			initReaders(that, function() {
				getFileEntry(fileEntry, that, onend, onprogress, onerror, getTotalSize(that), checkCrc32);
			}, onerror);
		},
		moveTo : function(target) {
			var that = this;
			if (target.directory) {
				if (!target.isDescendantOf(that)) {
					if (that != target) {
						if (target.getChildByName(that.name))
							throw "Entry filename already exists.";
						detach(that);
						that.parent = target;
						target.children.push(that);
					}
				} else
					throw "Entry is a ancestor of target entry.";
			} else
				throw "Target entry is not a directory.";
		},
		getFullname : function() {
			var that = this, fullname = that.name, entry = that.parent;
			while (entry) {
				fullname = (entry.name ? entry.name + "/" : "") + fullname;
				entry = entry.parent;
			}
			return fullname;
		},
		isDescendantOf : function(ancestor) {
			var entry = this.parent;
			while (entry && entry.id != ancestor.id)
				entry = entry.parent;
			return !!entry;
		}
	};
	ZipEntry.prototype.constructor = ZipEntry;

	var ZipFileEntryProto;

	function ZipFileEntry(fs, name, params, parent) {
		var that = this;
		ZipEntry.prototype.init.call(that, fs, name, params, parent);
		that.Reader = params.Reader;
		that.Writer = params.Writer;
		that.data = params.data;
		if (params.getData) {
			that.getData = params.getData;
		}
	}

	ZipFileEntry.prototype = ZipFileEntryProto = new ZipEntry();
	ZipFileEntryProto.constructor = ZipFileEntry;
	ZipFileEntryProto.getData = function(writer, onend, onprogress, onerror) {
		var that = this;
		if (!writer || (writer.constructor == that.Writer && that.data))
			onend(that.data);
		else {
			if (!that.reader)
				that.reader = new that.Reader(that.data, onerror);
			that.reader.init(function() {
				writer.init(function() {
					bufferedCopy(that.reader, writer, onend, onprogress, onerror);
				}, onerror);
			});
		}
	};

	ZipFileEntryProto.getText = function(onend, onprogress, checkCrc32, encoding) {
		this.getData(new TextWriter(encoding), onend, onprogress, checkCrc32);
	};
	ZipFileEntryProto.getBlob = function(mimeType, onend, onprogress, checkCrc32) {
		this.getData(new BlobWriter(mimeType), onend, onprogress, checkCrc32);
	};
	ZipFileEntryProto.getData64URI = function(mimeType, onend, onprogress, checkCrc32) {
		this.getData(new Data64URIWriter(mimeType), onend, onprogress, checkCrc32);
	};

	var ZipDirectoryEntryProto;

	function ZipDirectoryEntry(fs, name, params, parent) {
		var that = this;
		ZipEntry.prototype.init.call(that, fs, name, params, parent);
		that.directory = true;
	}

	ZipDirectoryEntry.prototype = ZipDirectoryEntryProto = new ZipEntry();
	ZipDirectoryEntryProto.constructor = ZipDirectoryEntry;
	ZipDirectoryEntryProto.addDirectory = function(name) {
		return addChild(this, name, null, true);
	};
	ZipDirectoryEntryProto.addText = function(name, text) {
		return addChild(this, name, {
			data : text,
			Reader : TextReader,
			Writer : TextWriter
		});
	};
	ZipDirectoryEntryProto.addBlob = function(name, blob) {
		return addChild(this, name, {
			data : blob,
			Reader : BlobReader,
			Writer : BlobWriter
		});
	};
	ZipDirectoryEntryProto.addData64URI = function(name, dataURI) {
		return addChild(this, name, {
			data : dataURI,
			Reader : Data64URIReader,
			Writer : Data64URIWriter
		});
	};
	ZipDirectoryEntryProto.addFileEntry = function(fileEntry, onend, onerror) {
		addFileEntry(this, fileEntry, onend, onerror);
	};
	ZipDirectoryEntryProto.addData = function(name, params) {
		return addChild(this, name, params);
	};
	ZipDirectoryEntryProto.importBlob = function(blob, onend, onerror) {
		this.importZip(new BlobReader(blob), onend, onerror);
	};
	ZipDirectoryEntryProto.importText = function(text, onend, onerror) {
		this.importZip(new TextReader(text), onend, onerror);
	};
	ZipDirectoryEntryProto.importData64URI = function(dataURI, onend, onerror) {
		this.importZip(new Data64URIReader(dataURI), onend, onerror);
	};
	ZipDirectoryEntryProto.exportBlob = function(onend, onprogress, onerror) {
		this.exportZip(new BlobWriter("application/zip"), onend, onprogress, onerror);
	};
	ZipDirectoryEntryProto.exportText = function(onend, onprogress, onerror) {
		this.exportZip(new TextWriter(), onend, onprogress, onerror);
	};
	ZipDirectoryEntryProto.exportFileEntry = function(fileEntry, onend, onprogress, onerror) {
		this.exportZip(new zip.FileWriter(fileEntry, "application/zip"), onend, onprogress, onerror);
	};
	ZipDirectoryEntryProto.exportData64URI = function(onend, onprogress, onerror) {
		this.exportZip(new Data64URIWriter("application/zip"), onend, onprogress, onerror);
	};
	ZipDirectoryEntryProto.importZip = function(reader, onend, onerror) {
		var that = this;
		createReader(reader, function(zipReader) {
			zipReader.getEntries(function(entries) {
				entries.forEach(function(entry) {
					var parent = that, path = entry.filename.split("/"), name = path.pop();
					path.forEach(function(pathPart) {
						parent = parent.getChildByName(pathPart) || new ZipDirectoryEntry(that.fs, pathPart, null, parent);
					});
					if (!entry.directory)
						addChild(parent, name, {
							data : entry,
							Reader : ZipBlobReader
						});
				});
				onend();
			});
		}, onerror);
	};
	ZipDirectoryEntryProto.exportZip = function(writer, onend, onprogress, onerror) {
		var that = this;
		initReaders(that, function() {
			createWriter(writer, function(zipWriter) {
				exportZip(zipWriter, that, function() {
					zipWriter.close(onend);
				}, onprogress, getTotalSize(that));
			}, onerror);
		}, onerror);
	};
	ZipDirectoryEntryProto.getChildByName = function(name) {
		var childIndex, child, that = this;
		for (childIndex = 0; childIndex < that.children.length; childIndex++) {
			child = that.children[childIndex];
			if (child.name == name)
				return child;
		}
	};

	function FS() {
		resetFS(this);
	}
	FS.prototype = {
		remove : function(entry) {
			detach(entry);
			this.entries[entry.id] = null;
		},
		find : function(fullname) {
			var index, path = fullname.split("/"), node = this.root;
			for (index = 0; node && index < path.length; index++)
				node = node.getChildByName(path[index]);
			return node;
		},
		getById : function(id) {
			return this.entries[id];
		},
		importBlob : function(blob, onend, onerror) {
			resetFS(this);
			this.root.importBlob(blob, onend, onerror);
		},
		importText : function(text, onend, onerror) {
			resetFS(this);
			this.root.importText(text, onend, onerror);
		},
		importData64URI : function(dataURI, onend, onerror) {
			resetFS(this);
			this.root.importData64URI(dataURI, onend, onerror);
		},
		exportBlob : function(onend, onprogress, onerror) {
			this.root.exportBlob(onend, onprogress, onerror);
		},
		exportText : function(onend, onprogress, onerror) {
			this.root.exportText(onend, onprogress, onerror);
		},
		exportFileEntry : function(fileEntry, onend, onprogress, onerror) {
			this.root.exportFileEntry(fileEntry, onend, onprogress, onerror);
		},
		exportData64URI : function(onend, onprogress, onerror) {
			this.root.exportData64URI(onend, onprogress, onerror);
		}
	};

	zip.fs = {
		FS : FS,
		ZipDirectoryEntry : ZipDirectoryEntry,
		ZipFileEntry : ZipFileEntry
	};

	zip.getMimeType = function() {
		return "application/octet-stream";
	};

})();

define("zip-fs", ["zip"], (function (global) {
    return function () {
        var ret, fn;
        return ret || global.zip-fs;
    };
}(this)));

/*
 Copyright (c) 2013 Gildas Lormeau. All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.

 2. Redistributions in binary form must reproduce the above copyright
 notice, this list of conditions and the following disclaimer in
 the documentation and/or other materials provided with the distribution.

 3. The names of the authors may not be used to endorse or promote products
 derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED WARRANTIES,
 INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL JCRAFT,
 INC. OR ANY CONTRIBUTORS TO THIS SOFTWARE BE LIABLE FOR ANY DIRECT, INDIRECT,
 INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

(function() {
	

	var ERR_HTTP_RANGE = "HTTP Range not supported.";

	var Reader = zip.Reader;
	var Writer = zip.Writer;
	
	var ZipDirectoryEntry;

	var appendABViewSupported;
	try {
		appendABViewSupported = new Blob([ new DataView(new ArrayBuffer(0)) ]).size === 0;
	} catch (e) {
	}

	function HttpReader(url) {
		var that = this;

		function getData(callback, onerror) {
			var request;
			if (!that.data) {
				request = new XMLHttpRequest();
				request.addEventListener("load", function() {
					if (!that.size)
						that.size = Number(request.getResponseHeader("Content-Length"));
					that.data = new Uint8Array(request.response);
					callback();
				}, false);
				request.addEventListener("error", onerror, false);
				request.open("GET", url);
				request.responseType = "arraybuffer";
				request.send();
			} else
				callback();
		}

		function init(callback, onerror) {
			var request = new XMLHttpRequest();
			request.addEventListener("load", function() {
				that.size = Number(request.getResponseHeader("Content-Length"));
				callback();
			}, false);
			request.addEventListener("error", onerror, false);
			request.open("HEAD", url);
			request.send();
		}

		function readUint8Array(index, length, callback, onerror) {
			getData(function() {
				callback(new Uint8Array(that.data.subarray(index, index + length)));
			}, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	HttpReader.prototype = new Reader();
	HttpReader.prototype.constructor = HttpReader;

	function HttpRangeReader(url) {
		var that = this;

		function init(callback, onerror) {
			var request = new XMLHttpRequest();
			request.addEventListener("load", function() {
				that.size = Number(request.getResponseHeader("Content-Length"));
				if (request.getResponseHeader("Accept-Ranges") == "bytes")
					callback();
				else
					onerror(ERR_HTTP_RANGE);
			}, false);
			request.addEventListener("error", onerror, false);
			request.open("HEAD", url);
			request.send();
		}

		function readArrayBuffer(index, length, callback, onerror) {
			var request = new XMLHttpRequest();
			request.open("GET", url);
			request.responseType = "arraybuffer";
			request.setRequestHeader("Range", "bytes=" + index + "-" + (index + length - 1));
			request.addEventListener("load", function() {
				callback(request.response);
			}, false);
			request.addEventListener("error", onerror, false);
			request.send();
		}

		function readUint8Array(index, length, callback, onerror) {
			readArrayBuffer(index, length, function(arraybuffer) {
				callback(new Uint8Array(arraybuffer));
			}, onerror);
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	HttpRangeReader.prototype = new Reader();
	HttpRangeReader.prototype.constructor = HttpRangeReader;

	function ArrayBufferReader(arrayBuffer) {
		var that = this;

		function init(callback, onerror) {
			that.size = arrayBuffer.byteLength;
			callback();
		}

		function readUint8Array(index, length, callback, onerror) {
			callback(new Uint8Array(arrayBuffer.slice(index, index + length)));
		}

		that.size = 0;
		that.init = init;
		that.readUint8Array = readUint8Array;
	}
	ArrayBufferReader.prototype = new Reader();
	ArrayBufferReader.prototype.constructor = ArrayBufferReader;

	function ArrayBufferWriter() {
		var array, that = this;

		function init(callback, onerror) {
			array = new Uint8Array();
			callback();
		}

		function writeUint8Array(arr, callback, onerror) {
			var tmpArray = new Uint8Array(array.length + arr.length);
			tmpArray.set(array);
			tmpArray.set(arr, array.length);
			array = tmpArray;
			callback();
		}

		function getData(callback) {
			callback(array.buffer);
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	ArrayBufferWriter.prototype = new Writer();
	ArrayBufferWriter.prototype.constructor = ArrayBufferWriter;

	function FileWriter(fileEntry, contentType) {
		var writer, that = this;

		function init(callback, onerror) {
			fileEntry.createWriter(function(fileWriter) {
				writer = fileWriter;
				callback();
			}, onerror);
		}

		function writeUint8Array(array, callback, onerror) {
			var blob = new Blob([ appendABViewSupported ? array : array.buffer ], {
				type : contentType
			});
			writer.onwrite = function() {
				writer.onwrite = null;
				callback();
			};
			writer.onerror = onerror;
			writer.write(blob);
		}

		function getData(callback) {
			fileEntry.file(callback);
		}

		that.init = init;
		that.writeUint8Array = writeUint8Array;
		that.getData = getData;
	}
	FileWriter.prototype = new Writer();
	FileWriter.prototype.constructor = FileWriter;

	zip.FileWriter = FileWriter;
	zip.HttpReader = HttpReader;
	zip.HttpRangeReader = HttpRangeReader;
	zip.ArrayBufferReader = ArrayBufferReader;
	zip.ArrayBufferWriter = ArrayBufferWriter;

	if (zip.fs) {
		ZipDirectoryEntry = zip.fs.ZipDirectoryEntry;
		ZipDirectoryEntry.prototype.addHttpContent = function(name, URL, useRangeHeader) {
			function addChild(parent, name, params, directory) {
				if (parent.directory)
					return directory ? new ZipDirectoryEntry(parent.fs, name, params, parent) : new zip.fs.ZipFileEntry(parent.fs, name, params, parent);
				else
					throw "Parent entry is not a directory.";
			}

			return addChild(this, name, {
				data : URL,
				Reader : useRangeHeader ? HttpRangeReader : HttpReader
			});
		};
		ZipDirectoryEntry.prototype.importHttpContent = function(URL, useRangeHeader, onend, onerror) {
			this.importZip(useRangeHeader ? new HttpRangeReader(URL) : new HttpReader(URL), onend, onerror);
		};
		zip.fs.FS.prototype.importHttpContent = function(URL, useRangeHeader, onend, onerror) {
			this.entries = [];
			this.root = new ZipDirectoryEntry(this);
			this.root.importHttpContent(URL, useRangeHeader, onend, onerror);
		};
	}

})();

define("zip-ext", ["zip-fs"], (function (global) {
    return function () {
        var ret, fn;
        return ret || global.zip-ext;
    };
}(this)));

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

define('epub-fetch/zip_resource_fetcher',['jquery', 'URIjs', './discover_content_type', 'zip-ext'], function ($, URI, ContentTypeDiscovery, zip) {

    var ZipResourceFetcher = function(parentFetcher, baseUrl, libDir) {

        var _checkCrc32 = false;
        var _zipFs;

        // INTERNAL FUNCTIONS

        // Description: perform a function with an initialized zip filesystem, making sure that such filesystem is initialized.
        // Note that due to a race condition, more than one zip filesystem may be instantiated.
        // However, the last one to be set on the model object will prevail and others would be garbage collected later.
        function withZipFsPerform(callback, onerror) {

            if (_zipFs) {

                callback(_zipFs, onerror);

            } else {

                // The Web Worker requires standalone inflate/deflate.js files in libDir (i.e. cannot be aggregated/minified/optimised in the final generated single-file build)
                zip.useWebWorkers = true; // (true by default)
                zip.workerScriptsPath = libDir;
                
                _zipFs = new zip.fs.FS();
                _zipFs.importHttpContent(baseUrl, true, function () {

                    callback(_zipFs, onerror);

                }, onerror)
            }
        }

        function fetchFileContents (relativePathRelativeToPackageRoot, readCallback, onerror) {

            if (typeof relativePathRelativeToPackageRoot === 'undefined') {
                throw 'Fetched file relative path is undefined!';
            }

            withZipFsPerform(function (zipFs, onerror) {
                var entry = zipFs.find(relativePathRelativeToPackageRoot);
                if (typeof entry === 'undefined' || entry === null) {
                    onerror(new Error('Entry ' + relativePathRelativeToPackageRoot + ' not found in zip ' + baseUrl));
                } else {
                    if (entry.directory) {
                        onerror(new Error('Entry ' + relativePathRelativeToPackageRoot + ' is a directory while a file has been expected'));
                    } else {
                        readCallback(entry);
                    }
                }
            }, onerror);
        }


        // PUBLIC API

        this.getPackageUrl = function() {
            return baseUrl;
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

define(
    'epub-fetch/content_document_fetcher',['jquery', 'underscore', 'URIjs', './discover_content_type'],
    function ($, _, URI, ContentTypeDiscovery) {


        var ContentDocumentFetcher = function (publicationFetcher, spineItem, loadedDocumentUri, publicationResourcesCache, contentDocumentTextPreprocessor) {

            var self = this;

            var _contentDocumentPathRelativeToPackage = spineItem.href;
            var _publicationFetcher = publicationFetcher;
            var _contentDocumentText;
            var _srcMediaType = spineItem.media_type;
            var _contentDocumentDom;
            var _publicationResourcesCache = publicationResourcesCache;
            var _contentDocumentTextPreprocessor = contentDocumentTextPreprocessor;

            // PUBLIC API

            this.fetchContentDocumentAndResolveDom = function (contentDocumentResolvedCallback, errorCallback) {
                _publicationFetcher.relativeToPackageFetchFileContents(_contentDocumentPathRelativeToPackage, 'text',
                    function (contentDocumentText) {
                        _contentDocumentText = contentDocumentText;
                        if (_contentDocumentTextPreprocessor) {
                            _contentDocumentText = _contentDocumentTextPreprocessor(loadedDocumentUri, _contentDocumentText);
                        }
                        self.resolveInternalPackageResources(contentDocumentResolvedCallback, errorCallback);
                    }, errorCallback
                );
            };

            this.resolveInternalPackageResources = function (resolvedDocumentCallback, onerror) {

                _contentDocumentDom = _publicationFetcher.markupParser.parseMarkup(_contentDocumentText, _srcMediaType);
                setBaseUri(_contentDocumentDom, loadedDocumentUri);

                var resolutionDeferreds = [];

                if (_publicationFetcher.shouldFetchMediaAssetsProgrammatically()) {
                    resolveDocumentImages(resolutionDeferreds, onerror);
                    resolveDocumentAudios(resolutionDeferreds, onerror);
                    resolveDocumentVideos(resolutionDeferreds, onerror);
                }
                // TODO: recursive fetching, parsing and DOM construction of documents in IFRAMEs,
                // with CSS preprocessing and obfuscated font handling
                resolveDocumentIframes(resolutionDeferreds, onerror);
                // TODO: resolution (e.g. using DOM mutation events) of scripts loaded dynamically by scripts
                resolveDocumentScripts(resolutionDeferreds, onerror);
                resolveDocumentLinkStylesheets(resolutionDeferreds, onerror);
                resolveDocumentEmbeddedStylesheets(resolutionDeferreds, onerror);

                $.when.apply($, resolutionDeferreds).done(function () {
                    resolvedDocumentCallback(_contentDocumentDom);
                });

            };

            // INTERNAL FUNCTIONS

            function setBaseUri(documentDom, baseURI) {
                var baseElem = documentDom.getElementsByTagName('base')[0];
                if (!baseElem) {
                    baseElem = documentDom.createElement('base');

                    var anchor = documentDom.getElementsByTagName('head')[0];
                    if (anchor) {
                        anchor.insertBefore(baseElem, anchor.childNodes[0]);
                    }
                }
                baseElem.setAttribute('href', baseURI);
            }

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

            function fetchResourceForElement(resolvedElem, refAttrOrigVal, refAttr, fetchMode, resolutionDeferreds,
                                             onerror, resourceDataPreprocessing) {
                var resourceUriRelativeToPackageDocument = (new URI(refAttrOrigVal)).absoluteTo(_contentDocumentPathRelativeToPackage).toString();

                var cachedResourceUrl = _publicationResourcesCache.getResourceURL(resourceUriRelativeToPackageDocument);

                function replaceRefAttrInElem(newResourceUrl) {
                    // Store original refAttrVal in a special attribute to provide access to the original href:
                    $(resolvedElem).data('epubZipOrigHref', refAttrOrigVal);
                    $(resolvedElem).attr(refAttr, newResourceUrl);
                }

                if (cachedResourceUrl) {
                    replaceRefAttrInElem(cachedResourceUrl);
                } else {
                    var resolutionDeferred = $.Deferred();
                    resolutionDeferreds.push(resolutionDeferred);

                    _publicationFetcher.relativeToPackageFetchFileContents(resourceUriRelativeToPackageDocument,
                        fetchMode,
                        function (resourceData) {

                            // Generate a function to replace element's resource URL with URL of fetched data.
                            // The function will either be called directly, immediately (if no preprocessing of resourceData is in effect)
                            // or indirectly, later after resourceData preprocessing finishes:
                            var replaceResourceURL = function (finalResourceData) {
                                // Creating an object URL requires a Blob object, so resource data fetched in text mode needs to be wrapped in a Blob:
                                if (fetchMode === 'text') {
                                    var textResourceContentType = ContentTypeDiscovery.identifyContentTypeFromFileName(resourceUriRelativeToPackageDocument);
                                    var declaredType = $(resolvedElem).attr('type');
                                    if (declaredType) {
                                        textResourceContentType = declaredType;
                                    }
                                    finalResourceData = new Blob([finalResourceData], {type: textResourceContentType});
                                }
                                //noinspection JSUnresolvedVariable,JSUnresolvedFunction
                                var resourceObjectURL = window.URL.createObjectURL(finalResourceData);
                                _publicationResourcesCache.putResource(resourceUriRelativeToPackageDocument,
                                    resourceObjectURL, finalResourceData);
                                // TODO: take care of releasing object URLs when no longer needed
                                replaceRefAttrInElem(resourceObjectURL);
                                resolutionDeferred.resolve();
                            };

                            if (resourceDataPreprocessing) {
                                resourceDataPreprocessing(resourceData, resourceUriRelativeToPackageDocument,
                                    replaceResourceURL);
                            } else {
                                replaceResourceURL(resourceData);
                            }
                        }, onerror);
                }
            }

            function fetchResourceForCssUrlMatch(cssUrlMatch, cssResourceDownloadDeferreds,
                                                 styleSheetUriRelativeToPackageDocument, stylesheetCssResourceUrlsMap,
                                                 isStyleSheetResource) {
                var origMatchedUrlString = cssUrlMatch[0];

                var extractedUrlCandidates = cssUrlMatch.slice(2);
                var extractedUrl = _.find(extractedUrlCandidates, function(matchGroup){ return typeof matchGroup !== 'undefined' });

                var extractedUri = new URI(extractedUrl);
                var isCssUrlRelative = extractedUri.scheme() === '';
                if (!isCssUrlRelative) {
                    // Absolute URLs don't need programmatic fetching
                    return;
                }
                var resourceUriRelativeToPackageDocument = (new URI(extractedUrl)).absoluteTo(styleSheetUriRelativeToPackageDocument).toString();

                var cachedResourceURL = _publicationResourcesCache.getResourceURL(resourceUriRelativeToPackageDocument);


                if (cachedResourceURL) {
                    stylesheetCssResourceUrlsMap[origMatchedUrlString] = {
                        isStyleSheetResource: isStyleSheetResource,
                        resourceObjectURL: cachedResourceURL
                    };
                } else {
                    var cssUrlFetchDeferred = $.Deferred();
                    cssResourceDownloadDeferreds.push(cssUrlFetchDeferred);

                    var processedBlobCallback = function (resourceDataBlob) {
                        //noinspection JSUnresolvedVariable,JSUnresolvedFunction
                        var resourceObjectURL = window.URL.createObjectURL(resourceDataBlob);
                        stylesheetCssResourceUrlsMap[origMatchedUrlString] = {
                            isStyleSheetResource: isStyleSheetResource,
                            resourceObjectURL: resourceObjectURL
                        };
                        _publicationResourcesCache.putResource(resourceUriRelativeToPackageDocument,
                            resourceObjectURL, resourceDataBlob);
                        cssUrlFetchDeferred.resolve();
                    };
                    var fetchErrorCallback = function (error) {
                        _handleError(error);
                        cssUrlFetchDeferred.resolve();
                    };

                    var fetchMode;
                    var fetchCallback;
                    if (isStyleSheetResource) {
                        // TODO: test whether recursion works for nested @import rules with arbitrary indirection depth.
                        fetchMode = 'text';
                        fetchCallback = function (styleSheetResourceData) {
                            preprocessCssStyleSheetData(styleSheetResourceData, resourceUriRelativeToPackageDocument,
                                function (preprocessedStyleSheetData) {
                                    var resourceDataBlob = new Blob([preprocessedStyleSheetData], {type: 'text/css'});
                                    processedBlobCallback(resourceDataBlob);
                                })
                        }
                    } else {
                        fetchMode = 'blob';
                        fetchCallback = processedBlobCallback;
                    }

                    _publicationFetcher.relativeToPackageFetchFileContents(resourceUriRelativeToPackageDocument,
                        fetchMode,
                        fetchCallback, fetchErrorCallback);
                }
            }

            function preprocessCssStyleSheetData(styleSheetResourceData, styleSheetUriRelativeToPackageDocument,
                                                 callback) {
                var cssUrlRegexp = /[Uu][Rr][Ll]\(\s*([']([^']+)[']|["]([^"]+)["]|([^)]+))\s*\)/g;
                var nonUrlCssImportRegexp = /@[Ii][Mm][Pp][Oo][Rr][Tt]\s*('([^']+)'|"([^"]+)")/g;
                var stylesheetCssResourceUrlsMap = {};
                var cssResourceDownloadDeferreds = [];
                // Go through the stylesheet text using all regexps and process according to those regexp matches, if any:
                [nonUrlCssImportRegexp, cssUrlRegexp].forEach(function (processingRegexp) {
                    // extract all URL references in the CSS sheet,
                    var cssUrlMatch = processingRegexp.exec(styleSheetResourceData);
                    while (cssUrlMatch != null) {
                        // then fetch and replace them with corresponding object URLs:
                        var isStyleSheetResource = false;
                        // Special handling of @import-ed stylesheet files - recursive preprocessing:
                        // TODO: will not properly handle @import url(...):
                        if (processingRegexp == nonUrlCssImportRegexp) {
                            // This resource URL points to an @import-ed CSS stylesheet file. Need to preprocess its text
                            // after fetching but before making an object URL of it:
                            isStyleSheetResource = true;
                        }
                        fetchResourceForCssUrlMatch(cssUrlMatch, cssResourceDownloadDeferreds,
                            styleSheetUriRelativeToPackageDocument, stylesheetCssResourceUrlsMap, isStyleSheetResource);
                        cssUrlMatch = processingRegexp.exec(styleSheetResourceData);
                    }

                });

                if (cssResourceDownloadDeferreds.length > 0) {
                    $.when.apply($, cssResourceDownloadDeferreds).done(function () {
                        for (var origMatchedUrlString in stylesheetCssResourceUrlsMap) {
                            var processedResourceDescriptor = stylesheetCssResourceUrlsMap[origMatchedUrlString];


                            var processedUrlString;
                            if (processedResourceDescriptor.isStyleSheetResource) {
                                processedUrlString = '@import "' + processedResourceDescriptor.resourceObjectURL + '"';
                            } else {
                                processedUrlString = "url('" + processedResourceDescriptor.resourceObjectURL + "')";
                            }
                            var origMatchedUrlStringEscaped = origMatchedUrlString.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
                                "\\$&");
                            var origMatchedUrlStringRegExp = new RegExp(origMatchedUrlStringEscaped, 'g');
                            //noinspection JSCheckFunctionSignatures
                            styleSheetResourceData =
                                styleSheetResourceData.replace(origMatchedUrlStringRegExp, processedUrlString, 'g');

                        }
                        callback(styleSheetResourceData);
                    });
                } else {
                    callback(styleSheetResourceData);
                }
            }


            function resolveResourceElements(elemName, refAttr, fetchMode, resolutionDeferreds, onerror,
                                             resourceDataPreprocessing) {

                var resolvedElems = $(elemName + '[' + refAttr.replace(':', '\\:') + ']', _contentDocumentDom);

                resolvedElems.each(function (index, resolvedElem) {
                    var refAttrOrigVal = $(resolvedElem).attr(refAttr);
                    var refAttrUri = new URI(refAttrOrigVal);

                    if (refAttrUri.scheme() === '') {
                        // Relative URI, fetch from packed EPUB archive:

                        fetchResourceForElement(resolvedElem, refAttrOrigVal, refAttr, fetchMode, resolutionDeferreds,
                            onerror, resourceDataPreprocessing);
                    }
                });
            }

            function resolveDocumentImages(resolutionDeferreds, onerror) {
                resolveResourceElements('img', 'src', 'blob', resolutionDeferreds, onerror);
                resolveResourceElements('image', 'xlink:href', 'blob', resolutionDeferreds, onerror);
            }

            function resolveDocumentAudios(resolutionDeferreds, onerror) {
                resolveResourceElements('audio', 'src', 'blob', resolutionDeferreds, onerror);
            }

            function resolveDocumentVideos(resolutionDeferreds, onerror) {
                resolveResourceElements('video', 'src', 'blob', resolutionDeferreds, onerror);
                resolveResourceElements('video', 'poster', 'blob', resolutionDeferreds, onerror);
            }

            function resolveDocumentScripts(resolutionDeferreds, onerror) {
                resolveResourceElements('script', 'src', 'blob', resolutionDeferreds, onerror);
            }

            function resolveDocumentIframes(resolutionDeferreds, onerror) {
                resolveResourceElements('iframe', 'src', 'blob', resolutionDeferreds, onerror);
            }

            function resolveDocumentLinkStylesheets(resolutionDeferreds, onerror) {
                resolveResourceElements('link', 'href', 'text', resolutionDeferreds, onerror,
                    preprocessCssStyleSheetData);
            }

            function resolveDocumentEmbeddedStylesheets(resolutionDeferreds, onerror) {
                var resolvedElems = $('style', _contentDocumentDom);
                resolvedElems.each(function (index, resolvedElem) {
                    var resolutionDeferred = $.Deferred();
                    resolutionDeferreds.push(resolutionDeferred);
                    var styleSheetData = $(resolvedElem).text();
                    preprocessCssStyleSheetData(styleSheetData, _contentDocumentPathRelativeToPackage,
                        function (resolvedStylesheetData) {
                            $(resolvedElem).text(resolvedStylesheetData);
                            resolutionDeferred.resolve();
                        });
                });
            }

        };

        return ContentDocumentFetcher;

    }
);

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

define('epub-fetch/resource_cache',['underscore'], function (_) {

        var ResourceCache = function(sourceWindow, configuredCacheSizeEvictThreshold) {

            var self = this;
            var _resourcesHash = {};
            var _orderingByLastUseTimestamp = [];
            var _cacheSize = 0;
            var CACHE_SIZE_EVICT_THRESHOLD_DEFAULT = 100000000;
            var cacheSizeEvictThreshold = determineCacheSizeThreshold();

            function getTimestamp() {
                return new Date().getTime();
            }

            function getBrowserHeapLimitInBytes() {
                if (window.performance && window.performance.memory && window.performance.memory.jsHeapSizeLimit) {
                    return window.performance.memory.jsHeapSizeLimit;
                } else {
                    return null;
                }
            }

            function determineCacheSizeThreshold() {
                if (configuredCacheSizeEvictThreshold) {
                    return configuredCacheSizeEvictThreshold;
                }
                var browserHeapLimitInBytes = getBrowserHeapLimitInBytes();
                if (browserHeapLimitInBytes && browserHeapLimitInBytes / 10 > CACHE_SIZE_EVICT_THRESHOLD_DEFAULT) {
                    return browserHeapLimitInBytes / 10;
                } else {
                    return  CACHE_SIZE_EVICT_THRESHOLD_DEFAULT;
                }
            }

            this.getResourceURL = function(resourceAbsoluteHref) {
                var resourceObjectUrl = null;
                var resourceData = _resourcesHash[resourceAbsoluteHref];
                if (resourceData) {
                    resourceObjectUrl = resourceData.url;
                    resourceData.lastUseTimestamp = getTimestamp();
                    updateOrderedIndex(resourceData);
                }
                return resourceObjectUrl;
            };

            function removeCacheEntryFromOrderedIndex(cacheEntry) {
                // Remove the previous entry from the ordered index, if present:
                if (typeof cacheEntry.orderingByLastUseTimestampIdx !== 'undefined') {
                    var orderingByLastUseTimestampIdx = cacheEntry.orderingByLastUseTimestampIdx;
                    _orderingByLastUseTimestamp.splice(orderingByLastUseTimestampIdx, 1);
                    // Decrement index values for all downshifted entries:
                    for (var i = orderingByLastUseTimestampIdx; i < _orderingByLastUseTimestamp.length; i++) {
                        var downshiftedEntry = _orderingByLastUseTimestamp[i];
                        // Assertion
                        if ((downshiftedEntry.orderingByLastUseTimestampIdx - 1) != i) {
                            console.error('algorithm incorrect: downshiftedEntry.orderingByLastUseTimestampIdx: ' +
                                downshiftedEntry.orderingByLastUseTimestampIdx + ', i: ' + i);
                        }
                        downshiftedEntry.orderingByLastUseTimestampIdx = i;
                    }
                }
            }

            function updateOrderedIndex(cacheEntry) {
                removeCacheEntryFromOrderedIndex(cacheEntry);
                var insertIdx = _.sortedIndex(_orderingByLastUseTimestamp, cacheEntry, 'lastUseTimestamp');
                _orderingByLastUseTimestamp.splice(insertIdx, 0, cacheEntry);
                cacheEntry.orderingByLastUseTimestampIdx = insertIdx;
            }

            this.putResource = function(resourceAbsoluteHref, resourceObjectUrl, resourceDataBlob) {
                this.trimCache();
                var currentTimestamp = getTimestamp();
                var cacheEntry = {
                    url: resourceObjectUrl,
                    absoluteHref: resourceAbsoluteHref,
                    blob: resourceDataBlob,
                    blobSize: resourceDataBlob.size,
                    creationTimestamp: currentTimestamp,
                    lastUseTimestamp: currentTimestamp,
                    pinned: true
                };
                _resourcesHash[resourceAbsoluteHref] = cacheEntry;
                updateOrderedIndex(cacheEntry);
                _cacheSize += resourceDataBlob.size;
            };

            this.evictResource = function(resourceAbsoluteHref) {
                var resourceData = _resourcesHash[resourceAbsoluteHref];
                if (resourceData) {
                    sourceWindow.URL.revokeObjectURL(resourceData.url);
                    _cacheSize -= resourceData.blobSize;
                    removeCacheEntryFromOrderedIndex(resourceData);
                    delete _resourcesHash[resourceAbsoluteHref];
                }
            };

            this.flushCache = function() {
                // TODO: more efficient, but less code reuse: iterate over _sortedIndex first,
                // then assert an empty cache and perform backup cleanup if assertion failed
                for (var resourceAbsoluteHref in _resourcesHash) {
                    this.evictResource(resourceAbsoluteHref);
                }
                // Assertion
                if (_cacheSize != 0) {
                    console.error('cacheSize accounting error! cacheSize: ' + _cacheSize + ', _resourcesHash:');
                    console.error(_resourcesHash);
                }
                _orderingByLastUseTimestamp = [];
                //console.log('Cache contents:');
                //console.log(_resourcesHash);
                //console.log('_orderingByLastUseTimestamp:');
                //console.log(_orderingByLastUseTimestamp);
                //console.log('Cache size:' + _cacheSize);
            };

            this.unPinResources = function() {
                for (var resourceAbsoluteHref in _resourcesHash) {
                    var resourceData = _resourcesHash[resourceAbsoluteHref];
                    resourceData.pinned = false;
                }
            };

            function orderingByLastUseTimestampToString() {
                return _orderingByLastUseTimestamp.reduce(function(previousValue, currentValue) {
                    return previousValue + (previousValue.length > 1 ? ', ' : '') + '[' +
                        currentValue.absoluteHref + ', pinned: ' + currentValue.pinned +
                        ', orderingByLastUseTimestampIdx: ' + currentValue.orderingByLastUseTimestampIdx + ']'
                }, '');
            }

            this.trimCache = function() {
                if (_cacheSize < cacheSizeEvictThreshold) {
                    return;
                }
                console.log('Trimming cache. Current cache size: ' + _cacheSize);

                // Loop through ordered index (by last use timestamp) starting from the least recently used entries.
                // evict unpinned resources until either:
                // 1) cache size drops below CACHE_SIZE_EVICT_THRESHOLD
                // 2) there are no more unpinned resources to evict
                for (var i = 0; i < _orderingByLastUseTimestamp.length; i++) {
                    if (_cacheSize < cacheSizeEvictThreshold) {
                        break;
                    }
                    var cacheEntry = _orderingByLastUseTimestamp[i];
                    if (!cacheEntry.pinned) {
                        var resourceAbsoluteHref = cacheEntry.absoluteHref;
                        //console.log('Preparing to evict ' + resourceAbsoluteHref);
                        //console.log('_orderingByLastUseTimestamp:');
                        //console.log(orderingByLastUseTimestampToString());
                        this.evictResource(resourceAbsoluteHref);
                        //console.log('Evicted ' + resourceAbsoluteHref);
                        //console.log('Current cache size: ' + _cacheSize);
                        //console.log('_orderingByLastUseTimestamp:');
                        //console.log(orderingByLastUseTimestampToString());
                        //console.log('i: ' + i);

                        // The consequent array elements have downshifted by one position.
                        // The i variable now points to a different element - the evicted element's successor
                        // (if not beyond array's end).
                        // Make the i variable remain in place - compensate for its upcoming incrementation:
                        i--;
                    }
                }
                console.log('Cache size after trimming: ' + _cacheSize);
            };
        };

        return ResourceCache;
    });

(function(e,r){"object"==typeof exports?module.exports=exports=r():"function"==typeof define&&define.amd?define('cryptoJs/core',[],r):e.CryptoJS=r()})(this,function(){var e=e||function(e,r){var t={},i=t.lib={},n=i.Base=function(){function e(){}return{extend:function(r){e.prototype=this;var t=new e;return r&&t.mixIn(r),t.hasOwnProperty("init")||(t.init=function(){t.$super.init.apply(this,arguments)}),t.init.prototype=t,t.$super=this,t},create:function(){var e=this.extend();return e.init.apply(e,arguments),e},init:function(){},mixIn:function(e){for(var r in e)e.hasOwnProperty(r)&&(this[r]=e[r]);e.hasOwnProperty("toString")&&(this.toString=e.toString)},clone:function(){return this.init.prototype.extend(this)}}}(),o=i.WordArray=n.extend({init:function(e,t){e=this.words=e||[],this.sigBytes=t!=r?t:4*e.length},toString:function(e){return(e||s).stringify(this)},concat:function(e){var r=this.words,t=e.words,i=this.sigBytes,n=e.sigBytes;if(this.clamp(),i%4)for(var o=0;n>o;o++){var c=255&t[o>>>2]>>>24-8*(o%4);r[i+o>>>2]|=c<<24-8*((i+o)%4)}else if(t.length>65535)for(var o=0;n>o;o+=4)r[i+o>>>2]=t[o>>>2];else r.push.apply(r,t);return this.sigBytes+=n,this},clamp:function(){var r=this.words,t=this.sigBytes;r[t>>>2]&=4294967295<<32-8*(t%4),r.length=e.ceil(t/4)},clone:function(){var e=n.clone.call(this);return e.words=this.words.slice(0),e},random:function(r){for(var t=[],i=0;r>i;i+=4)t.push(0|4294967296*e.random());return new o.init(t,r)}}),c=t.enc={},s=c.Hex={stringify:function(e){for(var r=e.words,t=e.sigBytes,i=[],n=0;t>n;n++){var o=255&r[n>>>2]>>>24-8*(n%4);i.push((o>>>4).toString(16)),i.push((15&o).toString(16))}return i.join("")},parse:function(e){for(var r=e.length,t=[],i=0;r>i;i+=2)t[i>>>3]|=parseInt(e.substr(i,2),16)<<24-4*(i%8);return new o.init(t,r/2)}},u=c.Latin1={stringify:function(e){for(var r=e.words,t=e.sigBytes,i=[],n=0;t>n;n++){var o=255&r[n>>>2]>>>24-8*(n%4);i.push(String.fromCharCode(o))}return i.join("")},parse:function(e){for(var r=e.length,t=[],i=0;r>i;i++)t[i>>>2]|=(255&e.charCodeAt(i))<<24-8*(i%4);return new o.init(t,r)}},f=c.Utf8={stringify:function(e){try{return decodeURIComponent(escape(u.stringify(e)))}catch(r){throw Error("Malformed UTF-8 data")}},parse:function(e){return u.parse(unescape(encodeURIComponent(e)))}},a=i.BufferedBlockAlgorithm=n.extend({reset:function(){this._data=new o.init,this._nDataBytes=0},_append:function(e){"string"==typeof e&&(e=f.parse(e)),this._data.concat(e),this._nDataBytes+=e.sigBytes},_process:function(r){var t=this._data,i=t.words,n=t.sigBytes,c=this.blockSize,s=4*c,u=n/s;u=r?e.ceil(u):e.max((0|u)-this._minBufferSize,0);var f=u*c,a=e.min(4*f,n);if(f){for(var p=0;f>p;p+=c)this._doProcessBlock(i,p);var d=i.splice(0,f);t.sigBytes-=a}return new o.init(d,a)},clone:function(){var e=n.clone.call(this);return e._data=this._data.clone(),e},_minBufferSize:0});i.Hasher=a.extend({cfg:n.extend(),init:function(e){this.cfg=this.cfg.extend(e),this.reset()},reset:function(){a.reset.call(this),this._doReset()},update:function(e){return this._append(e),this._process(),this},finalize:function(e){e&&this._append(e);var r=this._doFinalize();return r},blockSize:16,_createHelper:function(e){return function(r,t){return new e.init(t).finalize(r)}},_createHmacHelper:function(e){return function(r,t){return new p.HMAC.init(e,t).finalize(r)}}});var p=t.algo={};return t}(Math);return e});
define('cryptoJs', ['cryptoJs/core'], function (main) { return main; });

(function(e,r){"object"==typeof exports?module.exports=exports=r(require("./core")):"function"==typeof define&&define.amd?define('cryptoJs/sha1',["./core"],r):r(e.CryptoJS)})(this,function(e){return function(){var r=e,t=r.lib,n=t.WordArray,i=t.Hasher,o=r.algo,s=[],c=o.SHA1=i.extend({_doReset:function(){this._hash=new n.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(e,r){for(var t=this._hash.words,n=t[0],i=t[1],o=t[2],c=t[3],a=t[4],f=0;80>f;f++){if(16>f)s[f]=0|e[r+f];else{var u=s[f-3]^s[f-8]^s[f-14]^s[f-16];s[f]=u<<1|u>>>31}var d=(n<<5|n>>>27)+a+s[f];d+=20>f?(i&o|~i&c)+1518500249:40>f?(i^o^c)+1859775393:60>f?(i&o|i&c|o&c)-1894007588:(i^o^c)-899497514,a=c,c=o,o=i<<30|i>>>2,i=n,n=d}t[0]=0|t[0]+n,t[1]=0|t[1]+i,t[2]=0|t[2]+o,t[3]=0|t[3]+c,t[4]=0|t[4]+a},_doFinalize:function(){var e=this._data,r=e.words,t=8*this._nDataBytes,n=8*e.sigBytes;return r[n>>>5]|=128<<24-n%32,r[(n+64>>>9<<4)+14]=Math.floor(t/4294967296),r[(n+64>>>9<<4)+15]=t,e.sigBytes=4*r.length,this._process(),this._hash},clone:function(){var e=i.clone.call(this);return e._hash=this._hash.clone(),e}});r.SHA1=i._createHelper(c),r.HmacSHA1=i._createHmacHelper(c)}(),e.SHA1});
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

define('epub-fetch/encryption_handler',['cryptoJs/sha1'], function (SHA1) {

    var EncryptionHandler = function (encryptionData) {
        var self = this;

        var ENCRYPTION_METHODS = {
            'http://www.idpf.org/2008/embedding': embeddedFontDeobfuscateIdpf,
            'http://ns.adobe.com/pdf/enc#RC': embeddedFontDeobfuscateAdobe
        };

        // INTERNAL FUNCTIONS

        function blob2BinArray(blob, callback) {
            var fileReader = new FileReader();
            fileReader.onload = function () {
                var arrayBuffer = this.result;
                callback(new Uint8Array(arrayBuffer));
            };
            fileReader.readAsArrayBuffer(blob);
        }

        function xorObfuscatedBlob(obfuscatedResourceBlob, prefixLength, xorKey, callback) {
            var obfuscatedPrefixBlob = obfuscatedResourceBlob.slice(0, prefixLength);
            blob2BinArray(obfuscatedPrefixBlob, function (bytes) {
                var masklen = xorKey.length;
                for (var i = 0; i < prefixLength; i++) {
                    bytes[i] = bytes[i] ^ (xorKey[i % masklen]);
                }
                var deobfuscatedPrefixBlob = new Blob([bytes], { type: obfuscatedResourceBlob.type });
                var remainderBlob = obfuscatedResourceBlob.slice(prefixLength);
                var deobfuscatedBlob = new Blob([deobfuscatedPrefixBlob, remainderBlob],
                    { type: obfuscatedResourceBlob.type });

                callback(deobfuscatedBlob);
            });
        }

        function embeddedFontDeobfuscateIdpf(obfuscatedResourceBlob, callback) {

            var prefixLength = 1040;
            // Shamelessly copied from
            // https://github.com/readium/readium-chrome-extension/blob/26d4b0cafd254cfa93bf7f6225887b83052642e0/scripts/models/path_resolver.js#L102 :
            xorObfuscatedBlob(obfuscatedResourceBlob, prefixLength, encryptionData.uidHash, callback);
        }

        function urnUuidToByteArray(id) {
            var uuidRegexp = /(urn:uuid:)?([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})/i;
            var matchResults = uuidRegexp.exec(id);
            var rawUuid = matchResults[2] + matchResults[3] + matchResults[4] + matchResults[5] + matchResults[6];
            if (!rawUuid || rawUuid.length != 32) {
                console.error('Bad UUID format for ID :' + id);
            }
            var byteArray = [];
            for (var i = 0; i < 16; i++) {
                var byteHex = rawUuid.substr(i * 2, 2);
                var byteNumber = parseInt(byteHex, 16);
                byteArray.push(byteNumber);
            }
            return byteArray;
        }

        function embeddedFontDeobfuscateAdobe(obfuscatedResourceBlob, callback) {

            // extract the UUID and convert to big-endian binary form (16 bytes):
            var uidWordArray = urnUuidToByteArray(encryptionData.uid);
            var prefixLength = 1024;
            xorObfuscatedBlob(obfuscatedResourceBlob, prefixLength, uidWordArray, callback)
        }


        // PUBLIC API

        this.isEncryptionSpecified = function () {
            return encryptionData && encryptionData.encryptions;
        };


        this.getEncryptionMethodForRelativePath = function (pathRelativeToRoot) {
            if (self.isEncryptionSpecified()) {
                return encryptionData.encryptions[pathRelativeToRoot];
            } else {
                return undefined;
            }
        };

        this.getDecryptionFunctionForRelativePath = function (pathRelativeToRoot) {
            var encryptionMethod = self.getEncryptionMethodForRelativePath(pathRelativeToRoot);
            if (encryptionMethod && ENCRYPTION_METHODS[encryptionMethod]) {
                return ENCRYPTION_METHODS[encryptionMethod];
            } else {
                return undefined;
            }
        };

    };

    EncryptionHandler.CreateEncryptionData =  function(id, encryptionDom) {

        var encryptionData = {
            uid: id,
            uidHash: SHA1(unescape(encodeURIComponent(id.trim())), { asBytes: true }),
            encryptions: undefined
        };

        var encryptedData = $('EncryptedData', encryptionDom);
        encryptedData.each(function (index, encryptedData) {
            var encryptionAlgorithm = $('EncryptionMethod', encryptedData).first().attr('Algorithm');

            // For some reason, jQuery selector "" against XML DOM sometimes doesn't match properly
            var cipherReference = $('CipherReference', encryptedData);
            cipherReference.each(function (index, CipherReference) {
                var cipherReferenceURI = $(CipherReference).attr('URI');
                console.log('Encryption/obfuscation algorithm ' + encryptionAlgorithm + ' specified for ' +
                    cipherReferenceURI);

                if(!encryptionData.encryptions) {
                    encryptionData.encryptions = {};
                }

                encryptionData.encryptions[cipherReferenceURI] = encryptionAlgorithm;
            });
        });

        return encryptionData;
    };

    return EncryptionHandler;
});
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

define('epub-fetch/publication_fetcher',['jquery', 'URIjs', './markup_parser', './plain_resource_fetcher', './zip_resource_fetcher',
    './content_document_fetcher', './resource_cache', './encryption_handler'],
    function ($, URI, MarkupParser, PlainResourceFetcher, ZipResourceFetcher, ContentDocumentFetcher,
              ResourceCache, EncryptionHandler) {

    var PublicationFetcher = function(bookRoot, jsLibRoot, sourceWindow, cacheSizeEvictThreshold, contentDocumentTextPreprocessor) {

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

        var _contentDocumentTextPreprocessor = contentDocumentTextPreprocessor;

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
            var rootFile = $('rootfile', containerXmlDom);
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

define('epub-fetch', ['epub-fetch/publication_fetcher'], function (main) { return main; });

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

define('epub-model/package_document',['jquery', 'underscore', 'URIjs'],
    function ($, _, URI) {

    // Description: This model provides an interface for navigating an EPUB's package document
    var PackageDocument = function(packageDocumentURL, resourceFetcher, metadata, spine, manifest) {

        var _page_prog_dir;

        this.manifest = manifest;

        this.getSharedJsPackageData = function () {

            var packageDocRoot = packageDocumentURL.substr(0, packageDocumentURL.lastIndexOf("/"));
            return {
                rootUrl : packageDocRoot,
                rendition_viewport : metadata.rendition_viewport,
                rendition_layout : metadata.rendition_layout,
                rendition_orientation : metadata.rendition_orientation,
                rendition_flow : metadata.rendition_flow,
                rendition_spread : metadata.rendition_spread,
                media_overlay : metadata.media_overlay,
                spine : {
                    direction : this.getPageProgressionDirection(),
                    items : spine
                }
            };
        };

        /**
         * Get spine item data in readium-shared-js accepted format.
         * @param spineIndex the index of the item within the spine
         * @returns Spine item data in readium-shared-js accepted format.
         */
        this.getSpineItem = function(spineIndex) {
            var spineItem = spine[spineIndex];
            return spineItem;
        };

        this.setPageProgressionDirection = function(page_prog_dir) {
            _page_prog_dir = page_prog_dir;
        };


        this.getPageProgressionDirection = function() {
            if (_page_prog_dir === "rtl") {
                return "rtl";
            }
            else if (_page_prog_dir === "default") {
                return "default";
            }
            else {
                return "ltr";
            }
        };

        this.spineLength = function() {
            return spine.length;
        };

        this.getMetadata = function() {
            return metadata;
        };

        this.getToc = function() {
            var item = getTocItem();
            if (item) {
                return item.href;
            }
            return null;
        };

        this.getTocText = function(callback) {
            var toc = this.getToc();

            resourceFetcher.relativeToPackageFetchFileContents(toc, 'text', function (tocDocumentText) {
                callback(tocDocumentText)
            }, function (err) {
                console.error('ERROR fetching TOC from [' + toc + ']:');
                console.error(err);
                callback(undefined);
            });
        };

        this.getTocDom = function(callback) {

            this.getTocText(function (tocText) {
                if (typeof tocText === 'string') {
                    var tocDom = (new DOMParser()).parseFromString(tocText, "text/xml");
                    callback(tocDom);
                } else {
                    callback(undefined);
                }
            });
        };


        // Used in EpubReader (readium-js-viewer)
        // https://github.com/readium/readium-js-viewer/blob/develop/lib/EpubReader.js#L59
        this.generateTocListDOM = function(callback) {
            var that = this;
            this.getTocDom(function (tocDom) {
                if (tocDom) {
                    if (tocIsNcx()) {
                        var $ncxOrderedList;
                        $ncxOrderedList = getNcxOrderedList($("navMap", tocDom));
                        callback($ncxOrderedList[0]);
                    } else {
                        var packageDocumentAbsoluteURL = new URI(packageDocumentURL).absoluteTo(document.URL);
                        var tocDocumentAbsoluteURL = new URI(that.getToc()).absoluteTo(packageDocumentAbsoluteURL);
                        // add a BASE tag to change the TOC document's baseURI.
                        var oldBaseTag = $(tocDom).remove('base');
                        var newBaseTag = $('<base></base>');
                        $(newBaseTag).attr('href', tocDocumentAbsoluteURL);
                        $(tocDom).find('head').append(newBaseTag);
                        // TODO: fix TOC hrefs both for exploded in zipped EPUBs
                        callback(tocDom);
                    }
                } else {
                    callback(undefined);
                }
            });
        };

        function tocIsNcx() {

            var tocItem = getTocItem();
            var contentDocURI = tocItem.href;
            var fileExtension = contentDocURI.substr(contentDocURI.lastIndexOf('.') + 1);

            return fileExtension.trim().toLowerCase() === "ncx";
        }

        // ----------------------- PRIVATE HELPERS -------------------------------- //

        function getNcxOrderedList($navMapDOM) {

            var $ol = $("<ol></ol>");
            $.each($navMapDOM.children("navPoint"), function (index, navPoint) {
                addNavPointElements($(navPoint), $ol);
            });
            return $ol;
        }

        // Description: Constructs an html representation of NCX navPoints, based on an object of navPoint information
        // Rationale: This is a recursive method, as NCX navPoint elements can nest 0 or more of themselves as children
        function addNavPointElements($navPointDOM, $ol) {

            // Add the current navPoint element to the TOC html
            var navText = $navPointDOM.children("navLabel").text().trim();
            var navHref = $navPointDOM.children("content").attr("src");
            var $navPointLi = $('<li class="nav-elem"></li>').append(
                $('<a></a>', { href: navHref, text: navText })
            );

            // Append nav point info
            $ol.append($navPointLi);

            // Append ordered list of nav points
            if ($navPointDOM.children("navPoint").length > 0 ) {

                var $newLi = $("<li></li>");
                var $newOl = $("<ol></ol>");
                $.each($navPointDOM.children("navPoint"), function (navIndex, navPoint) {
                    $newOl.append(addNavPointElements($(navPoint), $newOl));
                });

                $newLi.append($newOl);
                $ol.append($newLi);
            }
        }

        function getTocItem(){

            var item = manifest.getNavItem();
            if (item) {
                return item;
            }

            var spine_id = metadata.ncx;
            if (spine_id && spine_id.length > 0) {
                return manifest.getManifestItemByIdref(spine_id);
            }

            return null;
        }

    };

    return PackageDocument;
});

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

define('epub-model/smil_document_parser',['jquery', 'underscore'], function ($, _) {

    // `SmilDocumentParser` is used to parse the xml of an epub package
    // document and build a javascript object. The constructor accepts an
    // instance of `URI` that is used to resolve paths during the process
    var SmilDocumentParser = function(packageDocument, publicationFetcher) {

        // Parse a media overlay manifest item XML
        this.parse = function(spineItem, manifestItemSMIL, smilJson, deferred, callback, errorCallback) {
            var that = this;
            publicationFetcher.getRelativeXmlFileDom(manifestItemSMIL.href, function(xmlDom) {

                var smil = $("smil", xmlDom)[0];
                smilJson.smilVersion = smil.getAttribute('version');

                //var body = $("body", xmlDom)[0];
                smilJson.children = that.getChildren(smil);
                smilJson.href = manifestItemSMIL.href;
                smilJson.id = manifestItemSMIL.id;
                smilJson.spineItemId = spineItem.idref;

                var mediaItem = packageDocument.getMetadata().getMediaItemByRefinesId(manifestItemSMIL.id);
                if (mediaItem) {
                    smilJson.duration = mediaItem.duration;
                }

                callback(deferred, smilJson);
            }, function(fetchError) {
                errorCallback(deferred, fetchError);
            });
        };

        var safeCopyProperty = function(property, fromNode, toItem, isRequired, defaultValue) {
            var propParse = property.split(':');
            var destProperty = propParse[propParse.length - 1];

            if (destProperty === "type") {
                destProperty = "epubtype";
            }
            
            if (fromNode.getAttribute(property) != undefined) {
                toItem[destProperty] = fromNode.getAttribute(property);
            } else if (isRequired) {
                if (defaultValue !== undefined) {
                    toItem[destProperty] = defaultValue;
                } else {
                    console.log("Required property " + property + " not found in smil node " + fromNode.nodeName);
                }
            }
        };

        this.getChildren = function(element) {
            var that = this;
            var children = [];

            $.each(element.childNodes, function(elementIndex, currElement) {

                if (currElement.nodeType === 1) { // ELEMENT
                    var item = that.createItemFromElement(currElement);
                    if (item) {
                        children.push(item);
                    }
                }
            });

            return children;
        }

        this.createItemFromElement = function(element) {
            var that = this;

            var item = {};
            item.nodeType = element.nodeName;
            
            var isBody = false;
            if (item.nodeType === "body")
            {
                isBody = true;
                item.nodeType = "seq";
            }

            if (item.nodeType === "seq") {

                safeCopyProperty("epub:textref", element, item, !isBody);
                safeCopyProperty("id", element, item);
                safeCopyProperty("epub:type", element, item);

                item.children = that.getChildren(element);

            } else if (item.nodeType === "par") {

                safeCopyProperty("id", element, item);
                safeCopyProperty("epub:type", element, item);

                item.children = that.getChildren(element);

            } else if (item.nodeType === "text") {

                safeCopyProperty("src", element, item, true);
                var srcParts = item.src.split('#');
                item.srcFile = srcParts[0];
                item.srcFragmentId = (srcParts.length === 2) ? srcParts[1] : "";
                safeCopyProperty("id", element, item);
                // safeCopyProperty("epub:textref", element, item);

            } else if (item.nodeType === "audio") {
                safeCopyProperty("src", element, item, true);
                safeCopyProperty("id", element, item);
                item.clipBegin = SmilDocumentParser.resolveClockValue(element.getAttribute("clipBegin"));
                item.clipEnd = SmilDocumentParser.resolveClockValue(element.getAttribute("clipEnd"));
            }
            else
            {
                return undefined;
            }

            return item;
        }

        function makeFakeSmilJson(spineItem) {
            return {
                id: "",
                href: "",
                spineItemId: spineItem.idref,
                children: [{
                    nodeType: 'seq',
                    textref: spineItem.href,
                    children: [{
                        nodeType: 'par',
                        children: [{
                            nodeType: 'text',
                            src: spineItem.href,
                            srcFile: spineItem.href,
                            srcFragmentId: ""
                        }]
                    }]
                }]
            };
        }

        this.fillSmilData = function(callback) {
            var that = this;

            if (packageDocument.spineLength() <= 0) {
                callback();
                return;
            }

            var allFakeSmil = true;
            var mo_map = [];
            var parsingDeferreds = [];

            for (var spineIdx = 0; spineIdx < packageDocument.spineLength(); spineIdx++) {
                var spineItem = packageDocument.getSpineItem(spineIdx);

                if (spineItem.media_overlay_id) {
                    var manifestItemSMIL = packageDocument.manifest.getManifestItemByIdref(spineItem.media_overlay_id);

                    if (!manifestItemSMIL) {
                        console.error("Cannot find SMIL manifest item for spine/manifest item?! " + spineItem.media_overlay_id);
                        continue;
                    }
                    //ASSERT manifestItemSMIL.media_type === "application/smil+xml"

                    var parsingDeferred = $.Deferred();
                    parsingDeferred.media_overlay_id = spineItem.media_overlay_id;
                    parsingDeferreds.push(parsingDeferred);
                    var smilJson = {};

                    // Push the holder object onto the map early so that order isn't disturbed by asynchronicity:
                    mo_map.push(smilJson);

                    // The local parsingDeferred variable will have its value replaced on next loop iteration.
                    // Must pass the parsingDeferred through async calls as an argument and it arrives back as myDeferred.
                    that.parse(spineItem, manifestItemSMIL, smilJson, parsingDeferred, function(myDeferred, smilJson) {
                        allFakeSmil = false;
                        myDeferred.resolve();
                    }, function(myDeferred, parseError) {
                        console.log('Error when parsing SMIL manifest item ' + manifestItemSMIL.href + ':');
                        console.log(parseError);
                        myDeferred.resolve();
                    });
                } else {
                    mo_map.push(makeFakeSmilJson(spineItem));
                }
            }

            $.when.apply($, parsingDeferreds).done(function() {
                packageDocument.getMetadata().setMoMap(mo_map);
                if (allFakeSmil) {
                    console.log("No Media Overlays");
                    packageDocument.getMetadata().setMoMap([]);
                }
                callback();
            });
        }
    };

    // parse the timestamp and return the value in seconds
    // supports this syntax:
    // http://idpf.org/epub/30/spec/epub30-mediaoverlays.html#app-clock-examples
    SmilDocumentParser.resolveClockValue = function(value) {
        if (!value) return 0;

        var hours = 0;
        var mins = 0;
        var secs = 0;

        if (value.indexOf("min") != -1) {
            mins = parseFloat(value.substr(0, value.indexOf("min")));
        } else if (value.indexOf("ms") != -1) {
            var ms = parseFloat(value.substr(0, value.indexOf("ms")));
            secs = ms / 1000;
        } else if (value.indexOf("s") != -1) {
            secs = parseFloat(value.substr(0, value.indexOf("s")));
        } else if (value.indexOf("h") != -1) {
            hours = parseFloat(value.substr(0, value.indexOf("h")));
        } else {
            // parse as hh:mm:ss.fraction
            // this also works for seconds-only, e.g. 12.345
            var arr = value.split(":");
            secs = parseFloat(arr.pop());
            if (arr.length > 0) {
                mins = parseFloat(arr.pop());
                if (arr.length > 0) {
                    hours = parseFloat(arr.pop());
                }
            }
        }
        var total = hours * 3600 + mins * 60 + secs;
        return total;
    }
    
    return SmilDocumentParser;
});

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

define('epub-model/metadata',['underscore'],
    function (_) {

        var Metadata = function () {

            var that = this;

            var _mediaItemIndexByRefinesId = {};

            /**
             * Iterate over media items and apply callback (synchronously) on each one of them.
             * @param iteratorCallback the iterator callback function, will be called once for each media item,
             * and the item will be passed as the (one and only) argument.
             * @returns the Metadata object for chaining.
             */
            this.eachMediaItem = function(iteratorCallback) {
                if (that.mediaItems) {
                    _.each(that.mediaItems, iteratorCallback);
                }
                return this;
            };

            this.getMediaItemByRefinesId = function(id) {
                return _mediaItemIndexByRefinesId[id];
            };

            this.setMoMap = function(mediaOverlaysMap) {
                that.media_overlay.smil_models = mediaOverlaysMap;
            };

            // Initialize indexes
            this.eachMediaItem(function(item) {
                var id = item.refines;
                var hash = id.indexOf('#');
                if (hash >= 0) {
                    var start = hash+1;
                    var end = id.length-1;
                    id = id.substr(start, end);
                }
                id = id.trim();

                _mediaItemIndexByRefinesId[id] = item;
            });


        };
        return Metadata;
    });
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

define('epub-model/manifest',['underscore'],
    function (_) {

        var Manifest = function (manifestJson) {

            var _manifestIndexById = {};
            var _navItem;

            this.manifestLength = function() {
                return manifestJson.length;
            };

            this.getManifestItemByIdref = function (idref) {
                return _manifestIndexById[idref];
            };

            /**
             * Iterate over manifest items and apply callback (synchronously) on each one of them.
             * @param iteratorCallback the iterator callback function, will be called once for each manifest item,
             * and the item will be passed as the (one and only) argument.
             * @returns the Manifest object for chaining.
             */
            this.each = function(iteratorCallback) {
                _.each(manifestJson, iteratorCallback);
                return this;
            };

            this.getNavItem = function () {
                return _navItem;
            };

            // Initialize indexes
            this.each(function(manifestItem) {
                _manifestIndexById[manifestItem.id] = manifestItem;

                if (manifestItem.properties && manifestItem.properties.indexOf("nav") !== -1) {
                    _navItem = manifestItem;
                }
            });

        };
        return Manifest;
    });
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

define('epub-model/package_document_parser',['jquery', 'underscore', 'epub-fetch/markup_parser', 'URIjs', './package_document',
        './smil_document_parser', './metadata', './manifest'],
    function($, _, MarkupParser, URI, PackageDocument, SmilDocumentParser, Metadata,
             Manifest) {

        // `PackageDocumentParser` is used to parse the xml of an epub package
    // document and build a javascript object. The constructor accepts an
    // instance of `URI` that is used to resolve paths during the process
    var PackageDocumentParser = function(bookRoot, publicationFetcher) {

        var _packageFetcher = publicationFetcher;
        var _deferredXmlDom = $.Deferred();
        var _xmlDom;

        function onError(error) {
            if (error) {
                if (error.message) {
                    console.error(error.message);
                }
                if (error.stack) {
                    console.error(error.stack);
                }
            }
        }

        publicationFetcher.getPackageDom(function(packageDom){
            _xmlDom = packageDom;
            _deferredXmlDom.resolve(packageDom);
        }, onError);

        function fillSmilData(packageDocument, callback) {

            var smilParser = new SmilDocumentParser(packageDocument, publicationFetcher);

            smilParser.fillSmilData(function() {

                // return the parse result
                callback(packageDocument);
            });

        }

        // Parse an XML package document into a javascript object
        this.parse = function(callback) {

            _deferredXmlDom.done(function (xmlDom) {
                var metadata = getMetadata(xmlDom);

                var spineElem = xmlDom.getElementsByTagNameNS("*", "spine")[0];
                var page_prog_dir = getElemAttr(xmlDom, 'spine', "page-progression-direction");

                // TODO: Bindings are unused
                var bindings = getJsonBindings(xmlDom);

                var manifest = new Manifest(getJsonManifest(xmlDom));
                var spine = getJsonSpine(xmlDom, manifest, metadata);

                // try to find a cover image
                var cover = getCoverHref(xmlDom);
                if (cover) {
                    metadata.cover_href = cover;
                }

                $.when(updateMetadataWithIBookProperties(metadata)).then(function() {

                    _packageFetcher.setPackageMetadata(metadata, function () {
                        var packageDocument = new PackageDocument(publicationFetcher.getPackageUrl(),
                            publicationFetcher, metadata, spine, manifest);

                        packageDocument.setPageProgressionDirection(page_prog_dir);
                        fillSmilData(packageDocument, callback);
                    });
                });

            });
        };

        function updateMetadataWithIBookProperties(metadata) {

            var dff = $.Deferred();

            //if layout not set
            if(!metadata.rendition_layout)
            {
                var pathToIBooksSpecificXml = "/META-INF/com.apple.ibooks.display-options.xml";

                publicationFetcher.relativeToPackageFetchFileContents(pathToIBooksSpecificXml, 'text', function (ibookPropText) {
                    if(ibookPropText) {
                        var parser = new MarkupParser();
                        var propModel = parser.parseXml(ibookPropText);
                        var fixLayoutProp = $("option[name=fixed-layout]", propModel)[0];
                        if(fixLayoutProp) {
                            var fixLayoutVal = $(fixLayoutProp).text();
                            if(fixLayoutVal === "true") {
                                metadata.rendition_layout = "pre-paginated";
                                console.log("using com.apple.ibooks.display-options.xml fixed-layout property");
                            }
                        }
                    }

                    dff.resolve();

                }, function (err) {

                    console.log("com.apple.ibooks.display-options.xml not found");
                    dff.resolve();
                });
            }
            else {
                dff.resolve();
            }

            return dff.promise();
        }


        function getJsonSpine(xmlDom, manifest, metadata) {

            var $spineElements;
            var jsonSpine = [];

            $spineElements = $(findXmlElemByLocalNameAnyNS(xmlDom,"spine")).children();
            $.each($spineElements, function (spineElementIndex, currSpineElement) {

                var $currSpineElement = $(currSpineElement);
                var idref = $currSpineElement.attr("idref") ? $currSpineElement.attr("idref") : "";
                var manifestItem = manifest.getManifestItemByIdref(idref);

                var id = $currSpineElement.attr("id");
                var viewport = undefined;
                _.each(metadata.rendition_viewports, function(vp) {
                    if (vp.refines == id) {
                        viewport = vp.viewport;
                        return true; // break
                    }
                });

                var spineItem = {
                    rendition_viewport: viewport,
                    idref: idref,
                    href: manifestItem.href,
                    manifest_id: manifestItem.id,
                    media_type: manifestItem.media_type,
                    media_overlay_id: manifestItem.media_overlay_id,
                    linear: $currSpineElement.attr("linear") ? $currSpineElement.attr("linear") : "",
                    properties: $currSpineElement.attr("properties") ? $currSpineElement.attr("properties") : ""
                };

                var parsedProperties = parsePropertiesString(spineItem.properties);
                _.extend(spineItem, parsedProperties);

                jsonSpine.push(spineItem);
            });

            return jsonSpine;
        }

        function findXmlElemByLocalNameAnyNS(rootElement, localName, predicate) {
            var elements = rootElement.getElementsByTagNameNS("*", localName);
            if (predicate) {
                return _.find(elements, predicate);
            } else {
                return elements[0];
            }
        }

        function filterXmlElemsByLocalNameAnyNS(rootElement, localName, predicate) {
            var elements = rootElement.getElementsByTagNameNS("*", localName);
            return _.filter(elements, predicate);
        }

        function getElemText(rootElement, localName, predicate) {
            var foundElement = findXmlElemByLocalNameAnyNS(rootElement, localName, predicate);
            if (foundElement) {
                return foundElement.textContent;
            } else {
                return '';
            }
        }

        function getElemAttr(rootElement, localName, attrName, predicate) {
            var foundElement = findXmlElemByLocalNameAnyNS(rootElement, localName, predicate);
            if (foundElement) {
                return foundElement.getAttribute(attrName);
            } else {
                return '';
            }
        }

        function getMetaElemPropertyText(rootElement, attrPropertyValue) {

            var foundElement = findXmlElemByLocalNameAnyNS(rootElement, "meta", function (element) {
                return element.getAttribute("property") === attrPropertyValue;
            });

            if (foundElement) {
                return foundElement.textContent;
            } else {
                return '';
            }
        }


        function getMetadata(xmlDom) {

            var metadata = new Metadata();
            var metadataElem = findXmlElemByLocalNameAnyNS(xmlDom, "metadata");
            var packageElem = findXmlElemByLocalNameAnyNS(xmlDom, "package");
            var spineElem = findXmlElemByLocalNameAnyNS(xmlDom, "spine");


            metadata.author = getElemText(metadataElem, "creator");
            metadata.description = getElemText(metadataElem, "description");
            metadata.epub_version =
                packageElem.getAttribute("version") ? packageElem.getAttribute("version") : "";
            metadata.id = getElemText(metadataElem,"identifier");
            metadata.language = getElemText(metadataElem, "language");
            metadata.modified_date = getMetaElemPropertyText(metadataElem, "dcterms:modified");
            metadata.ncx = spineElem.getAttribute("toc") ? spineElem.getAttribute("toc") : "";
            metadata.pubdate = getElemText(metadataElem, "date");
            metadata.publisher = getElemText(metadataElem, "publisher");
            metadata.rights = getElemText(metadataElem, "rights");
            metadata.title = getElemText(metadataElem, "title");

            metadata.rendition_orientation = getMetaElemPropertyText(metadataElem, "rendition:orientation");
            metadata.rendition_layout = getMetaElemPropertyText(metadataElem, "rendition:layout");
            metadata.rendition_spread = getMetaElemPropertyText(metadataElem, "rendition:spread");
            metadata.rendition_flow = getMetaElemPropertyText(metadataElem, "rendition:flow");






            //http://www.idpf.org/epub/301/spec/epub-publications.html#fxl-property-viewport
            
            //metadata.rendition_viewport = getMetaElemPropertyText(metadataElem, "rendition:viewport");
            metadata.rendition_viewport = getElemText(metadataElem, "meta", function (element) {
                return element.getAttribute("property") === "rendition:viewport" && !element.hasAttribute("refines")
            });

            var viewports = [];
            var viewportMetaElems = filterXmlElemsByLocalNameAnyNS(metadataElem, "meta", function (element) {
                return element.getAttribute("property") === "rendition:viewport" && element.hasAttribute("refines");
            });
            _.each(viewportMetaElems, function(currItem) {
                var id = currItem.getAttribute("refines");
                if (id) {
                    var hash = id.indexOf('#');
                    if (hash >= 0) {
                        var start = hash+1;
                        var end = id.length-1;
                        id = id.substr(start, end);
                    }
                    id = id.trim();
                }
                
                var vp = {
                  refines: id,
                  viewport: currItem.textContent
                };
                viewports.push(vp);
            });
            
            metadata.rendition_viewports = viewports;

            
            
            
            
            
            // Media part
            metadata.mediaItems = [];

            var overlayElems = filterXmlElemsByLocalNameAnyNS(metadataElem, "meta", function (element) {
                return element.getAttribute("property") === "media:duration" && element.hasAttribute("refines");
            });

            _.each(overlayElems, function(currItem) {
                metadata.mediaItems.push({
                  refines: currItem.getAttribute("refines"),
                  duration: SmilDocumentParser.resolveClockValue(currItem.textContent)
               });
            });

            metadata.media_overlay = {
                duration: SmilDocumentParser.resolveClockValue(
                    getElemText(metadataElem, "meta", function (element) {
                        return element.getAttribute("property") === "media:duration" && !element.hasAttribute("refines")
                    })
                ),
                narrator: getMetaElemPropertyText(metadataElem, "media:narrator"),
                activeClass: getMetaElemPropertyText(metadataElem, "media:active-class"),
                playbackActiveClass: getMetaElemPropertyText(metadataElem, "media:playback-active-class"),
                smil_models: [],
                skippables: ["sidebar", "practice", "marginalia", "annotation", "help", "note", "footnote", "rearnote",
                    "table", "table-row", "table-cell", "list", "list-item", "pagebreak"],
                escapables: ["sidebar", "bibliography", "toc", "loi", "appendix", "landmarks", "lot", "index",
                    "colophon", "epigraph", "conclusion", "afterword", "warning", "epilogue", "foreword",
                    "introduction", "prologue", "preface", "preamble", "notice", "errata", "copyright-page",
                    "acknowledgments", "other-credits", "titlepage", "imprimatur", "contributors", "halftitlepage",
                    "dedication", "help", "annotation", "marginalia", "practice", "note", "footnote", "rearnote",
                    "footnotes", "rearnotes", "bridgehead", "page-list", "table", "table-row", "table-cell", "list",
                    "list-item", "glossary"]
            };

            return metadata;
        }

        function getJsonManifest(xmlDom) {

            var $manifestItems = $(findXmlElemByLocalNameAnyNS(xmlDom, "manifest")).children();
            var jsonManifest = [];

            $.each($manifestItems, function (manifestElementIndex, currManifestElement) {

                var $currManifestElement = $(currManifestElement);
                var currManifestElementHref = $currManifestElement.attr("href") ? $currManifestElement.attr("href") :
                    "";
                var manifestItem = {

                    href: currManifestElementHref,
                    id: $currManifestElement.attr("id") ? $currManifestElement.attr("id") : "",
                    media_overlay_id: $currManifestElement.attr("media-overlay") ?
                        $currManifestElement.attr("media-overlay") : "",
                    media_type: $currManifestElement.attr("media-type") ? $currManifestElement.attr("media-type") : "",
                    properties: $currManifestElement.attr("properties") ? $currManifestElement.attr("properties") : ""
                };
                // console.log('pushing manifest item to JSON manifest. currManifestElementHref: [' + currManifestElementHref + 
                //     '], manifestItem.href: [' + manifestItem.href +
                //     '], manifestItem:');
                // console.log(manifestItem);
                jsonManifest.push(manifestItem);
            });

            return jsonManifest;
        }

        function getJsonBindings(xmlDom) {

            var $bindings = $(findXmlElemByLocalNameAnyNS(xmlDom, "bindings")).children();
            var jsonBindings = [];

            $.each($bindings, function (bindingElementIndex, currBindingElement) {

                var $currBindingElement = $(currBindingElement);
                var binding = {

                    handler: $currBindingElement.attr("handler") ? $currBindingElement.attr("handler") : "",
                    media_type: $currBindingElement.attr("media-type") ? $currBindingElement.attr("media-type") : ""
                };

                jsonBindings.push(binding);
            });

            return jsonBindings;
        }

        function getCoverHref(xmlDom) {

            var manifest;
            var $imageNode;
            manifest = findXmlElemByLocalNameAnyNS(xmlDom, "manifest");

            // epub3 spec for a cover image is like this:
            /*<item properties="cover-image" id="ci" href="cover.svg" media-type="image/svg+xml" />*/
            $imageNode = $(findXmlElemByLocalNameAnyNS(manifest, "item", function (element) {
                var attr = element.getAttribute("properties");
                return attr && _.contains(attr.split(" "), "cover-image");
            }));
            if ($imageNode.length === 1 && $imageNode.attr("href")) {
                return $imageNode.attr("href");
            }

            // some epub2's cover image is like this:
            /*<meta name="cover" content="cover-image-item-id" />*/
            var metaNode = $(findXmlElemByLocalNameAnyNS(xmlDom, "meta", function (element) {
                return element.getAttribute("name") === "cover";
            }));
            var contentAttr = metaNode.attr("content");
            if (metaNode.length === 1 && contentAttr) {
                $imageNode = $(findXmlElemByLocalNameAnyNS(manifest, "item", function (element) {
                    return element.getAttribute("id") === contentAttr;
                }));
                if ($imageNode.length === 1 && $imageNode.attr("href")) {
                    return $imageNode.attr("href");
                }
            }

            // that didn't seem to work so, it think epub2 just uses item with id=cover
            $imageNode = $(findXmlElemByLocalNameAnyNS(manifest, "item", function (element) {
                return element.getAttribute("id") === "cover";
            }));
            if ($imageNode.length === 1 && $imageNode.attr("href")) {
                return $imageNode.attr("href");
            }

            // seems like there isn't one, thats ok...
            return null;
        }

        function parsePropertiesString(str) {
            var properties = {};
            var allPropStrs = str.split(" "); // split it on white space
            for (var i = 0; i < allPropStrs.length; i++) {

                //ReadiumSDK.Models.SpineItem.RENDITION_ORIENTATION_LANDSCAPE
                if (allPropStrs[i] === "rendition:orientation-landscape") properties.rendition_orientation = "landscape";

                //ReadiumSDK.Models.SpineItem.RENDITION_ORIENTATION_PORTRAIT
                if (allPropStrs[i] === "rendition:orientation-portrait") properties.rendition_orientation = "portrait";

                //ReadiumSDK.Models.SpineItem.RENDITION_ORIENTATION_AUTO
                if (allPropStrs[i] === "rendition:orientation-auto") properties.rendition_orientation = "auto";


                //ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_NONE
                if (allPropStrs[i] === "rendition:spread-none") properties.rendition_spread = "none";

                //ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_LANDSCAPE
                if (allPropStrs[i] === "rendition:spread-landscape") properties.rendition_spread = "landscape";

                //ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_PORTRAIT
                if (allPropStrs[i] === "rendition:spread-portrait") properties.rendition_spread = "portrait";

                //ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_BOTH
                if (allPropStrs[i] === "rendition:spread-both") properties.rendition_spread = "both";

                //ReadiumSDK.Models.SpineItem.RENDITION_SPREAD_AUTO
                if (allPropStrs[i] === "rendition:spread-auto") properties.rendition_spread = "auto";


                //ReadiumSDK.Models.SpineItem.RENDITION_FLOW_PAGINATED
                if (allPropStrs[i] === "rendition:flow-paginated") properties.rendition_flow = "paginated";

                //ReadiumSDK.Models.SpineItem.RENDITION_FLOW_SCROLLED_CONTINUOUS
                if (allPropStrs[i] === "rendition:flow-scrolled-continuous") properties.rendition_flow = "scrolled-continuous";

                //ReadiumSDK.Models.SpineItem.RENDITION_FLOW_SCROLLED_DOC
                if (allPropStrs[i] === "rendition:flow-scrolled-doc") properties.rendition_flow = "scrolled-doc";

                //ReadiumSDK.Models.SpineItem.RENDITION_FLOW_AUTO
                if (allPropStrs[i] === "rendition:flow-auto") properties.rendition_flow = "auto";



                //ReadiumSDK.Models.SpineItem.SPREAD_CENTER
                if (allPropStrs[i] === "rendition:page-spread-center") properties.page_spread = "page-spread-center";

                //ReadiumSDK.Models.SpineItem.SPREAD_LEFT
                if (allPropStrs[i] === "page-spread-left") properties.page_spread = "page-spread-left";

                //ReadiumSDK.Models.SpineItem.SPREAD_RIGHT
                if (allPropStrs[i] === "page-spread-right") properties.page_spread = "page-spread-right";

                //ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_REFLOWABLE
                if (allPropStrs[i] === "rendition:layout-reflowable") {
                    properties.fixed_flow = false; // TODO: only used in spec tests!
                    properties.rendition_layout = "reflowable";
                }

                //ReadiumSDK.Models.SpineItem.RENDITION_LAYOUT_PREPAGINATED
                if (allPropStrs[i] === "rendition:layout-pre-paginated") {
                    properties.fixed_flow = true; // TODO: only used in spec tests!
                    properties.rendition_layout = "pre-paginated";
                }
            }
            return properties;
        }

    };

    return PackageDocumentParser;
});

define('epub-model', ['epub-model/package_document_parser'], function (main) { return main; });

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

define('epub-fetch/iframe_zip_loader',['URIjs', 'views/iframe_loader', 'underscore'], function(URI, IFrameLoader, _){

    var zipIframeLoader = function( getCurrentResourceFetcher, contentDocumentTextPreprocessor) {

        var basicIframeLoader = new IFrameLoader();

        var self = this;
        
        var _contentDocumentTextPreprocessor = contentDocumentTextPreprocessor;

        this.addIFrameEventListener = function (eventName, callback, context) {
            basicIframeLoader.addIFrameEventListener(eventName, callback, context);
        };

        this.updateIframeEvents = function (iframe) {
            basicIframeLoader.updateIframeEvents(iframe);
        };
        
        this.loadIframe = function(iframe, src, callback, caller, attachedData) {

            var loadedDocumentUri = new URI(src).absoluteTo(iframe.baseURI).search('').hash('').toString();

            var shouldConstructDomProgrammatically = getCurrentResourceFetcher().shouldConstructDomProgrammatically();
            if (shouldConstructDomProgrammatically) {

                    getCurrentResourceFetcher().fetchContentDocument(attachedData, loadedDocumentUri,
                        function (resolvedContentDocumentDom) {
                            self._loadIframeWithDocument(iframe,
                                attachedData,
                                resolvedContentDocumentDom.documentElement.outerHTML,
                                function () {
                                    callback.call(caller, true, attachedData);
                                });
                        }, function (err) {
                            callback.call(caller, false, attachedData);
                        }
                    );
            } else {
                fetchContentDocument(loadedDocumentUri, function (contentDocumentHtml) {
                      if (!contentDocumentHtml) {
                          //failed to load content document
                          callback.call(caller, false, attachedData);
                      } else {
                          self._loadIframeWithDocument(iframe, attachedData, contentDocumentHtml, function () {
                              callback.call(caller, true, attachedData);
                          });
                      }
                });
            }
        };

        this._loadIframeWithDocument = function (iframe, attachedData, contentDocumentData, callback) {

            var isIE = (window.navigator.userAgent.indexOf("Trident") > 0);
            if (!isIE) {
                var contentType = 'text/html';
                if (attachedData.spineItem.media_type && attachedData.spineItem.media_type.length) {
                    contentType = attachedData.spineItem.media_type;
                }

                var documentDataUri = window.URL.createObjectURL(
                    new Blob([contentDocumentData], {'type': contentType})
                );
            } else {
                // Internet Explorer doesn't handle loading documents from Blobs correctly.
                // TODO: Currently using the document.write() approach only for IE, as it breaks CSS selectors
                // with namespaces for some reason (e.g. the childrens-media-query sample EPUB)
                iframe.contentWindow.document.open();
                
                // Currently not handled automatically by winstore-jscompat,
                // so we're doing it manually. See:
                // https://github.com/MSOpenTech/winstore-jscompat/
                if (window.MSApp && window.MSApp.execUnsafeLocalFunction) {
                    window.MSApp.execUnsafeLocalFunction(function() {
                        iframe.contentWindow.document.write(contentDocumentData);
                    });
                } else {
                    iframe.contentWindow.document.write(contentDocumentData);
                }
            }

            iframe.onload = function () {

                self.updateIframeEvents(iframe);

                var mathJax = iframe.contentWindow.MathJax;
                if (mathJax) {
                    // If MathJax is being used, delay the callback until it has completed rendering
                    var mathJaxCallback = _.once(callback);
                    mathJax.Hub.Queue(mathJaxCallback);
                    // Or at an 8 second timeout, which ever comes first
                    // window.setTimeout(mathJaxCallback, 8000);
                } else {
                    callback();
                }

                if (!isIE) {
                    window.URL.revokeObjectURL(documentDataUri);
                }
            };

            if (!isIE) {
                iframe.setAttribute("src", documentDataUri);
            } else {
                iframe.contentWindow.document.close();
            }
        };

        function fetchHtmlAsText(path, callback) {

            $.ajax({
                url: path,
                dataType: 'html',
                async: true,
                success: function (result) {

                    callback(result);
                },
                error: function (xhr, status, errorThrown) {
                    console.error('Error when AJAX fetching ' + path);
                    console.error(status);
                    console.error(errorThrown);
                    callback();
                }
            });
        }

        function fetchContentDocument(src, callback) {

            fetchHtmlAsText(src, function (contentDocumentHtml) {

                if (!contentDocumentHtml) {
                    callback();
                    return;
                }

                if (_contentDocumentTextPreprocessor) {
                    contentDocumentHtml = _contentDocumentTextPreprocessor(src, contentDocumentHtml);
                }

                callback(contentDocumentHtml);
            });
        }
    };

    return zipIframeLoader;
});

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


define('Readium',['text!version.json', 'jquery', 'underscore', 'views/reader_view', 'epub-fetch',
        'epub-model/package_document_parser', 'epub-fetch/iframe_zip_loader', 'views/iframe_loader',
        ],
    function (versionText, $, _, ReaderView, PublicationFetcher,
              PackageParser, IframeZipLoader, IframeLoader) {

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
            readerOptions.iframeLoader = new IframeZipLoader(function() { return _currentPublicationFetcher; }, _contentDocumentTextPreprocessor);
        }
        else{
            readerOptions.iframeLoader = new IframeLoader();
        }
        

        this.reader = new ReaderView(readerOptions);

        this.openPackageDocument = function(bookRoot, callback, openPageRequest)  {
            if (_currentPublicationFetcher) {
                _currentPublicationFetcher.flushCache();
            }

            var cacheSizeEvictThreshold = null;
            if (readiumOptions.cacheSizeEvictThreshold) {
                cacheSizeEvictThreshold = readiumOptions.cacheSizeEvictThreshold;
            }

            _currentPublicationFetcher = new PublicationFetcher(bookRoot, jsLibRoot, window, cacheSizeEvictThreshold, _contentDocumentTextPreprocessor);

            _currentPublicationFetcher.initialize(function() {

                var _packageParser = new PackageParser(bookRoot, _currentPublicationFetcher);

                _packageParser.parse(function(packageDocument){
                    var openBookOptions = readiumOptions.openBookOptions || {};
                    var openBookData = $.extend(packageDocument.getSharedJsPackageData(), openBookOptions);

                    if (openPageRequest) {
                        openBookData.openPageRequest = openPageRequest;
                    }
                    self.reader.openBook(openBookData);

                    var options = {
                        packageDocumentUrl : _currentPublicationFetcher.getPackageUrl(),
                        metadata: packageDocument.getMetadata()
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
                _currentPublicationFetcher.flushCache();
            }
        };

        ReadiumSDK.emit(ReadiumSDK.Events.READER_INITIALIZED, ReadiumSDK.reader);
    };
    
    Readium.version = JSON.parse(versionText);

    return Readium;

});

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

define('readium-js',['Readium'], function (Readium) {
//noop
});


//# sourceMappingURL=readium-js.js.map