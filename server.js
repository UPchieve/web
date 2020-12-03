const express = require("express");
const fs = require("fs");
const Mustache = require("mustache");
const logger = require("pino")();
const path = require("path");

const app = express();

const indexHtml = renderIndexHtml();

app.use(express.static(path.join(__dirname, 'dist')));

app.use((_, res) => {
  res.send(indexHtml).status(200);
});

app.listen(8080, () => {
  logger.info("listening on 8080");
});

function renderIndexHtml() {
  let template = "";
  const indexPath = path.join(__dirname, "dist/index.html");
  try {
    template = fs.readFileSync(indexPath, "utf8");
  } catch (err) {
    logger.error(`error reading index.html file: ${err}`);
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

  return Mustache.render(template, config);
}
