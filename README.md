# readium-js

**EPUB core processing engine written in Javascript.**

This is a software component used by the Readium Chrome extension and the "cloud reader" ( https://github.com/readium/readium-js-viewer ).

Please see https://github.com/readium/readium-shared-js for more information about the underlying rendering engine.

You can try Readium here:

* Online "cloud reader" demo: http://development.readium.divshot.io
* Chrome extension (can be used offline): https://chrome.google.com/webstore/detail/readium/fepbnnnkkadjhjahcafoaglimekefifl

## License

**BSD-3-Clause** ( http://opensource.org/licenses/BSD-3-Clause )

See license.txt ( https://github.com/readium/readium-js/blob/develop/license.txt )


## Prerequisites

* A decent terminal. On Windows, GitShell works great ( http://git-scm.com ), GitBash works too ( https://msysgit.github.io ), and Cygwin adds useful commands ( https://www.cygwin.com ).
* NodeJS ( https://nodejs.org )


## Development

**Initial setup:**

* `git submodule update --init --recursive` to ensure that the readium-js chain of dependencies is initialised (readium-shared-js and readium-cfi-js)
* `git checkout BRANCH_NAME && git submodule foreach --recursive 'git checkout BRANCH_NAME'` to switch to the desired BRANCH_NAME
* `npm run prepare` (to perform required preliminary tasks, like patching code before building)

Note that the above command executes the following:

* `npm install` (to download dependencies defined in `package.json` ... note that the `--production` option can be used to avoid downloading development dependencies, for example when testing only the pre-built `build-output` folder contents)
* `npm update` (to make sure that the dependency tree is up to date)

**Typical workflow:**

* Hack away! (mostly the source code in the `js` folder)
* `npm run build` (to update the RequireJS bundles in the build output folder)
* `npm run http:watch` (to launch an http server with live-reload, automatically opens a web browser instance to the HTML files in the `dev` folder)
* `npm run http` (same as above, but without watching for file changes (no automatic rebuild))

**Plugins integration:**

When invoking the `npm run build` command, the generated `build-output` folder contains RequireJS module bundles that include the default plugins specified in `readium-js-shared/plugins/plugins.cson` (see the `readium-js-shared/PLUGINS.md` documentation). Developers can override the default plugins configuration by using an additional file called `plugins-override.cson`. This file is git-ignored (not persistent in the Git repository), which means that Readium's default plugins configuration is never at risk of being mistakenly overridden by developers, whilst giving developers the possibility of creating custom builds on their local machines.

## NPM (Node Package Manager)

All packages "owned" and maintained by the Readium Foundation are listed here: https://www.npmjs.com/~readium

Note that although Node and NPM natively use the CommonJS format, Readium modules are currently only defined as AMD (RequireJS).
This explains why Browserify ( http://browserify.org ) is not used by this Readium project.
More information at http://requirejs.org/docs/commonjs.html and http://requirejs.org/docs/node.html

* Make sure `npm install readium-js` completes successfully ( https://www.npmjs.com/package/readium-js )
* Execute `npm run http`, which opens a web browser to a basic RequireJS bootstrapper located in the `dev` folder (this is *not* a fully-functioning application!)
* To see an actual application that uses this "readium-js" component, try "readium-js-viewer" ( https://www.npmjs.com/package/readium-js-viewer )

Note: the `--dev` option after `npm install readium-js` can be used to force the download of development dependencies,
but this is kind of pointless as the code source and RequireJS build configuration files are missing.
See below if you need to hack the code.


## How to use (RequireJS bundles / AMD modules)

The `build-output` directory contains common CSS styles, as well as two distinct folders:

### Single bundle

The `_single-bundle` folder contains `readium-js_all.js` (and its associated source-map file, as well as a RequireJS bundle index file (which isn't actually needed at runtime, so here just as a reference)),
which aggregates all the required code (external library dependencies included, such as Underscore, jQuery, etc.),
as well as the "Almond" lightweight AMD loader ( https://github.com/jrburke/almond ).

This means that the full RequireJS library ( http://requirejs.org ) is not actually needed to bootstrap the AMD modules at runtime,
as demonstrated by the HTML file in the `dev` folder (trimmed for brevity):

```html
<html>
<head>

<!-- main code bundle, which includes its own Almond AMD loader (no need for the full RequireJS library) -->
<script type="text/javascript" src="../build-output/_single-bundle/readium-js_all.js"> </script>

<!-- index.js calls into the above library -->
<script type="text/javascript" src="./index.js"> </script>

</head>
<body>
<div id="viewport"> </div>
</body>
</html>
```

### Multiple bundles


The `_multiple-bundles` folder contains several Javascript bundles (and their respective source-map files, as well as RequireJS bundle index files):


* `readium-external-libs.js`: aggregated library dependencies (e.g. Underscore, jQuery, etc.)
* `readium-shared-js.js`: shared Readium code (basically, equivalent to the `js` folder of the "readium-shared-js" submodule)
* `readium-cfi-js.js`: Readium CFI library (basically, equivalent to the `js` folder of the readium-cfi-js submodule)
* `readium-js.js`: this Readium code (see the `js` folder, which includes epub-fetch and epub-model source code)
* `readium-plugin-example.js`: simple plugin demo
* `readium-plugin-annotations.js`: the annotation plugin (DOM selection + highlight), which bundle actually contains the "Backbone" library, as this dependency is not already included in the "external libs" bundle.
)

In addition, the folder contains the full `RequireJS.js` library ( http://requirejs.org ), as the above bundles do no include the lightweight "Almond" AMD loader ( https://github.com/jrburke/almond ).

Usage is demonstrated by the HTML file in the `dev` folder (trimmed for brevity):

```html
<html>
<head>

<!-- full RequireJS library -->
<script type="text/javascript" src="../build-output/_multiple-bundles/RequireJS.js"> </script>



<!-- individual bundles: -->

<!-- readium CFI library -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-cfi-js.js"> </script>

<!-- external libraries -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-external-libs.js"> </script>

<!-- readium itself -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-shared-js.js"> </script>

<!-- simple example plugin -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-example.js"> </script>

<!-- annotations plugin -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-annotations.js"> </script>

<!-- readium js -->
<script type="text/javascript" src="../build-output/_multiple-bundles/readium-js.js"> </script>


<!-- index.js calls into the above libraries -->
<script type="text/javascript" src="./index.js"> </script>

</head>
<body>
<div id="viewport"> </div>
</body>
</html>
```


Note how the "external libs" set of AMD modules can be explicitly described using the `bundles` RequireJS configuration directive
(this eliminates the apparent opacity of such as large container of library dependencies):


```html

<script type="text/javascript">
requirejs.config({
    baseUrl: '../build-output/_multiple-bundles'
});
</script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-cfi-js.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-external-libs.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-shared-js.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-example.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-plugin-annotations.js.bundles.js"> </script>

<script type="text/javascript" src="../build-output/_multiple-bundles/readium-js.js.bundles.js"> </script>

```




## CSON vs. JSON (package.json)

CSON = CoffeeScript-Object-Notation ( https://github.com/bevry/cson )

Running the command `npm run cson2json` will re-generate the `package.json` JSON file.
For more information, see comments in the master `package.cson` CSON file.

Why CSON? Because it is a lot more readable than JSON, and therefore easier to maintain.
The syntax is not only less verbose (separators, etc.), more importantly it allows *comments* and *line breaking*!

Although these benefits are not so critical for basic "package" definitions,
here `package.cson/json` declares relatively intricate `script` tasks that are used in the development workflow.
`npm run SCRIPT_NAME` offers a lightweight technique to handle most build tasks,
as NPM CLI utilities are available to perform cross-platform operations (agnostic to the actual command line interface / shell).
For more complex build processes, Grunt / Gulp can be used, but these build systems do not necessarily offer the most readable / maintainable options.

Downside: DO NOT invoke `npm init` or `npm install --save` `--save-dev` `--save-optional`,
as this would overwrite / update the JSON, not the master CSON!



## API

For a full working example, see `./dev/index.js`. Invoke the `npm run http` command line task to launch a web browser demonstration. 

ReadiumJS has a simple API for initializing an EPUB reader. First, you create the Readium object using its constructor. 

### Step 1. Create a Readium object
```javascript
var readium = new Readium(readiumOptions, readerOptions);
```
The constructor takes two arguments: readiumOptions and readerOptions. These arguments are objects that contain various properties used by Readium. 

**readiumOptions' properties**
* useSimpleLoader - A boolean. If true, readium js will load the book with no content transformations. Requires an exploded epub. 
* jsLibRoot - A string that specifies the relative root url containing worker scripts used by ReadiumJS. Specifically inflate.js and deflate.js. Not necessary when useSimpleLoader is true.
* openBookOptions - Contains options that can be used to specify default settings to use when an epub is opened for reading.

**readerOptions' properties**
* el - A string that is a css selector for the html element that will host the readium iframe. This iframe hosts the epub's content. 
* annotationCSSUrl - relative url for the [annotations.css](https://github.com/readium/readium-js-viewer/blob/master/css/annotations.css) file. This is required if your application supports highlighting using readium-shared-js's implementation. 
* mathJaxUrl - relative url for the MathJax javascript file. Not required if useSimpleLoader is true in readiumOptions.

A working example can be found in the readium-js-viewer project in the [EpubReader.js source code](https://github.com/readium/readium-js-viewer/blob/8abe97ce4457d176ef2f117e32e0b374cf903c49/lib/EpubReader.js#L696). 

### Step 2. Open an EPUB

The next step is to open an epub for reading using the `openPackageDocument` function. 

```javascript
readium.openPackageDocument(packageDocumentURL, openCallback, openPageRequest);
```
This function takes three arguments. 
* packageDocumentURL - The url string of the book to open. This can be an epub file or the root path of an exploded epub archive.
* openCallback - A callback that gets called once the book's metadata has been successfully loaded by readium. 
* openPageRequest - This can be used to specify the location to open the book at. It is an object that contains an elementCFI property that represents a CFI location in the book. `{elementCFI: elementCFI}`. Typically, you would retrieve a reader's location in the book using `readium.reader.bookmarkCurrentPage()`.

**openCallback**
The openCallback function should look something like this
```javascript
function(packageDocument, options){
//do something here
}
```
* packageDocument - this represents the parsed metadata for the opened epub. See the [source code](https://github.com/readium/readium-js/blob/master/epub-modules/epub/src/models/package_document.js) for this object for more information. 
* options - Contains additional info
 * metadata - raw metadata info
 * packageDocumentUrl - url of the epub's package xml file. 


A working example of calling the openPackageDocument function is in the [EpubReader.js source code](https://github.com/readium/readium-js-viewer/blob/8abe97ce4457d176ef2f117e32e0b374cf903c49/lib/EpubReader.js#L59) in the readium-js-viewer project. 

### Step 3. Use the readium-shared-js sdk to interact with Readium.

You can use the Readium.reader property to interact with the actual epub reader. This is a readium-shared-js ReaderView object. You can find the documentation [here](https://dl.dropboxusercontent.com/u/18642964/Readium/Shared-JS%20JSDoc/ReadiumSDK.Views.ReaderView.html).

This is the API that allows you to change book styles and settings. It also allows you to listen for various events in the book's lifecycle. For example, an important event is the CONTENT_DOCUMENT_LOADED event. This event is triggered when a new xhtml file has been successfully loaded into the reader. An example of registering for this event

```javascript
readium.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, function ($iframe, spineItem) {
// do something
});
```
