const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
const path = require("path");

module.exports = {
  devServer: {
    disableHostCheck: true,
    proxy: {
      "/setcookie": {
        target: "http://localhost", // not used, we just need the pathRewrite hook
        changeOrigin: true,
        pathRewrite: function(path, req) {
          req.res.statusCode = 302;
          req.res.cookie("first_cookie", "1", { maxAge: 3600 * 24 * 365 * 10 });
          req.res.setHeader("Location", "http://localhost:12380?redirected");
          req.res.end();
          return "";
        }
      }
    }
  },
  configureWebpack: () => {
    if (process.env.BUNDLE_ANALYZER) {
      // merges into config https://cli.vuejs.org/guide/webpack.html#simple-configuration
      return {
        plugins: [new BundleAnalyzerPlugin()]
      };
    }
  },
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

    // https://vue-svg-loader.js.org/faq.html#how-to-use-both-inline-and-external-svgs
    const svgRule = config.module.rule("svg");
    svgRule.uses.clear();
    svgRule
      .use("vue-svg-loader")
      .loader("vue-svg-loader")
      .options({
        svgo: {
          plugins: [{ removeViewBox: false }]
        }
      });

    config.module
      .rule("pdf")
      .test(/\.pdf$/)
      .use("file-loader")
      .loader("file-loader");
  }
};
