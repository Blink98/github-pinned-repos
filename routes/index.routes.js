const express = require("express");
const router = express.Router();
const admin = require("./github.routes");

router.use("/admin", admin);

module.exports = router;
