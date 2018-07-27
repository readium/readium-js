import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');

export default {
    input: 'js/Readium.js',
    output: [
        {
            file: pkg.module,
            format: 'es',
            sourcemap: true,
        },
        {
            file: pkg.main,
            format: 'umd',
            name: 'readiumJs',
            sourcemap: true,
        },
    ],
    plugins: [
        resolve(),
        commonjs(),
        babel()
    ],
    moduleContext: {
        'node_modules/zip-js/WebContent/zip.js': 'window'
    }
};