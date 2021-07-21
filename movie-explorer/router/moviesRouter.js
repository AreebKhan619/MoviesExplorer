var express = require("express");
var router = express.Router();

// Home page route.
router.get("/", function (req, res) {
  res.send("This endpoint is working");
});

// About page route.
router.get("/about", function (req, res) {
  res.send("About this wiki");
});

module.exports = router;
