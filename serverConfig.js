module.exports = {
  nodeEnv: process.env.NODE_ENV || 'dev',
  host: process.env.HOST || 'http://localhost:8080',
  serverPort: process.env.HIGH_LINE_PORT || 8080,
  version: process.env.HIGH_LINE_VERSION || 'development',
  logLevel: process.env.HIGH_LINE_LOG_LEVEL || 'debug',
}
