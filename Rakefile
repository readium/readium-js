# Generate the epub cfi parser
task :gen_parser do
	`pegjs -e EPUBcfi.Parser ./cfi_grammar/epubcfi.pegjs`
	mv './cfi_grammar/epubcfi.js', './src/epubcfi.js'
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

# Generate the epub cfi library
def render_template(templatePath, outputPath)

    # Read each of the library components
    cfi_parser = File.read('src/epubcfi.js')
    cfi_interpreter = File.read('src/epub_cfi/cfi_instructions.js')
    cfi_instructions = File.read('src/epub_cfi/cfi_interpreter.js')
    runtime_errors = File.read('src/epub_cfi/runtime_errors.js')

    template = File.read(templatePath)
    erb = ERB.new(template)
    
    # Generate library
    File.open(output, "w") do |f|
        f.puts erb.result(binding)
    end
end

task :gen_cfi_library do
    render_template("cfi_library_template.js.erb", "epub_cfi.js")
end

task :test_parser => [:gen_parser, :jasmine] do
end