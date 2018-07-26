const path = require("path");

const root = p => path.resolve(__dirname, p);
const webpack = require("webpack");
const {
  createConfig,
  babel,
  entryPoint,
  setOutput,
  resolve,
  addPlugins,
  customConfig
} = require("webpack-blocks");

module.exports = createConfig([
  babel(),
  customConfig({
    module: {
      rules: [
        {
          test: /\.json$/,
          loader: "raw-loader",
          type: "javascript/auto"
        }
      ]
    },
    resolveLoader: {
      alias: {
        text: "text-loader"
      }
    }
  }),
  resolve({
    alias: {
      eventEmitter: "eventemitter3"
    },
         modules: [
      root("node_modules"),
      root("."),
      root("./readium-shared-js"),
      root("./readium-shared-js/node_modules")
    ],
      alias: {
      "version.json": root("dev/version.json"),
      readium_cfi_js: root("./js/module-patches/readium-cfi-js/index"),
      readium_shared_js: root("./js/module-patches/readium-shared-js"),
      readium_js: root("./js"),
      "./IPv6": "urijs/src/IPv6",
      "./core": "crypto-js/core",
      "./SecondLevelDomains": "urijs/src/SecondLevelDomains",
      "./punycode": "urijs/src/punycode",
      cryptoJs: "crypto-js",
      URIjs: "urijs/src/URI",
      eventEmitter: "eventemitter3",
      ResizeSensor:
        "readium-shared-js/node_modules/css-element-queries/src/ResizeSensor",
      rangy: root("./readium-shared-js/lib/rangy/rangy"),
      "rangy-core": root("./readium-shared-js/lib/rangy/rangy-core"),
      "rangy-cssclassapplier": root(
        "./readium-shared-js/lib/rangy/rangy-cssclassapplier"
      ),
      "rangy-highlighter": root(
        "./readium-shared-js/lib/rangy/rangy-highlighter"
      ),
      "rangy-position": root("./readium-shared-js/lib/rangy/rangy-position"),
      "rangy-selectionsaverestore": root(
        "./readium-shared-js/lib/rangy/rangy-selectionsaverestore"
      ),
      "rangy-serializer": root(
        "./readium-shared-js/lib/rangy/rangy-serializer"
      ),
      "rangy-textrange": root("./readium-shared-js/lib/rangy/rangy-textrange"),
      "zip-ext": "zip-js/WebContent/zip-ext",
    } 
  }),
  entryPoint(["./js/polyfills.js", "./js/Readium"]),
  setOutput({
    path: root("./build"),
    filename: "index.js",
    libraryTarget: "umd"
  }),
  addPlugins([
    new webpack.ProvidePlugin({
      jQuery: "jquery",
      $: "jquery",
      _: "underscore"
    })
  ])
]);
