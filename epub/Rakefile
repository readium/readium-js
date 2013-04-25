require 'erb'

begin
  require 'jasmine'
  load 'jasmine/tasks/jasmine.rake'
rescue LoadError
  task :jasmine do
    abort "Jasmine is not available. In order to run jasmine, you must: (sudo) gem install jasmine"
  end
end

# Generate the epub module 
def render_epub_module_template(templatePath, outputPath)

    # Read each of the library components
    manifest_item = File.read('src/epub/models/manifest_item.js')
    manifest = File.read('src/epub/models/manifest.js')
    metadata = File.read('src/epub/models/metadata.js')
    page_spread_property = File.read('src/epub/models/page_spread_property.js')
    spine_item = File.read('src/epub/models/spine_item.js')
    spine = File.read('src/epub/models/spine.js')
    package_document = File.read('src/epub/models/package_document.js')

    template = File.read(templatePath)
    erb = ERB.new(template)
    
    # Generate library
    File.open(outputPath, "w") do |f|
        f.puts erb.result(binding)
    end
end

#tasks:

desc "render the epub module erb template"
task :gen_epub_module do
    puts "rendering the epub module"
    render_epub_module_template("epub_module_template.js.erb", "epub_module.js")
    render_epub_module_template("epub_module_template.js.erb", "../consolidated-epub-api/epub_module.js")
    render_epub_module_template("epub_module_template.js.erb", "../sample-app/app/assets/javascripts/lib/epub_module.js")
end