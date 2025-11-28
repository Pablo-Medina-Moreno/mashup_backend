// controllers/spotifyImages.controller.js
const {
  getArtistImages,
  getAlbumImages,
  getTrackImages,
} = require("../services/spotifyImages.service");

/**
 * GET /api/spotify/artists/images?ids=...
 * ids puede ser "a,b,c" o un array de query (?ids=a&ids=b...)
 */
exports.getArtistImagesController = async (req, res, next) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        error: "Parámetro 'ids' es obligatorio (lista de IDs de artista).",
      });
    }

    const imagesMap = await getArtistImages(ids);
    return res.json({ data: imagesMap });
  } catch (err) {
    console.error("[SPOTIFY] Error getArtistImagesController:", err);
    next(err);
  }
};

/**
 * GET /api/spotify/albums/images?ids=...
 */
exports.getAlbumImagesController = async (req, res, next) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        error: "Parámetro 'ids' es obligatorio (lista de IDs de álbum).",
      });
    }

    const imagesMap = await getAlbumImages(ids);
    return res.json({ data: imagesMap });
  } catch (err) {
    console.error("[SPOTIFY] Error getAlbumImagesController:", err);
    next(err);
  }
};

/**
 * GET /api/spotify/tracks/images?ids=...
 */
exports.getTrackImagesController = async (req, res, next) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        error: "Parámetro 'ids' es obligatorio (lista de IDs de track).",
      });
    }

    const imagesMap = await getTrackImages(ids);
    return res.json({ data: imagesMap });
  } catch (err) {
    console.error("[SPOTIFY] Error getTrackImagesController:", err);
    next(err);
  }
};
