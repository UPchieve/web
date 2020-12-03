const express = require("express");
const fs = require("fs");
const Mustache = require("mustache");
const logger = require("pino");

let template = "";

try {
  template = fs.readFileSync("dist/index.html", "utf8");
} catch (err) {
  logger.error("no index.html template in dist directory");
  process.exit(1);
}
// speeds up rendering on the first request
Mustache.parse(template);

const config = {
  zwibblerUrl: process.env.VUE_APP_ZWIBBLER_URL,
  websocketRoot: process.env.VUE_APP_WEBSOCKET_ROOT,
  serverRoot: process.env.VUE_APP_SERVER_ROOT,
  socketAddress: process.env.VUE_APP_SOCKET_ADDRESS,
  mainWebsiteUrl: process.env.VUE_APP_MAIN_WEBSITE_URL
};

const app = express();

app.get("/", function(_, res) {
  const output = Mustache.render(template, config);
  res.send(output).status(200);
});

app.listen(8080, () => {
  logger.info("listening on 8080");
});
