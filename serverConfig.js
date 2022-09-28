module.exports = {
  nodeEnv: process.env.NODE_ENV || 'dev',
  host: process.env.HOST || 'localhost:8080',
  additionalAllowedOrigins:
    process.env.HIGH_LINE_ADDITIONAL_ALLOWED_ORIGINS || '',
  serverPort: process.env.HIGH_LINE_PORT || 8080,
  version: process.env.HIGH_LINE_VERSION || 'development',
  logLevel: process.env.HIGH_LINE_LOG_LEVEL || 'debug',
  awsS3: {
    photoIdBucket: process.env.HIGH_LINE_PHOTO_ID_BUCKET || 'photo-id-bucket',
    sessionPhotoBucket:
      process.env.HIGH_LINE_SESSION_PHOTO_BUCKET || 'session-photo-bucket',
  },
}
