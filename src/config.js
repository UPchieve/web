const configElement = document.getElementById('config')

let config = {}

if (configElement !== null) {
  config = JSON.parse(configElement.innerHTML)
} else {
  // tests don't include the index.html file
  // so we have to populate these without it
  config.mainWebsiteUrl = process.env.VUE_APP_MAIN_WEBSITE_URL
  config.serverRoot = process.env.VUE_APP_SERVER_ROOT
  config.socketAddress = process.env.VUE_APP_WEBSOCKET_ADDRESS
  config.websocketRoot = process.env.VUE_APP_MAIN_WEBSOCKET_ROOT
  config.featureFlagRoot = process.env.VUE_APP_FEATURE_FLAG_ROOT
  config.featureFlagClientKey = process.env.FEATURE_FLAG_CLIENT_KEY
  config.zwibblerUrl = process.env.VUE_APP_ZWIBBLER_URL
  config.posthogToken = process.env.VUE_APP_POSTHOG_TOKEN
  config.unleashUrl = process.env.VUE_APP_UNLEASH_URL
  config.unleashName = process.env.VUE_APP_UNLEASH_NAME
  config.unleashId = process.env.VUE_APP_UNLEASH_ID
  config.devtools = process.env.VUE_APP_DEVTOOLS
  config.nodeEnv = process.env.NODE_ENV
  config.version = process.env.SUBWAY_VERSION
  config.sentryEnv = process.env.VUE_APP_SENTRY_ENV
  config.sentryDsn = process.env.VUE_APP_SENTRY_DSN
  config.customVolunteerPartnerOrgs =
    process.env.SUBWAY_CUSTOM_VOLUNTEER_PARTNER_ORGS || 'bogus'
}

const customVolunteerPartnerOrgs = config.customVolunteerPartnerOrgs.split(',')
config.customVolunteerPartnerOrgs = customVolunteerPartnerOrgs

export default config
