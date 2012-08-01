
begin
  require 'jasmine'
  load 'jasmine/tasks/jasmine.rake'
rescue LoadError
  task :jasmine do
    abort "Jasmine is not available. In order to run jasmine, you must: (sudo) gem install jasmine"
  end
end

task :gen_parser do
	`pegjs -e EPUBcfi.Parser ./cfi_grammar/epubcfi.pegjs`
	mv './cfi_grammar/epubcfi.js', './src/epubcfi.js'
end 

task :test_parser => [:gen_parser, :jasmine] do
end