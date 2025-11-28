// routes/spotify.routes.js
const express = require("express");
const router = express.Router();

const spotifyImagesController = require("../controllers/spotifyImages.controller");

// /api/spotify/artists/images?ids=...
router.get("/artists/images", spotifyImagesController.getArtistImagesController);

// /api/spotify/albums/images?ids=...
router.get("/albums/images", spotifyImagesController.getAlbumImagesController);

// /api/spotify/tracks/images?ids=...
router.get("/tracks/images", spotifyImagesController.getTrackImagesController);

module.exports = router;
