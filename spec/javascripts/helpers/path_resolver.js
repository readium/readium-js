// seems like this is now fixed in chromium so soon it will no longer be necessary, YAY!
// get rid of webkit prefix
window.resolveLocalFileSystemURL = window.resolveLocalFileSystemURL || window.webkitResolveLocalFileSystemURL;

window.g_uid_hashed = null;

function PathResolver(rootPath) {
	this.baseUrl = new URI(rootPath);
};

function encode_utf8( s )
{
  return unescape( encodeURIComponent( s ) );
}

// we probably don't want both of these - not sure about x-browser compat of ArrayBuffer WHM

function string2Bin(str) {
  var result = [];
  for (var i = 0; i < str.length; i++) {
    result.push(str.charCodeAt(i)&0xff);
  }
  return result;
}

function string2ArrayBuffer(str){
    var ba=new ArrayBuffer(str.length);
    var bytes = new Uint8Array(ba);
    for(var i=0;i<str.length; i++){
        bytes[i] = str.charCodeAt(i);
    }
    return ba;
}

function bin2String(array) {
  return String.fromCharCode.apply(String, array);
}

PathResolver.prototype.resolve = function(relativePath) {
	var url = new URI(relativePath);
	return url.resolve(this.baseUrl);
};

var domToString = function(dom) {

	var x = new XMLSerializer();
	return x.serializeToString(dom);
};

var fixCssLinks = function(content, resolver) {

	// fix import statements to  (unconditionally) have url(...) wrapper
    content = content.replace(/@import\s+(?:url\()*(.+?)(?:\))*\s*;/g, "@import url\($1\);");

	var beginning = /url\s*\(\s*['"]*\s*/
	var end = /['"]*\s*\)/
	return content.replace(/url\s*\(\s*.+?\s*\)/g, function(frag) { 
		frag = frag.replace(beginning, '');
		frag = frag.replace(end, '');
		return "url('" + resolver.resolve(frag) + "')";
	});
};

var fixXhtmlLinks = function(content, resolver) {

	var $obj; var path; 
	var parser = new window.DOMParser();
	var dom = parser.parseFromString(content, 'text/xml');

	var correctionHelper = function(attrName) {
		var selector = '[' + attrName + ']';
		$(selector, dom).each(function() {
			$obj = $(this);
			path = $obj.attr( attrName );
			path = resolver.resolve( path );
			$obj.attr(attrName, path);
		});
	}

	correctionHelper('src');
	correctionHelper('href');
	$('image', dom).each(function() {
		$obj = $(this);
		path = $obj.attr( 'xlink:href' );
		path = resolver.resolve( path );
		$obj.attr('xlink:href', path);
	});
	//correctionHelper('xlink:href');
	var head = dom.getElementsByTagName("head")[0];
	if(head) {
		var head_content = head.innerHTML;
		head_content = "<script type='text/javascript' src='" + 
						window.location.origin + 
						"/scripts/models/readium_library/epub_reading_system.js' ></script>" + 
						head_content;
		head.innerHTML = head_content;
	}

	return domToString(dom);
};

var fixFonts = function(content, resolver) {

    if ((content.indexOf("OTTO") == 0) || (content.indexOf("wOFF") == 0)) {
		return content;
    }
    else {
    	var prefix = content.slice(0, 1040);
    	var bytes = string2Bin(prefix);
    	var masklen = g_uid_hashed.length;
    	for (var i = 0; i < 1040; i++)
    	{
    		bytes[i] = bytes[i] ^ (g_uid_hashed[i % masklen]);
    	}

	    var results = bin2String(bytes);
	    return results + content.slice(1040);
    }
}

var getBinaryFileFixingStrategy = function(fileEntryUrl, uid) {
	
	// a hack - tecnically should process top-down from encryption.xml but we'll just sniff for now WHM
	// does negative substr work in IE? WHM
	if ((fileEntryUrl.substr(-4) === ".otf") || (fileEntryUrl.substr(-5) === ".woff")
	    || (fileEntryUrl.substr(-4) === ".OTF") || (fileEntryUrl.substr(-5) === ".WOFF")) {
		if (window.g_uid_hashed == null) {
			var utf8_str = encode_utf8(uid.trim());
                        var digestBytes = window.Crypto.SHA1(utf8_str, { asBytes: true });
			window.g_uid_hashed = digestBytes; // which is it??
		}	
		return fixFonts;
	}
	return null;
}

var getLinkFixingStrategy = function(fileEntryUrl) {

	if (fileEntryUrl.substr(-4) === ".css" ) {
		return fixCssLinks;
	}
	
	if (fileEntryUrl.substr(-5) === ".html" || fileEntryUrl.substr(-6) === ".xhtml" ) {
		return fixXhtmlLinks;
	}

	if (fileEntryUrl.substr(-4) === ".xml" ) {
		// for now, I think i may need a different strategy for this
		return fixXhtmlLinks;
	}

	return null;
};


// this is the brains of the operation here
var monkeyPatchUrls = function(fileEntryUrl, win, fail, uid) {

	var entry;
	var binFixingStrategy;
	var resolver = new PathResolver(fileEntryUrl);

	var fixBinaryFile = function(content) {
		content = binFixingStrategy(content, resolver);
		writeBinEntry(entry, content, win, fail);		
	};
	
        binFixingStrategy = getBinaryFileFixingStrategy(fileEntryUrl, uid);	
	if (binFixingStrategy != null) {
		window.resolveLocalFileSystemURL(fileEntryUrl, function(fileEntry) {
		// capture the file entry in scope
		entry = fileEntry;
		readBinEntry(entry, fixBinaryFile, fail);
	});
		win();
		return;
	}
	
	var linkFixingStrategy = getLinkFixingStrategy(fileEntryUrl);

	// no strategy => nothing to do === win :)
	if(linkFixingStrategy === null) {
		win();
		return;
	}

	var fixLinks = function(content) {
		content = linkFixingStrategy(content, resolver);
		writeEntry(entry, content, win, fail);		
	};

	window.resolveLocalFileSystemURL(fileEntryUrl, function(fileEntry) {
		// capture the file entry in scope
		entry = fileEntry;
		readEntry(entry, fixLinks, fail);
	});
};


// these are filesystem helpers really...
var readEntry = function(fileEntry, win, fail) {

    fileEntry.file(function(file) {

       var reader = new FileReader();
       reader.onloadend = function(e) {
         win(this.result);
       };
       
       reader.readAsText(file);

    }, fail);

};

var writeEntry = function(fileEntry, content, win, fail) {

	Readium.FileSystemApi(function(fs) {
		fs.writeFile(fileEntry.fullPath, content, win, fail);
	});
};

var readBinEntry = function(fileEntry, win, fail) {

    fileEntry.file(function(file) {

       var reader = new FileReader();
       reader.onloadend = function(e) {
         win(this.result);
       };
       reader.readAsBinaryString(file);
    }, fail);
};

var writeBinEntry = function(fileEntry, content, win, fail) {
	
	fileEntry.createWriter(function(fileWriter) {

		fileWriter.onwriteend = function(e) {
			win();
		};

		fileWriter.onerror = function(e) {
			fail(e);
		};
        
        var i = content.length;
		var ba = string2ArrayBuffer(content);
		var k = ba.length;
        var blob = new Blob([ba], {type: 'image/jpeg'});
		fileWriter.write( blob );

	}, fail);
};



