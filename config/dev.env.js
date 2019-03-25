var merge = require('webpack-merge')
var prodEnv = require('./prod.env')

module.exports = merge(prodEnv, {
  NODE_ENV: '"development"',
  SERVER_ROOT: process.env.SERVER_ROOT || '"http://localhost:3000"',
  SOCKET_ADDRESS: process.env.SOCKET_ADDRESS || '"http://localhost:3001"'
})
