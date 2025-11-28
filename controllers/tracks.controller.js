// controllers/tracks.controller.js
const tracksService = require("../services/tracks.service");

/**
 * GET /tracks?search=...
 * -----------------------------------------
 * Devuelve una lista de canciones con:
 *   - TODAS las columnas del track (track_*)
 *   - album_id, album_name
 *   - artists: [
 *        { artist_id, artist_name },
 *        ...
 *     ]
 *
 * search:
 *   - si ?search=texto → filtra por track_name ILIKE
 *   - si no → devuelve hasta 500 tracks ordenadas por popularidad
 *
 * Ejemplo de respuesta:
 *   {
 *     track_id: "...",
 *     track_name: "...",
 *     track_duration_ms: 12345,
 *     album_id: "...",
 *     album_name: "...",
 *     artists: [
 *       { artist_id: "X", artist_name: "..." },
 *       { artist_id: "Y", artist_name: "..." }
 *     ]
 *   }
 */
exports.getTracksController = async (req, res, next) => {
  try {
    const { search } = req.query;
    const tracks = await tracksService.getTracksService(search);
    res.json({ data: tracks });
  } catch (err) {
    next(err);
  }
};
