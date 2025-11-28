// services/mix.service.js
const pool = require("../config/db");
const { rankCandidatesForTrack } = require("./recommendationEngine");

/**
 * Devuelve:
 * {
 *   base_track: {...},
 *   recommendations: [ {...}, {...}, ... ]
 * }
 */
exports.getMixByTrackIdService = async (trackId) => {
  // 1. Canción base (con artista principal)
  const baseResult = await pool.query(
    `
    SELECT
      t.*,
      a.artist_name,
      a.artist_id,
      al.album_name
    FROM tracks t
    LEFT JOIN albums al
      ON t.album_id = al.album_id
    LEFT JOIN LATERAL (
      SELECT ar.artist_id, ar.artist_name
      FROM track_artists ta
      JOIN artists ar
        ON ta.artist_id = ar.artist_id
      WHERE ta.track_id = t.track_id
      ORDER BY ar.artist_popularity DESC NULLS LAST
      LIMIT 1
    ) a ON TRUE
    WHERE t.track_id = $1
    LIMIT 1
    `,
    [trackId]
  );

  if (baseResult.rows.length === 0) {
    return { base_track: null, recommendations: [] };
  }

  const baseTrack = baseResult.rows[0];
  const baseTempo = baseTrack.track_tempo;

  const hasTempo =
    baseTempo !== null &&
    baseTempo !== undefined &&
    !Number.isNaN(Number(baseTempo));

  let candidatesResult;

  if (hasTempo) {
    // ✅ MODO NORMAL: filtramos por ventana de BPM
    const tempoMin = baseTempo - 8;
    const tempoMax = baseTempo + 8;

    candidatesResult = await pool.query(
      `
      SELECT
        t.*,
        a.artist_name,
        a.artist_id,
        al.album_name
      FROM tracks t
      LEFT JOIN albums al
        ON t.album_id = al.album_id
      LEFT JOIN LATERAL (
        SELECT ar.artist_id, ar.artist_name
        FROM track_artists ta
        JOIN artists ar
          ON ta.artist_id = ar.artist_id
        WHERE ta.track_id = t.track_id
        ORDER BY ar.artist_popularity DESC NULLS LAST
        LIMIT 1
      ) a ON TRUE
      WHERE t.track_id <> $1
        AND t.track_tempo IS NOT NULL
        AND t.track_tempo BETWEEN $2 AND $3
      LIMIT 1000
      `,
      [trackId, tempoMin, tempoMax]
    );
  } else {
    // 🔁 MODO SIN TEMPO: no filtramos por BPM,
    // dejamos que el motor use energy/danceability/valence/key/etc.
    candidatesResult = await pool.query(
      `
      SELECT
        t.*,
        a.artist_name,
        a.artist_id,
        al.album_name
      FROM tracks t
      LEFT JOIN albums al
        ON t.album_id = al.album_id
      LEFT JOIN LATERAL (
        SELECT ar.artist_id, ar.artist_name
        FROM track_artists ta
        JOIN artists ar
          ON ta.artist_id = ar.artist_id
        WHERE ta.track_id = t.track_id
        ORDER BY ar.artist_popularity DESC NULLS LAST
        LIMIT 1
      ) a ON TRUE
      WHERE t.track_id <> $1
      LIMIT 1000
      `,
      [trackId]
    );
  }

  const candidates = candidatesResult.rows;

  if (candidates.length === 0) {
    return {
      base_track: baseTrack,
      recommendations: [],
    };
  }

  // 3. Ordenar candidatos por similitud usando el motor de recomendación
  const ranked = rankCandidatesForTrack(baseTrack, candidates);

  // 4. Limitar a las top N recomendaciones (ej. 10)
  const TOP_N = 10;
  const recommendations = ranked.slice(0, TOP_N);

  return {
    base_track: baseTrack,
    recommendations,
  };
};
