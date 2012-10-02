load 'build/build.rake'

# Generate the epub cfi parser
task :gen_parser do
	`pegjs -e EPUBcfi.Parser ./cfi_grammar/epubcfi.pegjs`
	mv './cfi_grammar/epubcfi.js', './src/epub_cfi/epubcfi.js'
end 

# Start the jasmine server
begin
  require 'jasmine'
  load 'jasmine/tasks/jasmine.rake'
rescue LoadError
  task :jasmine do
    abort "Jasmine is not available. In order to run jasmine, you must: (sudo) gem install jasmine"
  end
end

task :test_parser => [:gen_parser, :jasmine] do
end