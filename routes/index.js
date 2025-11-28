// routes/index.js
const express = require("express");
const router = express.Router();

const artistsRoutes = require("./artists.routes");
const albumsRoutes = require("./albums.routes");
const tracksRoutes = require("./tracks.routes");
const mixRoutes = require("./mix.routes");
const spotifyRoutes = require("./spotify.routes");

router.use("/artists", artistsRoutes);
router.use("/albums", albumsRoutes);
router.use("/tracks", tracksRoutes);
router.use("/mix", mixRoutes);
router.use("/spotify", spotifyRoutes);

module.exports = router;
