module.exports = function(grunt) {
	//"use strict"; 
	//This is disabled because it's picking up octal literal notation that is quoted in a string.
	
	
	//Compile a list of paths and output files for our modules for requirejs to compile.
	//TODO: Translate the command-line code to this.
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
	
	
	//Generate a map of projects to watch, for use in the standard grunt configuration.
	//First, add the tasks that use the standard build command.
	var watchTasks = {};
	["epub-cfi", "epub-fetch", "epub", "epub-ers", "epub-renderer", ].forEach(function(module) {
		watchTasks[module] = {
				files: ['epub-modules/'+module+'/src/**/*.js'],
				tasks: ['exec:compile_an_epub_module:'+module, 'exec:compile_readium_epub_module', 'build_samples_project_testing'],
                options: {
                    livereload: true,
                },

			};
	});
	//Next, add the more complex readium build command.
	watchTasks["readium-js"] = {
		files: ['epub-modules/readium-js/src/**/*.js'],
		tasks: ['exec:compile_readium_epub_module', 'build_samples_project_testing'],
	};
	
	
	function compileModuleCMD(module_name, output_name, optimize) {
		//Returns a new command-line command to compile a readium module. While this uses require.js, I can't get the require.js grunt module to work. The version we're referencing here, r.js, is the same version as the grunt module uses.
		return 'node "build/r.js" ' + 
		'-o "epub-modules/'+module_name+'/build.js" ' + //We seem to need a -o command here for r.js.
		'name="'+output_name+'" ' + 
		'baseUrl="epub-modules/'+module_name+'/src" ' + 
		(!optimize ? 'optimize=none ' : '') + 
		'out="epub-modules/'+module_name+'/out/'+output_name+(!optimize ? '.js':'.min.js') + '"';
	}
	
	
	var config = {
		pkg: grunt.file.readJSON('package.json'),
		
		requirejs: configRequireJSCompilePaths,
		
		watch: watchTasks,
		
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
			
			
			compile_an_epub_module: {
				cmd: function(module_name) {
					var module_output_file = {
						"epub-cfi":      "cfi_module",
						"epub-fetch":    "epub_fetch_module",
						"epub":          "epub_module",
						"epub-ers":      "epub_reading_system",
						"epub-renderer": "epub_renderer_module",
					};
					return compileModuleCMD(module_name, module_output_file[module_name]);
				},
			},
			
			
			compile_readium_epub_module: {
				//Compile four different versions, because that's how it was packaged originally.
				//TODO: Analyze use cases and eliminate useless repetition.
				cmd: (function() {
					var commands = "";
					
					//Build Readium.js
					//First, compile the module normally. Next, compile it with almond.
					commands += compileModuleCMD("readium-js", "Readium", false);// + " && ";
					//commands += compileModuleCMD("readium-js", "Readium", true) + " && ";
					
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
						
					//commands += almond_compile_string + '.syncload.js" optimize=none &&';
					//commands += almond_compile_string + '.syncload.min.js"';
					
					//optimize=none
					return commands;
				})(),
			},
				
				
			copy_dependancies_to_samples_project_testing: {
				//TODO: Would links be better here?
				cmd: 'mkdir "samples-project-testing/lib"; ' + [
						"require.js", "jquery-1.9.1.js", "json2.js", "underscore-1.4.4.js", "backbone-0.9.10.js", "URIjs", "modernizr-2.5.3.min.js", "bootstrap.min.js", "deflate.js", "inflate.js", "mime-types.js", "zip-ext.js", "zip-fs.js", "zip.js"
					].map(function(filename) {
						return 'cp -a "epub-modules/lib/'+filename+'" "samples-project-testing/lib/'+filename+'"';
					}).join(' && ') + ' && ' + //Join with "and", so failure stops build process.
					'rm -r "samples-project-testing/lib/readium-js"; ' +
					'cp -a "epub-modules/readium-js/out" "samples-project-testing/lib" && ' +
					'mv "samples-project-testing/lib/out" "samples-project-testing/lib/readium-js"',
			},
			
			
			start_example_server: {
				//Start an example server.
				cmd: 'echo "Now serving the example site for you at http://localhost:3000/test_site/reader_view.html." && ' +
					'node "test_site_server.js"',
				cwd: 'samples-project-testing',
			},
			
			
			print_msg_ran: {
				//Here, we print a friendly, helpful message answering the question, "What do I do next?" While more verbose than it could be, I think it will be very useful when people unfamiliar with the code try to use it. It gives it just a pinch of discoverability.
				cmd: 'echo -e "\n\n\tNow we\'ve compiled the javascript files. We can include them in our project, as shown in the example in samples-project-testing/test_site. To view the site, run \'\033[1mgrunt server\033[0m\'.\n\tIf you\'re a developer, you can run \'grunt watch\' to have any changes you make to the source code automatically recompiled.\n\tTo build only the readium project, run \'grunt build_epub_modules\'"'
			},
		},
	};
	
	grunt.initConfig(config);
	
	
	//Load all our package.json-included grunt modules.
	require('load-grunt-tasks')(grunt);
	
	
	grunt.registerTask('build_epub_modules', 'Build the epub modules.', [
		'exec:initialize_submodules',
		'exec:compile_standard_epub_modules',
		'exec:compile_readium_epub_module',
	]);
	
	grunt.registerTask('build_samples_project_testing', 'Compile the website.', [
		'exec:copy_dependancies_to_samples_project_testing',
	]);
	
	grunt.registerTask('default', 'Compile the readium-web-components project.', [
		'build_epub_modules',
		'build_samples_project_testing',
		'exec:print_msg_ran',
	]);
	
	grunt.registerTask('server', 'Starts a server and opens the testing webpage.', [
		'exec:start_example_server',
	]);
};
