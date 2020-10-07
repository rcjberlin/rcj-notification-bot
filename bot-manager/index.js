const config = require("./utils/config");

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());

const routes = require("./routes");
const middleware = require("./utils/middleware");

const INTERNAL_PORT = config.botmanager.INTERNAL_PORT;
const EXTERNAL_PORT = config.botmanager.EXTERNAL_PORT;

const EXTERNAL_ACCEPTED_TOKENS = config.botmanager.TOKENS;

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

app.use(middleware.routeNotFound);
app.use(middleware.internalServerError);

app.listen(INTERNAL_PORT, () => {
  console.log(`Bot Manager listening at internal port http://localhost:${INTERNAL_PORT}`);
});
app.listen(EXTERNAL_PORT, () => {
  // TODO: https?
  console.log(`Bot Manager listening at external port http://localhost:${EXTERNAL_PORT}`);
});
