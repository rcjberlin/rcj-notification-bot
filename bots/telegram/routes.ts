const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    successful: true,
  });
});

router.post("/v1/send", async (req, res) => {
  // TODO: forward to telegram bot instance

  res.json({
    successful: false,
    data: {
      users: 0,
    },
  });
});

export { router };
