const config = require("./utils/config");
const channels = require("./utils/channels");

const express = require("express");
const router = express.Router();

const request = require("./utils/request");

router.get("/", (req, res) => {
  res.json({
    successful: true,
  });
});

router.get("/v1/channels", (req, res) => {
  res.json({
    successful: true,
    data: channels,
  });
});

router.post("/v1/send", async (req, res) => {
  const responses = await Promise.all(
    Object.keys(config.bots).map((bot) => request("POST", `http://localhost:${config.bots[bot].INTERNAL_PORT}/v1/send`, {}, req.body))
  );

  let users = 0;
  for (let i = 0; i < Object.keys(config.bots).length; i++) {
    if (responses[i].status !== 200) {
      // TODO: retry later, bot is probably only down for some time
      // TODO: alert admins (via bots?)
    }
    try {
      users += responses[i].json.data.users;
    } catch {
      // TODO
    }
  }

  res.json({
    successful: true,
    data: {
      users,
    },
  });
});

module.exports = router;
