const config = require("../utils/js/config");

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const routes = require("./routes");

const INTERNAL_PORT = config.botmanager.INTERNAL_PORT;
const EXTERNAL_PORT = config.botmanager.EXTERNAL_PORT;

const EXTERNAL_ACCEPTED_TOKENS = config.botmanager.TOKENS;
const INTERNAL_ACCEPTED_TOKENS = Object.keys(config.bots).map((bot) => config.bots[bot].TOKEN);

const TOKEN_TYPE = "Bearer";
app.use((req, res, next) => {
  try {
    if (
      req.socket.localPort === INTERNAL_PORT ||
      (req.socket.localPort === EXTERNAL_PORT &&
        req.headers.authorization.startsWith(TOKEN_TYPE + " ") &&
        EXTERNAL_ACCEPTED_TOKENS.includes(req.headers.authorization.slice(TOKEN_TYPE.length + 1)))
    ) {
      return next();
    } else {
      throw new Error("");
    }
  } catch {
    return res.status(401).json({
      successful: false,
      message: "Unauthorized",
    });
  }
});

app.use(routes);

app.use((req, res, next) => {
  res.status(404).json({
    successful: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    successful: false,
    message: "Internal Server Error",
  });
});

app.listen(INTERNAL_PORT, () => {
  console.log(`Bot Manager listening at internal port http://localhost:${INTERNAL_PORT}`);
});
app.listen(EXTERNAL_PORT, () => {
  // TODO: https?
  console.log(`Bot Manager listening at external port http://localhost:${EXTERNAL_PORT}`);
});
