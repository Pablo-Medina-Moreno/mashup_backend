// routes/tracks.routes.js
const express = require("express");
const router = express.Router();
const tracksController = require("../controllers/tracks.controller");

router.get("/", tracksController.getTracksController);

module.exports = router;
