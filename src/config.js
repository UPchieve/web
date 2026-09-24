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
config.langfusePublicKey = import.meta.env.VUE_APP_LANGFUSE_PUBLIC_KEY
config.langfuseBaseUrl = import.meta.env.VUE_APP_LANGFUSE_BASEURL

const partnerKeysThatRequirePhotoId =
  import.meta.env.VUE_APP_PARTNER_KEYS_THAT_REQUIRE_PHOTO_ID || ''
config.partnerKeysThatRequirePhotoId = partnerKeysThatRequirePhotoId.split(',')

config.nths = {
  presidentCircleCommunity:
    'https://upchieve-coach-community.circle.so/join?invitation_token=c0540e4ef459d5ba80d725363ed1ca422d66128c-519f02f3-e383-4689-b32a-4775442e5fe6', // betterleaks:allow
  membersOnlyCircleCommunity:
    'https://upchieve-coach-community.circle.so/join?invitation_token=20929743c5bb3d92b5b78cf914b0c362dc0e2846-06a2b8a3-597a-448d-bfc8-8c45427c37b4', // betterleaks:allow
}
export default config
