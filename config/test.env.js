var merge = require('webpack-merge')
var devEnv = require('./dev.env')

console.log('--- using testing env ---')

var testEnv = merge(devEnv, { NODE_ENV: '"testing"' })

console.log(testEnv)

module.exports = testEnv
