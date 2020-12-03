const configElement = document.getElementById( 'config' );
const passedConfig = JSON.parse( configElement.innerHTML );

const config = {}

// the local dev server won't interpolate in the values so we need
// to provide defaults for that case
passedConfig.VUE_APP_MAIN_WEBSITE_URL.includes("<%=") ? config.mainWebsiteUrl = "http://www.upchieve.org" : config.serverRoot = passedConfig.VUE_APP_MAIN_WEBSITE_URL
passedConfig.VUE_APP_SERVER_ROOT.includes("<%=") ? config.serverRoot = "http://localhost:3000" : config.serverRoot = passedConfig.VUE_APP_SERVER_ROOT
passedConfig.VUE_APP_SOCKET_ADDRESS.includes("<%=") ? config.websocketAddress = "http://localhost:3001" : config.socketAddress = passedConfig.VUE_APP_SOCKET_ADDRESS
passedConfig.VUE_APP_WEBSOCKET_ROOT.includes("<%=") ? config.websocketRoot = "ws://localhost:3000" : config.websocketRoot = passedConfig.VUE_APP_WEBSOCKET_ROOT
passedConfig.VUE_APP_ZWIBBLER_URL.includes("<%=") ? config.zwibblerUrl = "/static/js/zwibbler-demo.js" : config.zwibblerUrl = passedConfig.ZWIBBLER_URL

export default config
