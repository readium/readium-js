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
        'cfi_module': '../../epub-cfi/min/cfi_module.min',
        'epub_reflowable_module': '../../epub-reflowable/min/epub_reflowable_module.min',
        'epub_fixed_module': '../../epub-fixed/min/epub_fixed_module.min'
    },
    exclude: ['jquery', 'underscore', 'backbone', 'URIjs/URI']
})
