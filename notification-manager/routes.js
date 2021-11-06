const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    successful: true,
  });
});

router.post("/v1/event", async (req, res) => {
  console.log(req.body);
  // TODO

  res.json({
    successful: true,
  });
});

module.exports = router;
