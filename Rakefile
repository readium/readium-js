require "erb"

# ------------------------------------------------------------------------------------------------------------------------
#  Helper methods
# ------------------------------------------------------------------------------------------------------------------------

def gen_simple_api_consolidated(template_file_path, output_file_path)

  puts "gen_simple_api_consolidated"
    
    epub_reading_system = File.read('epub-modules/development/epub_reading_system.js')
    epubcfi = File.read('epub-modules/development/epub_cfi.js')
    epub_fetch = File.read('epub-modules/development/epub_fetch_module.js')
    epub_reflowable = File.read('epub-modules/development/epub_reflowable_module.js')
    epub_fixed = File.read('epub-modules/development/epub_fixed_module.js')
    epub_parser = File.read('epub-modules/development/epub_parser_module.js')
    epub = File.read('epub-modules/development/epub_module.js')
    epub_reader = File.read('epub-modules/development/epub_reader_module.js')

    template = File.read(template_file_path)
    erb = ERB.new(template)
    
    File.open(output_file_path, "w") do |f|
        f.puts erb.result(binding)
    end
end

def gen_simple_api_non_consolidated(template_file_path, output_file_path)
  
  puts "gen_simple_api_non_consolidated"
  
    epub_reading_system = ""
    epubcfi = ""
    epub_fetch = ""
    epub_reflowable = ""
    epub_fixed = ""
    epub_parser = ""
    epub = ""
    epub_reader = ""

    template = File.read(template_file_path)
    erb = ERB.new(template)
    
    File.open(output_file_path, "w") do |f|
        f.puts erb.result(binding)
    end
end

# ------------------------------------------------------------------------------------------------------------------------
#  Tasks
# ------------------------------------------------------------------------------------------------------------------------

task :create_release do

    Rake::Task[:build].invoke()
    readium_js_modules = "epub-modules/development/epub_cfi.js " +
                         "epub-modules/development/epub_fixed_module.js " +
                         "epub-modules/development/epub_module.js " +
                         "epub-modules/development/epub_parser_module.js " +
                         "epub-modules/development/epub_reading_system.js " +
                         "epub-modules/development/epub_reflowable_module.js " +
                         "epub-modules/development/epub_reader_module.js "
    `java -jar build/yuicompressor-2.4.7.jar epub-modules/development/SimpleReadium.js -o epub-modules/release/SimpleReadium.min.js`
    `gzip -fc epub-modules/release/SimpleReadium.min.js > epub-modules/release/SimpleReadium.min.js.gz`
    `zip epub-modules/release/Readium.js.zip #{readium_js_modules}`
    `zip epub-modules/release/SimpleReadium.js.zip epub-modules/development/SimpleReadium.js`
end

directory "epub-modules/development"

task :gen_all_modules => "epub-modules/development" do 
    puts ":gen_all_modules"

    puts "epub_reading_system.js"
    `cp "epub-modules/epub_reading_system.js" "epub-modules/development/epub_reading_system.js"`
    
    puts `rake -f epub-modules/epub/Rakefile gen_module`
    puts `rake -f epub-modules/epub-cfi/Rakefile gen_module`
    puts `rake -f epub-modules/epub-fetch/Rakefile gen_module`
    puts `rake -f epub-modules/epub-fixed/Rakefile gen_module`
    puts `rake -f epub-modules/epub-parser/Rakefile gen_module`
    puts `rake -f epub-modules/epub-reader/Rakefile gen_module`
    puts `rake -f epub-modules/epub-reflowable/Rakefile gen_module`
end

task :copy_all_dependencies do 
    puts ":copy_all_dependencies"

    puts `rake -f epub-modules/epub/Rakefile copy_dependencies`
    puts `rake -f epub-modules/epub-cfi/Rakefile copy_dependencies`
    puts `rake -f epub-modules/epub-fetch/Rakefile copy_dependencies`
    puts `rake -f epub-modules/epub-fixed/Rakefile copy_dependencies`
    puts `rake -f epub-modules/epub-parser/Rakefile copy_dependencies`
    puts `rake -f epub-modules/epub-reader/Rakefile copy_dependencies`
    puts `rake -f epub-modules/epub-reflowable/Rakefile copy_dependencies`
    puts `rake -f samples-project-testing/Rakefile copy_dependencies`
end

desc "top-level task (runs all module subtasks)"
task :build do
    
    puts ":build"
    
    `mkdir epub-modules/development`

    Rake::Task[:gen_all_modules].invoke()
    
    gen_simple_api_consolidated("epub-modules/simple-readium-js/simple_rwc_template.js.erb", "epub-modules/development/SimpleReadium.js")
    puts "=> SimpleReadium.js"
        
    gen_simple_api_non_consolidated("epub-modules/simple-readium-js/simple_rwc_template.js.erb", "epub-modules/development/SimpleReadium_Dev.js")
    puts "=> SimpleReadium_Dev.js"
  
    Rake::Task[:copy_all_dependencies].invoke()
end
