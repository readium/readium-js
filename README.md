# The EPUB 3.0 CFI library

This library provides support, in javascript, for parsing and interpreting [EPUB 3.0 Canonical Fragment Identifiers](http://idpf.org/epub/linking/cfi/epub-cfi.html) (CFIs). jQuery is the only dependency. 

The purpose of this library is to allow reading systems to do useful things with EPUB CFIs. At the moment, this involves injecting HTML elements into EPUB documents at locations referenced by CFIs, as well as generating CFIs for simpler EPUBs. The intent for injecting HTML is that the injected elements can be used by reading systems to navigate to, or display something at, those CFI locations. 

The library may be extended to include other sorts of behaviour as the use cases for CFIs become clearer. 

# Using the library for linking with CFIs

1. Get a copy of the library. Currently, a development version of the [library](https://github.com/readium/EPUBCFI/blob/master/epub_cfi.js) is available in the Github repository. When the library becomes more stable, a minified version will also be made available as a separate download. 

2. Add the CFI library to your code using a script tag, and make sure you have jQuery:

    ~~~
    <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>
    <script src="epub_cfi.js"></script>
    ~~~

3. Use the library in your reading system

    ~~~
    var CFI = 'epubcfi(/6[id1]/18[id2]!/4[id3]/2[id4]/1:786)';

    try {

        // Get the EPUB's package document
        var packageDocument = get_the_package_document();

        // Get a reference to the "top level" content document in the CFI
        hrefOfContentDoc = EPUBcfi.Interpreter.getContentDocHref(CFI, packageDocument);

        // Load the content document
        var contentDocument = get_the_content_document();

        // Inject some arbitrary html at the location referenced by the CFI
        EPUBcfi.Interpreter.injectElement(CFI, contentDocument, "<span id='cfi-id' class='cfi-marker'>CFI</span>");
    } 
    catch (err) {
    
        Do something with the errors;
    }
    ~~~

The result of this will be to inject the `'<span id='cfi-id' class="cfi-marker"></span>'` HTML element into a position in the EPUB referenced by the CFI.

# Using the library for generating CFIs

The CFI library can be used to generate CFIs in simple cases. This includes character offset terminus types for EPUBs that only require a package document (itemref) indirection step.

1. Get a copy of the library, as per step 1 of "linking with CFIs," above.

2. Add the CFI library to your code using a script tag, as per step 2 of "linking with CFIs," above.

3. Use the library to generate a CFI

    ~~~
    try {

        // Get the starting text node
        var startTextNode = get_node();

        // Get the starting offset into the text node
        var charOffset = get_char_offset();

        // Get the idref in the spine of the current content document
        var contentDocIdref = get_idref();

        // Get a reference to the package document
        var packageDoc = get_package_doc();

        // Generate the CFI
        var generatedCFI = EPUBcfi.Generator.generateCharacterOffsetCFI(startTextNode, charOffset, contentDocIdref, packageDoc);
    } 
    catch (err) {
    
        Do something with the errors;
    }
    ~~~

# Setting up the development environment

There are a number of dependencies for this project: 

* Ruby
* Rake
* The ERB template gem
* Git
* [jasmine](http://pivotal.github.com/jasmine/)
* [PEG.js](http://pegjs.majda.cz/). PEG.js is both a library and a command-line tool. The project assumes that the PEG.js command line tool can be found on your path. You can change this in the Rake file. 

Once all that is good to go, clone the [Github](https://github.com/justinHume/EPUBCFI) repository. 

Having cloned the repository to your system, there are a number of Rake tasks to help you with development: 

* Generate a parser from the .pegjs grammar: `rake gen_parser`
* Run the CFI library unit tests: `rake jasmine`
* Generate a parser AND run the tests: `rake test_parser`
* Generate a vesion of the stand-alone library: `rake gen_cfi_library`

That last Rake task will generate a single (production) javascript file that contains all of the library components. The library components are developed and tested separately in the development enviroment.

# Future development priorities

This is an early version of this library and there are currently no guarantees about what will change. The library will evolve as I develop a better understanding of CFI use cases and how it might be integrated into readium systems (starting with Readium!). 

The following are the development priorities (in order), going forward:

* Add checking of text assertions
* Add utility methods to the library API (a method to indicate if a string is a valid CFI, maybe some methods that provide information about the CFI etc.)
* Add the CFI text-range terminus.
* Add additional terminus types.
* Decide on some guarantees about the library API.

# The library implementation, for developers

CFIs can be viewed, for the purposes of this library, as a Domain Specific Language (DSL) for creating unique, recoverable and sortable indexes for EPUBs. Most of what I know of DSLs I learned from reading [Martin Fowler's work](http://martinfowler.com/bliki/DomainSpecificLanguage.html), so I'll just link him in here and let him describe DSL concepts, if you haven't been exposed to them.

This CFI library is implemented using a number of standard patterns for DSLs. Before getting into the rationale for using DSL patterns, I'll go over the requirements for the CFI library:

* Fully implement the EPUB 3.0 CFI specification.
* Provide a stand-alone javascript library that enables a reading system to do useful things with a CFI. 
* Demonstrate the implementation of the CFI specification and library; that is, make the methodology, code and development environment accessible to reading system designers and users of the EPUB standard.

Given these requirements, the rationale for the DSL approach is two-fold. First, to do something useful with a CFI, it must essentially be parsed and interpreted. This part of the problem is irreducible. Even if a non-language-tool approach were taken, the eventual result would almost certainly be to write something that resembles a lexer-parser-interperter-something. Given that the EPUB CFI grammar is fully specified and that DSL tools and methodologies are mature and available, it makes sense to leverage existing DSL approaches for this type of work. Using well-understood and practiced patterns leads to a (hopefully) clean, robust and extensible solution. This is especially likely when considering benefits like built-in syntax error handling that comes free-ish with tools like parser generators. 

Second, using widely available DSL patterns aids in making the CFI library more accessible to developers and implementors. I think this is valid for all the standard reasons that design patterns, whether loosely or rigorously applied, are beneficial. First and foremost, it is easier to understand - or learn about - a common pattern, as opposed to whatever amorphous collection of objects I might have invented on my own. 

## The CFI library architecture

The CFI library consists of a number of components that are based on DSL patterns, with reponsibilities as follows:

* __Parser__: Lexes and parses (in one step) a CFI string. It produces either syntax errors or an Abstract Syntax Tree (AST) representation of the CFI, in JSON format.
* __Interpreter__: Walks the JSON AST and executes instructions for each node in the AST. The result of executing the interpreter is to inject an element, or set of elements, into an EPUB content document. These element(s) will represent a position, or area, referenced by a CFI.
* __Instructions__: The implementation of a single statement in the CFI language.
* __Runtime errors__: A set of errors that might be thrown when interpreting a CFI AST. 

The following describes the rationale behind each component:

### Lexing and parsing

The PEG.js parser generator is used to generate a lexer/parser from a Parsing Expression Grammar (PEG) representation of the CFI language. Given that an Extended Backus-Naur Form (EBNF) representation of the CFI grammar is provided by the EPUB spec, using a parser generator as the mechanism for building and maintaining a lexer/parser seems appropriate for a number of reasons: 

First, using a parser-generator with a well-specified grammar ensures a more complete (built-in syntax error generation, etc.) and error-free lexing/parsing solution, as opposed to writing the lexer/parser by hand. 

Second, it is easier to maintain a parser generator solution over time, as changes to the spec or grammar can be more easily versioned, accommodated and understood if represented by a nice pretty grammar rather than directly in code. 

Third, using a parser generator enables a separation-of-concerns between lexing/parsing and whatever comes after (interpretation, in this case). This is _good_ because separation-of-concerns makes the life a developer much, much better. 

Finally, in regards to the rationale for using a [Parsing Expression Grammar](http://en.wikipedia.org/wiki/Parsing_expression_grammar): The PEG.js library provides a simple generator and API, generates javascript parsers, and has decent documentation. This makes it a good choice for this project. Beyond that, there is nothing that I can see in the CFI language that necessitates, or is limited by, the use of a PEG (the alternative being a generator based on an EBNF, like [ANTLR](http://www.antlr.org/), or something similar). 

tl;dr, I chose a generator based on a PEG because PEG.js seemed easy and useful, rather than for some deep language reason. 

### Interpreter and instructions

The interpreter is responsible for walking the AST and calling instructions that do something to interpret a CFI. This _something_ is, at the moment, to inject some arbitrary user-specified HTML at the location referenced by a CFI. 

The rationale for the interpreter and the instruction components being separate is based on the standard set of engineering reasons: Separation-of-concerns, extensibility, better abstraction etc. To illustrate, while there is currently a one-to-one correspondence (with one exception) between an interpreter function and an instruction function, in the future it is likely that the behaviour of the interpreter will become more complex. It may be required to act on a set of CFIs rather than a single CFI, load resources differently, etc. These types of changes to the interpreter would have no impact on the instructions being executed, hence the separation. 

### Error handling

At the moment, the only intention for this component is to provide some basic information for CFI interpretation errors (syntax errors are generated by the parser). There is not much to say about this other than that this component will likely evolve with a better understanding of the type of runtime errors a CFI might generate, and the use cases for this library. 
