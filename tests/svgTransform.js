const VueTemplateCompiler = require('vue-template-compiler')

module.exports.process = (svgSource, filename) => {
  const result = VueTemplateCompiler.compileToFunctions(`${svgSource}`)

  return {
    code: `module.exports = { render: ${result.render} }`,
  }
}
