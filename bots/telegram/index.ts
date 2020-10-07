import config = require("../../bot-manager/utils/config");

import express = require("express");
const app = express();
import bodyParser = require("body-parser");
app.use(bodyParser.json());

import { router as routes } from "./routes"
import middleware = require("../../bot-manager/utils/middleware");

const PORT = config.bots.telegram.INTERNAL_PORT;

app.use(routes);

app.use(middleware.routeNotFound);
app.use(middleware.internalServerError);

app.listen(PORT, () => {
  console.log(`Telegram Bot listening at internal port http://localhost:${PORT}`);
});
