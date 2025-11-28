// routes/artists.routes.js
const express = require("express");
const router = express.Router();
const artistsController = require("../controllers/artists.controller");

router.get("/", artistsController.getArtistsController);
router.get("/:artistId", artistsController.getArtistByIdController);
router.get("/:artistId/albums", artistsController.getAlbumsByArtistIdController);
router.get("/:artistId/tracks", artistsController.getTracksByArtistIdController);

module.exports = router;
