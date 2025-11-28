// services/tracks.service.js
const pool = require("../config/db");

const BASE_SELECT = `
  SELECT
    t.*,
    al.album_id,
    al.album_name,
    COALESCE(art.artists, '[]'::jsonb) AS artists,
    COALESCE(t.track_popularity, t.track_spotify_popularity) AS popularity
  FROM tracks t
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
`;

exports.getTracksService = async (search) => {
  if (search) {
    const res = await pool.query(
      `
      ${BASE_SELECT}
      WHERE t.track_name ILIKE $1
      ORDER BY popularity DESC NULLS LAST
      LIMIT 200
      `,
      [`%${search}%`]
    );
    return res.rows;
  }

  const res = await pool.query(`
    ${BASE_SELECT}
    ORDER BY popularity DESC NULLS LAST
    LIMIT 500
  `);

  return res.rows;
};
