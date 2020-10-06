const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    successful: true,
  });
});

router.get("/v1/channels", (req, res) => {
  res.json({
    successful: true,
    data: [
      { id: 1, channel: "General" },
      { id: 2, channel: "Rescue Line" },
      { id: 3, channel: "Rescue Line Entry" },
    ],
  });
});

router.post("/v1/send", (req, res) => {
  // TODO: send request to all bots (promise.all) + sum number of notified users per bot
  res.json({
    successful: true,
    data: {
      users: 0,
    },
  });
});

module.exports = router;
