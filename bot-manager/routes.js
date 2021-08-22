const config = require("./utils/config");
const channels = require("./utils/channels");

const express = require("express");
const router = express.Router();

const request = require("./utils/request");
const messageHistory = require("./message-history");

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
  const messageLog = { message: req.body.message, channelIds: req.body.channelIds, bots: {} };
  for (let i = 0; i < Object.keys(config.bots).length; i++) {
    if (responses[i].status !== 200) {
      // TODO: retry later, bot is probably only down for some time
      // TODO: alert admins (via bots?)
      messageLog.bots[Object.keys(config.bots)[i]] = { successful: false };
      continue;
    }
    try {
      const usersCurrentBot = responses[i].json.data.users;
      users += usersCurrentBot;
      messageLog.bots[Object.keys(config.bots)[i]] = { successful: true, users: usersCurrentBot };
    } catch {
      // TODO
    }
  }
  messageLog["users"] = users;
  messageHistory.writeLog(messageLog);

  res.json({
    successful: true,
    data: messageLog,
  });
});

router.get("/v1/users", async (req, res) => {
  const responses = await Promise.all(
    Object.keys(config.bots).map((bot) => request("GET", `http://localhost:${config.bots[bot].INTERNAL_PORT}/v1/users`))
  );

  const responseData = {};
  for (let i = 0; i < Object.keys(config.bots).length; i++) {
    const botPrefix = Object.keys(config.bots)[i];
    if (responses[i].status !== 200) {
      // TODO: retry later, bot is probably only down for some time
      // TODO: alert admins (via bots?)

      responseData[botPrefix] = { total: 0, channels: {} };
      continue;
    }
    try {
      const data = responses[i].json.data;
      for (const bot in data) {
        responseData[`${botPrefix}-${bot}`] = data[bot];
      }
    } catch {
      // TODO
    }
  }

  res.json({
    successful: true,
    data: responseData,
  });
});

router.get("/v1/messages", (req, res) => {
 res.json({
    successful: true,
    data: messageHistory.getAllLogs(),
  });
});

module.exports = router;
