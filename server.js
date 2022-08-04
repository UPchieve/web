const express = require('express')
const path = require('path')
const pino = require('pino')
const cors = require('cors')
const config = require('./serverConfig')

const logger = (() => {
  let newLogger

  if (process.env.NODE_ENV === 'dev') {
    newLogger = pino({
      prettyPrint: {
        colorize: true,
      },
      level: 'debug',
    })
  } else {
    newLogger = pino({
      level: 'info',
    })
  }

  return logger
})()

const distDir = './dist'

const app = express()
app.set('trust proxy', true)

let originRegex
config.nodeEnv === 'dev' ? config.additionalAllowedOrigins = `http://localhost:${config.serverPort}` : config.additionalAllowedOrigins = ''
if (config.additionalAllowedOrigins !== '') {
  originRegex = new RegExp(
    `^(${config.host}|${config.additionalAllowedOrigins})$`
  )
} else {
  originRegex = new RegExp(`^(${config.host}|'http://localhost:8080')$`)
}

app.use(
  cors({
    origin: originRegex,
    credentials: true,
    exposedHeaders: config.nodeEnv === 'dev' ? ['Date'] : undefined,
  })
)

app.get('/healthz', function(req, res) {
  res.status(200).json({ version: config.version })
})

app.use(express.static(path.join(__dirname, distDir)))

app.listen(config.serverPort, () => {
  logger.info(`api server listening on port ${config.serverPort}`)
})
