const path = require("path");
const SimpleProgressWebpackPlugin = require("simple-progress-webpack-plugin");

module.exports = {
  chainWebpack: config => {
    // Import `global.scss` into all processed scss
    const types = ["vue-modules", "vue", "normal-modules", "normal"];
    types.forEach(type =>
      config.module
        .rule("scss")
        .oneOf(type)
        .use("style-resource")
        .loader("style-resources-loader")
        .options({
          patterns: [path.resolve(__dirname, "./src/scss/global.scss")]
        })
    );

    // Simplify dev build output
    if (process.env.NODE_ENV === "development") {
      // Remove vue-cli-service's progress output
      config.plugins.delete("progress");
      // Add simple-progress-webpack-plugin
      config
        .plugin("simple-progress-webpack-plugin")
        .use(SimpleProgressWebpackPlugin, [{ format: "compact" }]);
    }
  }
};
