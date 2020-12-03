const configElement = document.getElementById("config");

const config = {};

let passedConfig;
if (configElement !== null) {
  passedConfig = JSON.parse(configElement.innerHTML);
  // the local dev server won't interpolate in the values so we need
  // to provide defaults for that case
  // if there's no interpolation the object will include straight string values
  // of the mustache templates, so we can look for that
  passedConfig.mainWebsiteUrl.includes("{{")
  ? (config.mainWebsiteUrl = "http://www.upchieve.org")
  : (config.mainWebsiteUrl = passedConfig.mainWebsiteUrl);
  passedConfig.serverRoot.includes("{{")
  ? (config.serverRoot = "http://localhost:3000")
  : (config.serverRoot = passedConfig.serverRoot);
  passedConfig.socketAddress.includes("{{")
  ? (config.websocketAddress = "http://localhost:3001")
  : (config.socketAddress = passedConfig.socketAddress);
  passedConfig.websocketRoot.includes("{{")
  ? (config.websocketRoot = "ws://localhost:3000")
  : (config.websocketRoot = passedConfig.websocketRoot);
  passedConfig.zwibblerUrl.includes("{{")
  ? (config.zwibblerUrl = "/static/js/zwibbler-demo.js")
  : (config.zwibblerUrl = passedConfig.zwibblerUrl);
} else {
  // tests don't include the index.html file
  // so we have to populate these without it
  config.mainWebsiteUrl = "http://www.upchieve.org"
  config.serverRoot = "http://localhost:3000"
  config.websocketAddress = "http://localhost:3001"
  config.websocketRoot = "ws://localhost:3000"
  config.zwibblerUrl = "/static/js/zwibbler-demo.js"
}



export default config;
