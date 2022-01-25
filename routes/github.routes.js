const express = require("express");
const apiRoutes = express.Router();
const git = require("../controller/git");

apiRoutes.get("/get/:username", git.getPascodes);

module.exports = apiRoutes;
