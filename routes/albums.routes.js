// routes/albums.routes.js
const express = require("express");
const router = express.Router();
const albumsController = require("../controllers/albums.controller");

router.get("/", albumsController.getAlbumsController);
router.get("/:albumId", albumsController.getAlbumByIdController);
router.get("/:albumId/tracks", albumsController.getTracksByAlbumIdController);

module.exports = router;
