module.exports = function(grunt) {
	//"use strict"; 
	//This is disabled because it's picking up octal literal notation that is quoted in a string.
	
	//usage: grunt [server | watch | (--minify &| --syncload)]
	//server: Start a testing server for the website.
	//watch: Automatically recompile part of the project when files are changed.
	//--minify: Compress the build. (Has no effect when server option in use.)
	//--syncload: Generate syncload javascript. TODO: Insert short description of syncload here. (Has no effect when server option in use.)
	
	// Compile a list of paths and output files for our modules for requirejs to compile.
	// TODO: Translate the command-line code to this.
	var configRequireJSCompilePaths = {};
	function add_require_configuration(module) {
		var epub = module.folder_name;
		var epub_module = module.output_file;
		configRequireJSCompilePaths[epub] =  { 
			options: {
				mainConfigFile: "epub-modules/"+epub+"/build.js",
				name: epub_module,
				baseUrl: "epub-modules/"+epub+"/src",
				optimize: "none",
				out: "epub-modules/"+epub+"/out/"+epub_module+".js",
			}
		};
	}
	
	[	{folder_name:"epub",          output_file:"epub_module"},
		{folder_name:"epub-cfi",      output_file:"cfi_module"},
		{folder_name:"epub-ers",      output_file:"epub_reading_system"},
		{folder_name:"epub-fetch",    output_file:"epub_fetch_module"},
		{folder_name:"epub-renderer", output_file:"epub_renderer_module"},
	].forEach(add_require_configuration);
	

	configRequireJSCompilePaths["readium-js"] =  { 
		options: {
			mainConfigFile: "epub-modules/readium-js/build.js",
			name: "Readium",
			baseUrl: "epub-modules/readium-js/src",
			optimize: grunt.option('minify')?undefined:"none",
			out: "epub-modules/readium-js/out/Readium" + 
				(grunt.option('syncload')?".syncload":"") + 
				(grunt.option('minify')?".min":"") + ".js",
			include: grunt.option('syncload')?"define-sync":undefined,
			almond: grunt.option('minify'),
			wrap: grunt.option('syncload')?{
				start: "(function (root, ReadiumModuleFactory) {\nroot.Readium = ReadiumModuleFactory();\n}(this, function () {",
				end: "var Readium = require('Readium');\nreturn Readium;\n}));",
			}:undefined,
		}
	};
	
	
	//Generate a config map of projects to watch.
	var watchTasks = {};
	["epub-cfi", "epub-fetch", "epub", "epub-ers", "epub-renderer", ].forEach(function(module) {
		watchTasks[module] = {
				files: ['epub-modules/'+module+'/src/**/*.js'],
				tasks: ['requirejs:'+module, 'requirejs:readium-js', 'copy', 'notify:watch', ],
                options: {
                    livereload: true,
                    interrupt: true,
                },
			};
	});
	watchTasks["readium-js"] = {
		files: ['epub-modules/readium-js/src/**/*.js'],
		tasks: ['requirejs:readium-js', 'copy', 'notify:watch', ],
        options: {
            livereload: true,
            interrupt: true,
        },
	};
	
	
	var config = {
		pkg: grunt.file.readJSON('package.json'),
		requirejs: configRequireJSCompilePaths,
		watch: watchTasks,
		
		copy: {
			libs_to_test_site: {
				files: [{
					expand: true, src: ['**'], 
					cwd: "epub-modules/lib/", 
					dest: 'samples-project-testing/lib/',
				},{
					expand: true, src: ['*'], 
					cwd: 'epub-modules/readium-js/out/', 
					dest: 'samples-project-testing/lib/readium-js/', 
					filter: 'isFile',
				}]
			}
		},
		
		exec: {
			print_server_message: {
				cmd: 'echo "Now serving the example site for you at http://localhost:3000/test_site/reader_view.html."',
			},
			start_example_server: {
				cmd: 'node test_site_server.js',
				cwd: 'samples-project-testing',
			},
			
			print_msg_ran: {
				//Here, we print a friendly, helpful message answering the question, "What do I do next?" While more verbose than it could be, I think it will be very useful when people unfamiliar with the code try to use it. It gives it just a pinch of discoverability.
				cmd: 'echo -e "\n\n\tNow we\'ve compiled the javascript files. We can include them in our project, as shown in the example in samples-project-testing/test_site. To view the site, run \'\033[1mgrunt server\033[0m\'.\n\tIf you\'re a developer, you can run \'grunt watch\' to have any changes you make to the source code automatically recompiled.\n\tTo build only the readium project, run \'grunt build_epub_modules\'"'
			},
		},
		
		notify: {
			watch: {
				options: {
					title: 'Successful recompile.',
					message: 'Your javascript changes are now live.',
				}
			},
		},
	};
	
	grunt.initConfig(config);
	
	//Load all our package.json-included grunt modules.
	require('load-grunt-tasks')(grunt);
	
	grunt.registerTask('default', 'Compile the readium-web-components project.', [
		'requirejs',            //Builds the libraries we need. 
		'copy',                 //Copy them to the test server. 
		'exec:print_msg_ran',   //Be useful. Prompt next steps. 
	]);
	
	grunt.registerTask('server', 'Starts a server and opens the testing webpage.', [
		'exec:print_server_message',
		'exec:start_example_server',
	]);
};
