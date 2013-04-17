
begin
  require 'jasmine'
  load 'jasmine/tasks/jasmine.rake'
rescue LoadError
  task :jasmine do
    abort "Jasmine is not available. In order to run jasmine, you must: (sudo) gem install jasmine"
  end
end

task :server do
    `thin -R static.ru start`
end

# Generate the epub module 
def render_epub_reader_module_template(templatePath, outputPath)

    # Read each of the library components
    epub_reader = File.read('src/models/epub_reader.js')
    epub_reader_view = File.read('src/views/epub_reader_view.js')

    template = File.read(templatePath)
    erb = ERB.new(template)
    
    # Generate library
    File.open(outputPath, "w") do |f|
        f.puts erb.result(binding)
    end
end

desc "render the epub reader module erb template"
task :gen_epub_reader_module do
    puts "rendering the epub reader module"
    render_epub_reader_module_template("epub_reader_module_template.js.erb", "epub_reader_module.js")
    render_epub_reader_module_template("epub_reader_module_template.js.erb", "../annotations/epub_reader_module.js")
    render_epub_reader_module_template("epub_reader_module_template.js.erb", "../sample-app/app/assets/javascripts/lib/epub_reader_module.js")
end