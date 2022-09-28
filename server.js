require('newrelic')
const express = require('express')
const fs = require('fs')
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
  imgSrc,
  objectSrc,
  scriptSrc,
  scriptSrcAttr,
  styleSrc,
  frameSrc,
  mediaSrc,
  upgradeInsecureRequests,
} = require('./securitySettings')

const logger = pino({
  level: config.logLevel,
})

logger.info('starting high-line server')

const distDir = './dist'
const indexPath = path.join(__dirname, `${distDir}/index.html`)
let indexHtml
try {
  indexHtml = fs.readFileSync(indexPath, 'utf8')
} catch (err) {
  logger.error(`error reading index.html file: ${err}`)
  if (config.nodeEnv !== 'dev') {
    process.exit(1)
  }
}

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
        imgSrc,
        objectSrc,
        scriptSrc,
        scriptSrcAttr,
        styleSrc,
        frameSrc,
        mediaSrc,
        upgradeInsecureRequests,
      },
    },
  })
)

let originRegex
if (config.additionalAllowedOrigins !== '')
  originRegex = new RegExp(
    `^(${config.host}|http://localhost:${config.serverPort}|${config.additionalAllowedOrigins})$`
  )
else
  originRegex = new RegExp(
    `^(${config.host}|http://localhost:${config.serverPort})$`
  )

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

app.use(express.static(path.join(__dirname, distDir), { index: indexHtml }))

app.use((req, res, next) => {
  res.send(indexHtml).status(200)
  next()
})

app.listen(config.serverPort, () => {
  logger.info(`api server listening on port ${config.serverPort}`)
})
