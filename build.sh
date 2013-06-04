#!/bin/sh

cd epub-modules/epub
rake gen_module

cd ../epub-parser
rake gen_module

cd ../epub-reflowable
rake gen_module

cd ../epub-fixed
rake gen_module

cd ../epub-reader
rake gen_module

cd ../epub-cfi
rake gen_module

cd ..
rake gen_simple_readiumjs

cd epub-reflowable
rake get_dependencies

cd ../epub-fixed
rake get_dependencies

cd ../epub-reader
rake get_dependencies

cd ../../samples-project-testing
rake get_dependencies

cd ..

pwd