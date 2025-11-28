// controllers/albums.controller.js
const albumsService = require("../services/albums.service");

/**
 * GET /albums?search=...
 * -----------------------------------------
 * Devuelve una lista de álbumes.
 *
 * Cada álbum incluye:
 *   - album_id
 *   - album_name
 *   - album_release_date
 *   - album_type
 *   - album_total_tracks
 *   - album_spotify_url
 *   - artist_id        (dueño del álbum)
 *   - artist_name      (nombre del artista dueño)
 *
 * search:
 *   - si se envía ?search=texto → filtra por album_name ILIKE
 *   - si no → devuelve hasta 500 álbumes ordenados por fecha
 */
exports.getAlbumsController = async (req, res, next) => {
  try {
    const { search } = req.query;
    const albums = await albumsService.getAlbumsService(search);
    res.json({ data: albums });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /albums/:albumId
 * -----------------------------------------
 * Devuelve SOLO la información del álbum indicado.
 *
 * Respuesta:
 *   { data: albumObject | null }
 *
 * Si el álbum existe:
 *   {
 *     album_id,
 *     album_name,
 *     album_release_date,
 *     album_total_tracks,
 *     album_type,
 *     album_spotify_url,
 *     artist_id,
 *     artist_name
 *   }
 *
 * Si NO existe:
 *   { data: null } con status 404
 */
exports.getAlbumByIdController = async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const album = await albumsService.getAlbumByIdService(albumId);

    if (!album) {
      return res.status(404).json({ data: null });
    }

    res.json({ data: album });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /albums/:albumId/tracks
 * -----------------------------------------
 * Devuelve TODAS las canciones pertenecientes a un álbum.
 *
 * Cada track incluye:
 *   - TODAS las columnas track_*
 *   - artists: [
 *        { artist_id, artist_name },
 *        ...
 *     ]
 *
 * Esto permite al front renderizar correctamente:
 *   - nombre de la canción
 *   - lista de artistas (clicables)
 *   - metadata completa
 */
exports.getTracksByAlbumIdController = async (req, res, next) => {
  try {
    const { albumId } = req.params;
    const tracks = await albumsService.getTracksByAlbumIdService(albumId);
    res.json({ data: tracks });
  } catch (err) {
    next(err);
  }
};
