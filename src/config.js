let config = {}
config.mainWebsiteUrl = import.meta.env.VUE_APP_MAIN_WEBSITE_URL
config.serverRoot = import.meta.env.VUE_APP_SERVER_ROOT
config.appRoot = import.meta.env.VUE_APP_ROOT
config.socketAddress = import.meta.env.VUE_APP_WEBSOCKET_ADDRESS
config.websocketRoot = import.meta.env.VUE_APP_MAIN_WEBSOCKET_ROOT
config.zwibblerUrl = import.meta.env.VUE_APP_ZWIBBLER_URL
config.posthogToken = import.meta.env.VUE_APP_POSTHOG_TOKEN
config.gleapSdkKey = import.meta.env.VUE_APP_GLEAP_SDK_KEY
config.devtools = import.meta.env.VUE_APP_DEVTOOLS
config.nodeEnv = import.meta.env.NODE_ENV
config.customVolunteerPartnerOrgs =
  import.meta.env.SUBWAY_CUSTOM_VOLUNTEER_PARTNER_ORGS || 'bogus'
const customVolunteerPartnerOrgs = config.customVolunteerPartnerOrgs.split(',')
config.customVolunteerPartnerOrgs = customVolunteerPartnerOrgs
config.googleRecaptchaKey = import.meta.env.VUE_APP_GOOGLE_RECAPTCHA_KEY

export default config
