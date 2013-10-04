module.exports = function(grunt) {
	"use strict";
	
	//TODO: The following doesn't compile the JS right.
	//Compile a list of paths and output files for our modules for requirejs to compile.
	var configRequireJSCompilePaths = {};
	[
		{folder_name:'epub', output_file:'epub_module.js'}
	].forEach(function(module) {
		configRequireJSCompilePaths[module.folder_name] = { 
			options: {
				//almond: true,
				name: "build",
				paths: {
					lib:"epub-modules/"+module.folder_name+"/lib",
					src:"epub-modules/"+module.folder_name+"/src"
				},
				baseUrl: "epub-modules/"+module.folder_name,
				out: "epub-modules/"+module.folder_name+"/out/"+module.output_file,
				optimize: "none",
			}
		};
	});
	
	function compileModuleCMD(module_name, output_name, optimize) {
		//Returns a new command-line command to compile a readium module. While this uses require.js, I can't get the require.js grunt module to work. The version we're referencing here, r.js, is the same version as the grunt module uses.
		return 'node "build/r.js" ' + 
		'-o "epub-modules/'+module_name+'/build.js" ' + //We seem to need a -o command here for r.js.
		'name="'+output_name+'" ' + 
		'baseUrl="epub-modules/'+module_name+'/src" ' + 
		(!optimize ? 'optimize=none ' : '') + 
		'out="epub-modules/'+module_name+'/out/'+output_name+(!optimize ? '.js':'.min.js') + '"';
	}
	
	
	//Configuration of Grunt
	var config = {
		pkg: grunt.file.readJSON('package.json'),
		
		requirejs: configRequireJSCompilePaths,
		
		exec: {
			
			initialize_submodules: {
				cmd: "git submodule init && git submodule update"
			},
			
			compile_standard_epub_modules: {
				cmd: [             //↓Module Folder↓  ↓Compiled Module Name↓ 
					compileModuleCMD("epub-cfi",      "cfi_module",           false),
					compileModuleCMD("epub-fetch",    "epub_fetch_module",    false),
					compileModuleCMD("epub",          "epub_module",          false),
					compileModuleCMD("epub-ers",      "epub_reading_system",  false),
					compileModuleCMD("epub-renderer", "epub_renderer_module", false),
				].join(' && ') //Join all the compile commands using an and, because this way if one fails everything will.
			},
			
			compile_readium_epub_module: {
				cmd: (function() {
					var commands = "";
					
					//Build Readium.js
					//First, compile the module normally. Next, compile it with almond.
					commands += compileModuleCMD("readium-js", "Readium", false) + " && ";
					commands += compileModuleCMD("readium-js", "Readium", true) + " && ";
					
					var module_name = "readium-js";
					var output_name = "Readium";
					var almond_compile_string = 'node "build/r.js" ' +
						'-o "epub-modules/'+module_name+'/build.js" ' + //We seem to need a -o command here for r.js.
						'baseUrl="epub-modules/'+module_name+'/src" ' + 
						'name="../../../build/almond" ' + 
						'include="define-sync","'+output_name+'" ' + 
						'wrap.startFile="epub-modules/'+module_name+'/wrap-sync-start.frag" ' +
						'wrap.endFile="epub-modules/'+module_name+'/wrap-sync-end.frag" ' +
						'out="epub-modules/'+module_name+'/out/'+output_name;
						
					commands += almond_compile_string + '.syncload.js" optimize=none &&';
					commands += almond_compile_string + '.syncload.min.js"';
					
					//optimize=none
					return commands;
				})(),
			},
				
			copy_dependancies_to_samples_project_testing: {
				cmd: 'mkdir "samples-project-testing/lib"; ' + [
						"require.js", "jquery-1.9.1.js", "json2.js", "underscore-1.4.4.js", "backbone-0.9.10.js", "URIjs", "modernizr-2.5.3.min.js", "bootstrap.min.js", "deflate.js", "inflate.js", "mime-types.js", "zip-ext.js", "zip-fs.js", "zip.js"
					].map(function(filename) {
						return 'cp -a "epub-modules/lib/'+filename+'" "samples-project-testing/lib/'+filename+'"';
					}).join(' && ') + ' && ' + 
					'rm -r "samples-project-testing/lib/readium-js"; ' +
					'cp -a "epub-modules/readium-js/out" "samples-project-testing/lib" && ' +
					'mv "samples-project-testing/lib/out" "samples-project-testing/lib/readium-js"',
			},
			
			start_example_server: {
				cmd: 'python -m SimpleHTTPServer 3000 | gnome-open "http://localhost:3000/samples-project-testing/test_site/reader_view.html"',
			}
		},
	};
	
	console.log(config);
	console.log(config.requirejs.epub);
	
	//Load the config file, then load all the grunt modules we specified in package.json.
	grunt.initConfig(config);
	require('load-grunt-tasks')(grunt);
	
	
	//Tasks to run. Default installs, clean removes install.
	//grunt.registerTask('default', ['requirejs:epub']);
	
	grunt.registerTask('build_epub_modules', [
		'exec:initialize_submodules',
		'exec:compile_standard_epub_modules',
		'exec:compile_readium_epub_module',
	]);
	
	grunt.registerTask('build_samples_project_testing', [
		'exec:copy_dependancies_to_samples_project_testing',
	]);
	
	grunt.registerTask('default', [
		'build_epub_modules',
		'build_samples_project_testing',
	]);
	
	grunt.registerTask('server', 'Starts a server and opens the testing webpage.', [
		'exec:start_example_server',
	]);

};