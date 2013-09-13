# Readium.js

Welcome to Readium.js!

If you want to learn more about the project, check out the [press release](http://readium.org/news/announcing-readiumjs-a-javascript-library-for-browser-based-epub-3-reading) announcing the project. 

Readium.js is a client-side library that provides EPUB 3 support for custom web applications. Readium.js is a project of the [Readium Foundation](http://readium.org/readium-foundation-announced) and is closely integrated with [ReadiumSDK](https://github.com/readium/readium-sdk).

## Getting started

There are two ways to start using Readium.js in your application. The first is to include Readium.js using [Require.js](http://requirejs.org/). The second is to include Readium.js with script tags. 

An example of Readium.js loading using Require.js can be found [here](https://github.com/readium/readium-viewer-demo1/blob/master/index.html). An example of script tag loading can be found [here](https://github.com/readium/readium-viewer-demo1/blob/master/index-sync.html).

Downloads:

* Require.js loading: [Readium.min.js](https://github.com/readium/Readium-Web-Components/blob/master/epub-modules/readium-js/out/Readium.min.js)
* Script tag loading: [Readium.syncload.min.js](https://raw.github.com/readium/Readium-Web-Components/master/epub-modules/readium-js/out/Readium.syncload.min.js) 

API documentation can be found [here](http://readium.github.io/SDK-api-doc/).

## Changes from the initial Readium.js project

The initial version of the Readium.js project had a different set of internal javascript modules for "rendering" EPUB content. Given that very similar javascript rendering functionality was being developed for the ReadiumSDK project, the decision was made to adopt the ReadiumSDK javascript components in place of the equivalent Readium.js components. This also provided the opportunity to adopt the ReadiumSDK API. 

This change will allow Readium.js to benefit from the resources, attention and testing of the ReadiumSDK project. Readium.js will be able to directly leverage work on the ReadiumSDK to enhance EPUB viewing on the web.  

## Background 

The [Readium](http://readium.org) project began [in early 2012](http://idpf.org/news/readium-open-source-initiative-launched-to-accelerate-adoption-of-epub-3) as a web-based demonstration of [EPUB 3](http://idpf.org/epub/30), approved as a standard by the [International Digital Publishing Forum (IDPF)](http://idpf.org) in October, 2011. The initial goal of the project was to produce a simple browser-based "reference system" reader application that fully implemented the new specification.

The inital deployment was a Google Chrome Packaged App. The packaged-app is a 100% dedicated client-side (browser) solution, allowing users to load, read and save publications in the EPUB format. This application, deployed on the [Chrome Web Store](https://chrome.google.com/webstore/detail/empty-title/fepbnnnkkadjhjahcafoaglimekefifl?hl=en-US), now has over 80,000 users. It supports all major EPUB 3 features including fixed layout as well as dynamic pagination of reflow content, media overlays, interactivity, video, audio, global language support, embedded fonts, SVG, etc.

The [Readium-SDK](http://readium.org/projects/readium-sdk) project began in early 2013. This project is developing a performant, mobile-focused, industry-strength EPUB 3 SDK (software development kit). 

## Architecture

### A client-side library

Readium.js is a client-side javascript library that can be included in any web application. The library is a single minified file that exposes an API for loading, navigating and manipulating an EPUB publication.

### Internal components of the library

The Readium.js library is composed of [a few different modules](https://github.com/readium/Readium-Web-Components/tree/master/epub-modules) and a stylesheet: 

* epub-fetch: A module responsible for providing ansynchronous fetching of packed and unpacked EPUB resources. 
* epub: A javascript analogue of the core c++ components of ReadiumSDK. 
* epub-renderer: A module that encapsulates the javascript rendering code used in ReadiumSDK. This module is responsible for the layout, behaviour and styling of EPUB contnent and provides most of the methods used to interact with an EPUB. 
* stylesheets: The ReadiumSDK project architecture is such that a CSS stylesheet is written for each environment in which it is deployed. This stylesheet provides the required styles for deploying the ReadiumSDK javascript components in multiple browser environments. 

## Development and contributing

If you're interested in contributing here on Github, here are some resources to get started: 

  * The repository [wiki](https://github.com/readium/Readium-Web-Components/wiki) index.
  * How to [contribute](https://github.com/readium/Readium-Web-Components/wiki/How-to-contribute-to-Readium.js)
  * How to [get set up](https://github.com/readium/Readium-Web-Components/wiki/Getting-Set-Up-For-Development) for development.
  * Some info about the [file and folder structure](https://github.com/readium/Readium-Web-Components/wiki/Project-structure) of this project

If you have any questions, please email Dmitry: dmitrym@evidentpoint.com