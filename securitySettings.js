const config = require('./serverConfig')

// really great csp docs: https://content-security-policy.com/
// helmet docs: https://helmetjs.github.io/

// script sources
const googleScriptUrls = [
  'https://*.googletagmanager.com',
  'https://www.google.com/recaptcha/',
  'https://www.gstatic.com/recaptcha/',
]
const cdnUrl = 'https://cdn.upchieve.org'
const mathJaxScriptUrl = 'https://cdnjs.cloudflare.com'
const newrelicUrls = [
  'https://js-agent.newrelic.com',
  'https://bam.nr-data.net',
]
const gleapUrl = 'https://*.gleap.io'
const gleapWss = 'wss://ws.gleap.io'
const orbitalUrl = 'https://*.useorbital.com'

// connect sources
const googleConnectUrls = [
  'https://*.google-analytics.com',
  'https://analytics.google.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com ',
]
const posthogUrls = [
  'https://p.upchieve.org',
  'https://app-static-prod.posthog.com',
  'https://app.posthog.com',
]
const sentryUrl = 'https://*.ingest.sentry.io'
const mathJaxFetchUrl = 'https://api.cdnjs.com'
const s3PhotoConnectUrls = [
  `${config.awsS3.photoIdBucket}.s3.us-east-2.amazonaws.com`,
  `${config.awsS3.sessionPhotoBucket}.s3.us-east-2.amazonaws.com`,
]

// frame sources
const googleFrameSrcUrls = [
  'https://docs.google.com/',
  'https://www.google.com/recaptcha/',
  'https://recaptcha.google.com/recaptcha/',
]
const vimeoFrameSrcUrl = 'https://player.vimeo.com/'

// img srcs
const googleImageUrls = [
  'https://*.google-analytics.com',
  'https://*.googletagmanager.com',
]

const s3PhotoImageUrls = [
  `${config.awsS3.photoIdBucket}.s3.amazonaws.com`,
  `${config.awsS3.photoIdBucket}.s3.us-east-2.amazonaws.com`,
  `${config.awsS3.sessionPhotoBucket}.s3.amazonaws.com`,
  `${config.awsS3.sessionPhotoBucket}.s3.us-east-2.amazonaws.com`,
]

// default srcs
const vimeoUrl = 'https://player.vimeo.com'
const googleDocsUrl = 'https://docs.google.com'
const trainingMaterialsS3 =
  'https://upc-training-materials.s3.us-east-2.amazonaws.com'

const scriptSrc = [
  "'self'",
  `https://${config.host}`,
  ...googleScriptUrls,
  cdnUrl,
  mathJaxScriptUrl,
  ...posthogUrls,
  ...newrelicUrls,
  gleapUrl,
  orbitalUrl,
  "'unsafe-eval'",
  "'unsafe-inline'",
  'blob:',
]

const imgSrc = [
  "'self'",
  ...googleImageUrls,
  ...s3PhotoImageUrls,
  gleapUrl,
  cdnUrl,
  'data:',
  'blob:',
  `https://${config.host}`,
]

const connectSrc = [
  "'self'",
  ...posthogUrls,
  sentryUrl,
  mathJaxFetchUrl,
  ...s3PhotoConnectUrls,
  ...newrelicUrls,
  ...googleConnectUrls,
  gleapUrl,
  gleapWss,
  orbitalUrl,
  `wss://${config.host}`,
  `https://${config.host}`,
]

const frameSrc = [
  "'self'",
  ...googleFrameSrcUrls,
  vimeoFrameSrcUrl,
  gleapUrl,
  orbitalUrl,
  cdnUrl,
]

const mediaSrc = ["'self'", gleapUrl]

if (config.nodeEnv !== 'production') {
  connectSrc.push('http://localhost:3000')
  connectSrc.push('http://localhost:3001')
  connectSrc.push('ws://localhost:3001')
  connectSrc.push('ws://localhost:3000')
  connectSrc.push('http://localhost:3002')
}

const defaultSrc = [
  "'self'",
  `https://${config.host}`,
  "'unsafe-inline'",
  vimeoUrl,
  googleDocsUrl,
  trainingMaterialsS3,
]

// the rest are defaults
const baseUri = ["'self'"]
const blockAllMixedContent = []
const fontSrc = ["'self'", 'https:', 'data:']
const objectSrc = ["'none'"]
const scriptSrcAttr = ["'none'"]
const styleSrc = ["'self'", 'https:', "'unsafe-inline'"]
let upgradeInsecureRequests
if (config.nodeEnv === 'production') {
  upgradeInsecureRequests = []
} else {
  upgradeInsecureRequests = null
}

module.exports = {
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
}
