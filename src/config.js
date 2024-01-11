let config = {}

config.mainWebsiteUrl = process.env.VUE_APP_MAIN_WEBSITE_URL
config.serverRoot = process.env.VUE_APP_SERVER_ROOT
config.socketAddress = process.env.VUE_APP_WEBSOCKET_ADDRESS
config.websocketRoot = process.env.VUE_APP_MAIN_WEBSOCKET_ROOT
config.zwibblerUrl = process.env.VUE_APP_ZWIBBLER_URL
config.posthogToken = process.env.VUE_APP_POSTHOG_TOKEN
config.gleapSdkKey = process.env.VUE_APP_GLEAP_SDK_KEY
config.devtools = process.env.VUE_APP_DEVTOOLS
config.nodeEnv = process.env.NODE_ENV
config.version = process.env.VUE_APP_VERSION || 'development'
config.sentryEnv = process.env.VUE_APP_SENTRY_ENV
config.sentryDsn = process.env.VUE_APP_SENTRY_DSN
config.customVolunteerPartnerOrgs =
  process.env.SUBWAY_CUSTOM_VOLUNTEER_PARTNER_ORGS || 'bogus'
const customVolunteerPartnerOrgs = config.customVolunteerPartnerOrgs.split(',')
config.customVolunteerPartnerOrgs = customVolunteerPartnerOrgs
config.googleRecaptchaKey = process.env.VUE_APP_GOOGLE_RECAPTCHA_KEY

export default config
