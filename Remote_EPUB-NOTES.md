# Remote EPUB File Support in Readium.js

## Introduction

Readium.js is an in-development client-side JavaScript library (open source, BSD licensed)
that enables EPUB 3 format publications to be read in mobile and PC browsers. EPUB files
are based on ZIP, and until now the assumption of Readium.js has been that .epub files 
ave been "deployed", aka "unzipped", into a directory structure on a web server
or cloud storage system.

This is almost certainly the most efficient approach where feasible, and such deployment is already a pattern for e.g. .WAR files deployed to Java app servers. But, packaged .epub files will in some use cases already exist in the cloud, and for some consumers it may be simpler not to worry about "unzipping" en route to deployment.

The version of Readium.js contained on this branch explores the idea of direct remote access to .epub files over HTTP, using HTTP/1.1 Byte Serving (aka Range Requests and Partial Content responses) and Gildas Lormeau's [zip.js](http://gildas-lormeau.github.io/zip.js/) library. This allows Readium.js to only fetch the required portions of .epub file from the remote server, without downloading the whole file. The process takes place in browser's memory, with the DOM tree being constructed and other resources (CSS, img) instantiated as Javascript Blob objects.

## Description of solution

## Remote EPUB support

This version of Readium.js implements both support for remote EPUB files in zipped form, as well as exploded form. With some API changes (see the next section), it is able to discover the content type of the remote EPUB file. Note that the remote web server has to support HTTP Range Requests and correctly specify the `application/epub+zip` Content-Type for EPUB files.

As this version of Readium.js is currently in a proof-of-concept phase, only some of sample EPUB packages distributed with the project are displaying correctly. The only browser demostrated to behave correctly with this version is Google Chromium version 25.0.1364.160. Some issues still seem to prevent it from working correctly in Firefox or IE.

Testing with the following EPUB packages is recommended:

* `cc-shared-culture-20120130.epub`
* `haruko-jpeg-20120814.epub`
* `accessible_epub_3-20121024.epub`
* `epub30-spec-20121128.epub`

Some others, like `moby-dick-20120118.epub` or `haruko-html-jpeg-20120524 (1).epub` exhibit problems with loading or contents. The cause is suspected to lie with asynchronous processing issues - possibly pre-existing ones (the current mainline version of Readium.js frequently logs callback/event-related exceptions which seem to be otherwise harmless, but can be problematic in new contexts).

Preliminary testing shows that the applied approach to reading remote zipped EPUB archives is viable - as observed in a simple test performed by loading the [`samples-project-testing/test_site/reader_view.html`](samples-project-testing/test_site/reader_view.html) page, recording its browser window's memory usage, then browsing through the aforementioned 4 EPUB packages.

The browser window's memory usage has grown only to a max of 80 MB from the initial 30 MB - far from amounts that would warrant any concerns. At the same time, network bandwidth is conserved by using partial HTTP requests (this can be seen especially with `cc-shared-culture-20120130.epub`).

## API Changes

Implementing the aforementioned features required significant changes in Readium.js API. As can be seen from [`samples-project-testing/test_site/showEpub.js`](samples-project-testing/test_site/showEpub.js#L51), the `SimpleReadiumJs` constructor now only requires (among others) one argument that specifies the EPUB package - its URL. It no longer requires the callee to fetch the XML of OPF package document and provide its contents (in the `result` argument), since with a remote zipped EPUB file that would prove problematic. This is now done automatically, whether the given packageDocumentURL refers to a zipped .epub file or unzipped .opf file.

Some public APIs of constituent EPUB modules required significant changes in order to accomodate the described simplification and the needed switch from a synchronous invocation model to an asynchronous one - see their respective sources.

## Code metrics

According to Git diff stats, code changes introduced to epub library modules count only 1146 changed/introduced source lines. Code changes are introduced in a way to maintain the pre-existing functionality.

## Suggested roadmap for future work

The presented version of Readium.js has demonstrated the viability of accessing remote EPUB files for reading over the network.

Possible future work directions include:

* Adding support for correctly resolving of additional document components. Currently, only images and CSS stylesheets are correctly handled for pages in a remote EPUB document. Support for SVG and others needs to be added.
* Enabling full cross-browser support for other modern browsers, e.g. Mozilla Firefox, Microsoft Internet Explorer.
* Testing and bug fixing of issues stemming from the change of execution model from synchronous to asynchronous.
* Support for remote zipped EPUB files using HTTP Range Requests.

