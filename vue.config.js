const path = require("path");

module.exports = {
  chainWebpack: config => {
    // Import setup scss into all processed scss
    const types = ["vue-modules", "vue", "normal-modules", "normal"];
    types.forEach(type =>
      config.module
        .rule("scss")
        .oneOf(type)
        .use("style-resource")
        .loader("style-resources-loader")
        .options({
          patterns: [path.resolve(__dirname, "./src/scss/setup/all.scss")]
        })
    );
  }
};
