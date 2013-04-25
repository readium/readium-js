require 'erb'

# the path to the input script to minify
in_path = "epub_cfi.js"

# the path to output the minifed script
out_path =  "release/epubcfi.min.js"

# path the the closure compiler jar file
jar_path = "build/tools/closure-compiler-v1346.jar"

# Generate the epub cfi library
def render_cfi_library_template(templatePath, outputPath)

    # Read each of the library components
    cfi_parser = File.read('src/epub_cfi/epubcfi.js')
    cfi_interpreter = File.read('src/epub_cfi/cfi_instructions.js')
    cfi_instructions = File.read('src/epub_cfi/cfi_interpreter.js')
    cfi_generator = File.read('src/epub_cfi/cfi_generator.js')
    runtime_errors = File.read('src/epub_cfi/runtime_errors.js')

    template = File.read(templatePath)
    erb = ERB.new(template)
    
    # Generate library
    File.open(outputPath, "w") do |f|
        f.puts erb.result(binding)
    end
end

#tasks:

desc "render the erb template to concatenate scripts"
task :gen_cfi_library do
  puts "rendering the ERB template"
  render_cfi_library_template("cfi_library_template.js.erb", "epub_cfi.js")
  render_cfi_library_template("cfi_library_template.js.erb", "../sample-app/app/assets/javascripts/lib/epub_cfi.js")
  render_cfi_library_template("cfi_library_template.js.erb", "../epub-reader/epub_cfi.js")
  render_cfi_library_template("cfi_library_template.js.erb", "../annotations/epub_cfi.js")
  render_cfi_library_template("cfi_library_template.js.erb", "../epub-reflowable/epub_cfi.js")
  render_cfi_library_template("cfi_library_template.js.erb", "../consolidated-epub-api/epub_cfi.js")
end

desc "Concatenate all source files"
file "#{in_path}" do
	Rake::Task["gen_cfi_library"].invoke
end

desc "Minify the concatenated scipts"
file "#{out_path}" => "#{in_path}" do
	puts "minifying #{in_path}"
	output = `java -jar #{jar_path} --js #{in_path} --js_output_file #{out_path}`
end

desc "create the concatented and minified library"
task :build => "#{out_path}"