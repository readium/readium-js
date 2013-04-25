
begin
  require 'jasmine'
  load 'jasmine/tasks/jasmine.rake'
rescue LoadError
  task :jasmine do
    abort "Jasmine is not available. In order to run jasmine, you must: (sudo) gem install jasmine"
  end
end

# Generate the epub module 
def render_epub_parser_module_template(templatePath, outputPath)

    # Read each of the library components
    package_document_parser = File.read('src/package_document_parser.js')

    template = File.read(templatePath)
    erb = ERB.new(template)
    
    # Generate library
    File.open(outputPath, "w") do |f|
        f.puts erb.result(binding)
    end
end

#tasks:

desc "render the epub parser module erb template"
task :gen_epub_parser_module do
    puts "rendering the epub parser module"
    render_epub_parser_module_template("epub_parser_module_template.js.erb", "epub_parser_module.js")
    render_epub_parser_module_template("epub_parser_module_template.js.erb", "../consolidated-epub-api/epub_parser_module.js")
    render_epub_parser_module_template("epub_parser_module_template.js.erb", "../sample-app/app/assets/javascripts/lib/epub_parser_module.js")
end