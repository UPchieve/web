const path = require("path")
const vueConfig = require('../vue.config')
console.log(vueConfig.configureWebpack)

module.exports = {
  "stories": [
    "../src/**/*.stories.mdx",
    "../src/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-a11y",
    "@storybook/addon-postcss",
    "storybook-addon-pseudo-states"
  ],
  // add this function to tweak the webpack config
  webpackFinal: async (config) => {
    // so I can import { storyFactory } from '~storybook/util/helpers'
    config.resolve.alias['~storybook'] = path.resolve(__dirname)
    // the @ alias points to the `src/` directory, a common alias
    // used in the Vue community
    config.resolve.alias['@'] = path.resolve(__dirname, '..', 'src')
    config.resolve.alias['~'] = path.resolve(__dirname, '..', 'node_modules')

    // THIS is the tricky stuff! Pulled from `$ vue-cli-service inspect`
    config.module.rules.push({
        test: /\.scss$/,
        oneOf: [
          /* config.module.rule('scss').oneOf('vue-modules') */
          {
            resourceQuery: /module/,
            use: [
              /* config.module.rule('scss').oneOf('vue-modules').use('vue-style-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'vue-style-loader/index.js'),
                options: {
                  sourceMap: false,
                  shadowMode: false
                }
              },
              /* config.module.rule('scss').oneOf('vue-modules').use('css-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'css-loader/dist/cjs.js'),
                options: {
                  sourceMap: false,
                  importLoaders: 2,
                  modules: {
                    localIdentName: '[name]_[local]_[hash:base64:5]'
                  }
                }
              },
              /* config.module.rule('scss').oneOf('vue-modules').use('postcss-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'postcss-loader/src/index.js'),
                options: {
                  sourceMap: false
                }
              },
              /* config.module.rule('scss').oneOf('vue-modules').use('sass-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'sass-loader/dist/cjs.js'),
                options: {
                  sourceMap: false
                }
              },
              /* config.module.rule('scss').oneOf('vue-modules').use('style-resource') */
              {
                loader: 'style-resources-loader',
                options: {
                  patterns: [
                    path.join(__dirname, '..', 'src', 'scss/setup/all.scss')
                  ]
                }
              }
            ]
          },
          /* config.module.rule('scss').oneOf('vue') */
          {
            resourceQuery: /\?vue/,
            use: [
              /* config.module.rule('scss').oneOf('vue').use('vue-style-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'vue-style-loader/index.js'),
                options: {
                  sourceMap: false,
                  shadowMode: false
                }
              },
              /* config.module.rule('scss').oneOf('vue').use('css-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'css-loader/dist/cjs.js'),
                options: {
                  sourceMap: false,
                  importLoaders: 2
                }
              },
              /* config.module.rule('scss').oneOf('vue').use('postcss-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'postcss-loader/src/index.js'),
                options: {
                  sourceMap: false
                }
              },
              /* config.module.rule('scss').oneOf('vue').use('sass-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'sass-loader/dist/cjs.js'),
                options: {
                  sourceMap: false
                }
              },
              /* config.module.rule('scss').oneOf('vue').use('style-resource') */
              {
                loader: 'style-resources-loader',
                options: {
                  patterns: [
                    path.join(__dirname, '..', 'src', 'scss/setup/all.scss')
                  ]
                }
              }
            ]
          },
          /* config.module.rule('scss').oneOf('normal-modules') */
          {
            test: /\.module\.\w+$/,
            use: [
              /* config.module.rule('scss').oneOf('normal-modules').use('vue-style-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'vue-style-loader/index.js'),
                options: {
                  sourceMap: false,
                  shadowMode: false
                }
              },
              /* config.module.rule('scss').oneOf('normal-modules').use('css-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'css-loader/dist/cjs.js'),
                options: {
                  sourceMap: false,
                  importLoaders: 2,
                  modules: {
                    localIdentName: '[name]_[local]_[hash:base64:5]'
                  }
                }
              },
              /* config.module.rule('scss').oneOf('normal-modules').use('postcss-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'postcss-loader/src/index.js'),
                options: {
                  sourceMap: false
                }
              },
              /* config.module.rule('scss').oneOf('normal-modules').use('sass-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'sass-loader/dist/cjs.js'),
                options: {
                  sourceMap: false
                }
              },
              /* config.module.rule('scss').oneOf('normal-modules').use('style-resource') */
              {
                loader: 'style-resources-loader',
                options: {
                  patterns: [
                    path.join(__dirname, '..', 'src', 'scss/setup/all.scss')
                  ]
                }
              }
            ]
          },
          /* config.module.rule('scss').oneOf('normal') */
          {
            use: [
              /* config.module.rule('scss').oneOf('normal').use('vue-style-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'vue-style-loader/index.js'),
                options: {
                  sourceMap: false,
                  shadowMode: false
                }
              },
              /* config.module.rule('scss').oneOf('normal').use('css-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'css-loader/dist/cjs.js'),
                options: {
                  sourceMap: false,
                  importLoaders: 2
                }
              },
              /* config.module.rule('scss').oneOf('normal').use('postcss-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'postcss-loader/src/index.js'),
                options: {
                  sourceMap: false
                }
              },
              /* config.module.rule('scss').oneOf('normal').use('sass-loader') */
              {
                loader: path.join(__dirname, '..', 'node_modules', 'sass-loader/dist/cjs.js'),
                options: {
                  sourceMap: false
                }
              },
              /* config.module.rule('scss').oneOf('normal').use('style-resource') */
              {
                loader: 'style-resources-loader',
                options: {
                  patterns: [
                    path.join(__dirname, '..', 'src', 'scss/setup/all.scss')
                  ]
                }
              }
            ]
          }
        ]
    })

    let rule = config.module.rules.find(r =>
      // it can be another rule with file loader 
      // we should get only svg related
      r.test && r.test.toString().includes('svg') &&
      // file-loader might be resolved to js file path so "endsWith" is not reliable enough
      r.loader && r.loader.includes('file-loader')
    );
    rule.test = /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani)(\?.*)?$/;

    config.module.rules.push({
      test: /\.(svg)(\?.*)?$/,
      use: [
        /* config.module.rule('svg').use('vue-svg-loader') */
        {
          loader: 'vue-svg-loader',
          options: {
            svgo: {
              plugins: [
                {
                  removeViewBox: false
                }
              ]
            }
          }
        }
      ]
    })

    // return the updated Storybook configuration
    return config
  },
}