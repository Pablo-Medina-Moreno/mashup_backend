// services/artists.service.js
const pool = require("../config/db");

/**
 * getArtists(search?)
 * Devuelve artistas con sus géneros.
 */
exports.getArtistsService = async (search) => {
  if (search) {
    const res = await pool.query(
      `
      SELECT 
        a.*,
        COALESCE(array_agg(ag.genre) FILTER (WHERE ag.genre IS NOT NULL), '{}') AS genres
      FROM artists a
      LEFT JOIN artist_genres ag ON a.artist_id = ag.artist_id
      WHERE a.artist_name ILIKE $1
      GROUP BY a.artist_id
      ORDER BY a.artist_popularity DESC NULLS LAST
      LIMIT 200
      `,
      [`%${search}%`]
    );
    return res.rows;
  }

  const res = await pool.query(`
    SELECT 
      a.*,
      COALESCE(array_agg(ag.genre) FILTER (WHERE ag.genre IS NOT NULL), '{}') AS genres
    FROM artists a
    LEFT JOIN artist_genres ag ON a.artist_id = ag.artist_id
    GROUP BY a.artist_id
    ORDER BY a.artist_popularity DESC NULLS LAST
    LIMIT 500
  `);

  return res.rows;
};

/**
 * getArtistById(artistId)
 * -----------------------------------------
 * Devuelve UN solo artista por id, incluyendo:
 *  - datos del artista
 *  - genres: array de strings
 *
 * Si no existe → null
 */
exports.getArtistByIdService = async (artistId) => {
  const res = await pool.query(
    `
    SELECT
      a.*,
      COALESCE(
        array_agg(ag.genre) FILTER (WHERE ag.genre IS NOT NULL),
        '{}'
      ) AS genres
    FROM artists a
    LEFT JOIN artist_genres ag
      ON a.artist_id = ag.artist_id
    WHERE a.artist_id = $1
    GROUP BY a.artist_id
    LIMIT 1
    `,
    [artistId]
  );

  return res.rows[0] || null;
};

/**
 * getArtistAlbums(artistId)
 * Devuelve los álbumes cuyo dueño es el artista.
 */
exports.getAlbumsByArtistIdService = async (artistId) => {
  const res = await pool.query(
    `
    SELECT
      al.*,
      ar.artist_name,
      ar.artist_id
    FROM albums al
    JOIN artists ar ON al.artist_id = ar.artist_id
    WHERE al.artist_id = $1
    ORDER BY al.album_release_date DESC NULLS LAST
    `,
    [artistId]
  );

  return res.rows;
};

/**
 * getArtistTracks(artistId)
 * Devuelve canciones donde participa un artista,
 * incluyendo todos los artistas de cada canción.
 */
exports.getTracksByArtistIdService = async (artistId) => {
  const res = await pool.query(
    `
    SELECT 
      t.*,
      al.album_id,
      al.album_name,
      COALESCE(art.artists, '[]'::jsonb) AS artists
    FROM track_artists ta_main
    JOIN tracks t ON t.track_id = ta_main.track_id
    LEFT JOIN albums al ON t.album_id = al.album_id
    LEFT JOIN LATERAL (
      SELECT jsonb_agg(
        jsonb_build_object(
          'artist_id', ar.artist_id,
          'artist_name', ar.artist_name
        )
        ORDER BY ar.artist_popularity DESC NULLS LAST
      ) AS artists
      FROM track_artists ta
      JOIN artists ar ON ta.artist_id = ar.artist_id
      WHERE ta.track_id = t.track_id
    ) art ON TRUE
    WHERE ta_main.artist_id = $1
    ORDER BY COALESCE(t.track_popularity, t.track_spotify_popularity) DESC NULLS LAST
    `,
    [artistId]
  );

  return res.rows;
};
