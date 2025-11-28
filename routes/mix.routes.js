// routes/mix.routes.js
const express = require("express");
const router = express.Router();
const mixController = require("../controllers/mix.controller");

// /api/mix?trackId=
router.get("/", mixController.getMixRecommendationsController);

module.exports = router;
