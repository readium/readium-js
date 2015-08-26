## Readium-JS API

To get started, please read the [README](./README.md) first.

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
