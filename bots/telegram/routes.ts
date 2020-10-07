const express = require("express");
const router = express.Router();

import { bot } from "./telegram-bot";

router.get("/", (req, res) => {
  res.json({
    successful: true,
  });
});

router.post("/v1/send", async (req, res) => {
  const users = bot.sendMessageToChannels(req.body.message, req.body.channelIds);

  res.json({
    successful: true,
    data: {
      users,
    },
  });
});

export { router };
