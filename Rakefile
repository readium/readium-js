require "erb"

# ------------------------------------------------------------------------------------------------------------------------
#  Helper methods
# ------------------------------------------------------------------------------------------------------------------------

# Generate the epub module 
def render_consolidated_module_template(template_file_path, output_file_path)

    # Read each of the library components
    epub_reading_system = File.read('epub-modules/development/epub_reading_system.js')
    epubcfi = File.read('epub-modules/development/epub_cfi.js')
    epub_reflowable = File.read('epub-modules/development/epub_reflowable_module.js')
    epub_fixed = File.read('epub-modules/development/epub_fixed_module.js')
    epub_parser = File.read('epub-modules/development/epub_parser_module.js')
    epub = File.read('epub-modules/development/epub_module.js')
    epub_reader = File.read('epub-modules/development/epub_reader_module.js')

    template = File.read(template_file_path)
    erb = ERB.new(template)
    
    # Generate library
    File.open(output_file_path, "w") do |f|
        f.puts erb.result(binding)
    end
end

def render_non_consolidated_module_template(template_file_path, output_file_path)

    # Read each of the library components
    epub_reading_system = ""
    epubcfi = ""
    epub_reflowable = ""
    epub_fixed = ""
    epub_parser = ""
    epub = ""
    epub_reader = ""

    template = File.read(template_file_path)
    erb = ERB.new(template)
    
    # Generate library
    File.open(output_file_path, "w") do |f|
        f.puts erb.result(binding)
    end
end

# ------------------------------------------------------------------------------------------------------------------------
#  Tasks
# ------------------------------------------------------------------------------------------------------------------------

desc "render the consolidated epub module erb template"
task :gen_simple_readiumjs do
    
    puts "rendering simple RWC"
    Rake::Task[:refresh_library].invoke()
    
    render_consolidated_module_template("epub-modules/simple-readium-js/simple_rwc_template.js.erb", "epub-modules/release/SimpleReadium.js")
    render_non_consolidated_module_template("epub-modules/simple-readium-js/simple_rwc_template.js.erb", "epub-modules/release/SimpleReadium_Dev.js")
end

task :refresh_library => ["generate_all_modules", "update_all_module_dependencies"]

task :generate_all_modules do 
    
    `rake -f epub-modules/epub/Rakefile gen_module`
    `rake -f epub-modules/epub-cfi/Rakefile gen_module`
    `rake -f epub-modules/epub-fixed/Rakefile gen_module`
    `rake -f epub-modules/epub-parser/Rakefile gen_module`
    `rake -f epub-modules/epub-reader/Rakefile gen_module`
    `rake -f epub-modules/epub-reflowable/Rakefile gen_module`
end

task :update_all_module_dependencies do 

    `cp epub-modules/epub_reading_system.js epub-modules/development/epub_reading_system.js`
    `rake -f epub-modules/epub/Rakefile get_dependencies`
    `rake -f epub-modules/epub-cfi/Rakefile get_dependencies`
    `rake -f epub-modules/epub-fixed/Rakefile get_dependencies`
    `rake -f epub-modules/epub-parser/Rakefile get_dependencies`
    `rake -f epub-modules/epub-reader/Rakefile get_dependencies`
    `rake -f epub-modules/epub-reflowable/Rakefile get_dependencies`
end