const express = require('express')
const path = require('path')
const pino = require('pino')
const pinoHttp = require('pino-http')
const helmet = require('helmet')
const cors = require('cors')
const config = require('./serverConfig')
const {
  baseUri,
  blockAllMixedContent,
  connectSrc,
  defaultSrc,
  fontSrc,
  // frameAncestors,
  imgSrc,
  objectSrc,
  scriptSrc,
  scriptSrcAttr,
  styleSrc,
  upgradeInsecureRequests,
} = require('./securitySettings')

const logger = pino({
  level: config.logLevel,
})

const distDir = './dist'

const app = express()
app.set('trust proxy', true)

const expressLogger = pinoHttp({ logger })
app.use(expressLogger)

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        baseUri,
        blockAllMixedContent,
        connectSrc,
        defaultSrc,
        fontSrc,
        // frameAncestors,
        imgSrc,
        objectSrc,
        scriptSrc,
        scriptSrcAttr,
        styleSrc,
        upgradeInsecureRequests,
      },
    },
    frameguard: false,
  })
)

let originRegex
config.nodeEnv === 'dev'
  ? (config.additionalAllowedOrigins = `http://localhost:${config.serverPort}`)
  : (config.additionalAllowedOrigins = '')
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
