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

    // https://vue-svg-loader.js.org/faq.html
    const svgRule = config.module.rule("svg");
    svgRule.uses.clear();
    svgRule
      .oneOf("inline")
      .resourceQuery(/inline/)
      .use("vue-svg-loader")
      .loader("vue-svg-loader")
      .options({
        svgo: {
          plugins: [{ removeViewBox: false }]
        }
      })
      .end()
      .end()
      .oneOf("external")
      .use("file-loader")
      .loader("file-loader");
  }
};
