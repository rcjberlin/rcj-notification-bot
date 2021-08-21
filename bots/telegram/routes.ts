const express = require("express");
const router = express.Router();

import { bot } from "./telegram-bot";
import { getUsersPerChannelAndTotalUsers } from "./chat-data-persistence";

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

router.get("/v1/users", (req, res) => {
  const { usersPerChannel, totalUsers } = getUsersPerChannelAndTotalUsers();
  res.json({
    successful: true,
    data: {
      telegram: {
        total: totalUsers,
        channels: usersPerChannel,
      },
    },
  });
});

export { router };
