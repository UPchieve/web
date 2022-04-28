const vueJest = require('vue-jest/lib/template-compiler')

// https://github.com/visualfanatic/vue-svg-loader/blob/master/docs/faq.md#how-to-use-this-loader-with-jest
// Fix for the approach above: https://github.com/visualfanatic/vue-svg-loader/issues/102#issuecomment-585635384
module.exports = {
  process(content) {
    const render = function() {
      vueJest({
        content,
        attrs: {
          functional: false
        }
      })
    }

    return `module.exports = { render: ${render} }`
  }
}
