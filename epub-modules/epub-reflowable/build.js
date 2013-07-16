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
        'epub-cfi/cfi_module': '../../epub-cfi/min/cfi_module.min'
    },
    exclude: ['jquery', 'underscore', 'backbone', 'URIjs/URI']
})
