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
    cfi_parser = File.read('src/models/epubcfi.js')
    cfi_interpreter = File.read('src/models/cfi_instructions.js')
    cfi_instructions = File.read('src/models/cfi_interpreter.js')
    cfi_generator = File.read('src/models/cfi_generator.js')
    runtime_errors = File.read('src/models/runtime_errors.js')

    template = File.read(templatePath)
    erb = ERB.new(template)
    
    # Generate library
    File.open(outputPath, "w") do |f|
        f.puts erb.result(binding)
    end
end

#tasks:

desc "render the erb template to concatenate scripts"
task :gen_module do
  render_cfi_library_template("src/templates/cfi_library_template.js.erb", "../development/epub_cfi.js")
  render_cfi_library_template("src/templates/cfi_library_template.js.erb", "lib/epub_cfi.js")
end

desc "Concatenate all source files"
file "#{in_path}" do
	Rake::Task["gen_module"].invoke
end

desc "Minify the concatenated scipts"
file "#{out_path}" => "#{in_path}" do
	puts "minifying #{in_path}"
	output = `java -jar #{jar_path} --js #{in_path} --js_output_file #{out_path}`
end

desc "create the concatented and minified library"
task :build => "#{out_path}"