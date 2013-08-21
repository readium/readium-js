({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        }
    },
    paths: {
        jquery: '../../lib/jquery-1.9.1',
        underscore: '../../lib/underscore-1.4.4',
        backbone: '../../lib/backbone-0.9.10',
        URIjs: '../../lib/URIjs',
        'cfi_module': '../../epub-cfi/out/cfi_module',
        'epub_fetch_module': '../../epub-fetch/out/epub_fetch_module',
        'epub_module': '../../epub/out/epub_module',
        'epub_reading_system': '../../epub-ers/out/epub_reading_system',
        'epub_renderer_module': '../../epub-renderer/out/epub_renderer_module'
    },
    exclude: ['jquery', 'underscore', 'backbone', 'URIjs/URI']
})
