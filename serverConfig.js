module.exports = {
  nodeEnv: process.env.NODE_ENV || 'dev',
  host: process.env.HOST || 'localhost:8080',
  additionalAllowedOrigins: '',
  serverPort: process.env.HIGH_LINE_PORT || 8080,
  version: process.env.HIGH_LINE_VERSION || 'development',
  logLevel: process.env.HIGH_LINE_LOG_LEVEL || 'debug',
  awsS3: {
    photoIdBucket: process.env.SUBWAY_PHOTO_ID_BUCKET || 'photo-id-bucket',
    sessionPhotoBucket:
      process.env.SUBWAY_SESSION_PHOTO_BUCKET || 'session-photo-bucket',
  },
}
