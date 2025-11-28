// controllers/artists.controller.js
const artistsService = require("../services/artists.service");

/**
 * GET /artists?search=...
 * -----------------------------------------
 * Devuelve una lista de artistas.
 *
 * Cada artista incluye:
 *   - artist_id
 *   - artist_name
 *   - artist_spotify_url
 *   - artist_popularity
 *   - artist_followers
 *   - genres: ["latin", "pop", ...]
 *
 * search:
 *   - si se envía ?search=texto → filtra por artist_name ILIKE
 *   - si no → devuelve hasta 500 artistas ordenados por popularidad
 */
exports.getArtistsController = async (req, res, next) => {
  try {
    const { search } = req.query;
    const artists = await artistsService.getArtistsService(search);
    res.json({ data: artists });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /artists/:artistId
 * -----------------------------------------
 * Detalle COMPLETO del artista:
 *
 * Devuelve un objeto:
 *   {
 *     artist: { ...datos del artista + genres[] }
 *     albums: [ ...álbumes del artista ]
 *     tracks: [ ...canciones del artista (con artists[] y album_name) ]
 *   }
 *
 * Si el artista NO existe:
 *   status 404 y:
 *   {
 *     artist: null,
 *     albums: [],
 *     tracks: []
 *   }
 */
exports.getArtistByIdController = async (req, res, next) => {
  try {
    const { artistId } = req.params;

    const artist = await artistsService.getArtistByIdService(artistId);

    if (!artist) {
      return res.status(404).json({
        artist: null,
        albums: [],
        tracks: [],
      });
    }

    // Álbumes + canciones del artista
    const [albums, tracks] = await Promise.all([
      artistsService.getAlbumsByArtistIdService(artistId),
      artistsService.getTracksByArtistIdService(artistId),
    ]);

    res.json({ artist, albums, tracks });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /artists/:artistId/albums
 * -----------------------------------------
 * Devuelve SOLO los álbumes del artista.
 *
 * Cada álbum incluye:
 *   - album_id
 *   - album_name
 *   - album_release_date
 *   - album_total_tracks
 *   - album_spotify_url
 *   - artist_id
 *   - artist_name
 */
exports.getAlbumsByArtistIdController = async (req, res, next) => {
  try {
    const { artistId } = req.params;
    const albums = await artistsService.getAlbumsByArtistIdService(artistId);
    res.json({ data: albums });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /artists/:artistId/tracks
 * -----------------------------------------
 * Devuelve SOLO las canciones donde el artista participa.
 *
 * Cada track incluye:
 *   - TODAS las columnas track_*
 *   - album_id, album_name
 *   - artists: [
 *        { artist_id, artist_name }
 *        ...
 *     ]
 *
 * Esto permite al front mostrar:
 *   • canción → lista completa de artistas
 *   • al hacer click → navegar a artista o álbum correspondiente
 */
exports.getTracksByArtistIdController = async (req, res, next) => {
  try {
    const { artistId } = req.params;
    const tracks = await artistsService.getTracksByArtistIdService(artistId);
    res.json({ data: tracks });
  } catch (err) {
    next(err);
  }
};
