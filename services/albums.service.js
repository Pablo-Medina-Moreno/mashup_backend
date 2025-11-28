// services/albums.service.js
const pool = require("../config/db");

/**
 * getAlbums(search?)
 * Devuelve álbumes + nombre del artista dueño.
 */
exports.getAlbumsService = async (search) => {
  if (search) {
    const res = await pool.query(
      `
      SELECT
        al.*,
        ar.artist_name,
        ar.artist_id
      FROM albums al
      JOIN artists ar
        ON al.artist_id = ar.artist_id
      WHERE al.album_name ILIKE $1
      ORDER BY al.album_release_date DESC NULLS LAST
      LIMIT 200
      `,
      [`%${search}%`]
    );
    return res.rows;
  }

  const res = await pool.query(`
    SELECT
      al.*,
      ar.artist_name,
      ar.artist_id
    FROM albums al
    JOIN artists ar
      ON al.artist_id = ar.artist_id
    ORDER BY al.album_release_date DESC NULLS LAST
    LIMIT 500
  `);

  return res.rows;
};

/**
 * getAlbumById(albumId)
 * Devuelve el álbum + nombre del artista dueño.
 */
exports.getAlbumByIdService = async (albumId) => {
  const res = await pool.query(
    `
    SELECT
      al.*,
      ar.artist_name,
      ar.artist_id
    FROM albums al
    JOIN artists ar
      ON al.artist_id = ar.artist_id
    WHERE al.album_id = $1
    LIMIT 1
    `,
    [albumId]
  );

  return res.rows[0] || null;
};

/**
 * getTracksByAlbumId(albumId)
 * Devuelve las canciones del álbum + todos los artistas por canción
 * + el nombre (y id) del álbum.
 */
exports.getTracksByAlbumIdService = async (albumId) => {
  const res = await pool.query(
    `
    SELECT
      t.*,
      al.album_id,
      al.album_name,
      COALESCE(art.artists, '[]'::jsonb) AS artists
    FROM tracks t
    JOIN albums al
      ON t.album_id = al.album_id
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
    WHERE t.album_id = $1
    ORDER BY t.track_number ASC NULLS LAST
    `,
    [albumId]
  );

  return res.rows;
};

