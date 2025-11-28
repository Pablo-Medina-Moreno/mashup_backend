/**
 * Motor de recomendación de mashups / mixes.
 *
 * Flujo:
 *  - En SQL puedes filtrar candidatos por tempo (~ventana de BPM) si la base tiene tempo.
 *  - Aquí convertimos cada fila de la BBDD (base y candidatos)
 *    a un objeto de "features" con nombres genéricos:
 *      tempo, energy, danceability, valence, loudness,
 *      key, mode, popularity, artist_id
 *  - Calculamos un similarity_score para cada candidato.
 *  - Cuanto más BAJO el similarity_score, mejor encaja.
 */

/* ===========================
 * Helpers generales
 * =========================== */

/**
 * Convierte null/undefined en un valor por defecto.
 */
function nz(value, fallback) {
  return value === null || value === undefined ? fallback : value;
}

/**
 * Normaliza un valor entre [min, max].
 */
function normalize(value, min, max, fallbackNormalized = 0.5) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallbackNormalized;
  }
  if (max === min) return fallbackNormalized;
  const clamped = Math.min(Math.max(value, min), max);
  return (clamped - min) / (max - min);
}

/* ===========================
 * Tonalidad (key + mode)
 * =========================== */

/**
 * Devuelve una medida de distancia circular entre dos notas (0-11).
 * 0 = misma nota, 1 = semitono, ..., máximo 6.
 */
function keyDistance(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) {
    return null;
  }
  let diff = Math.abs(a - b);
  diff = Math.min(diff, 12 - diff); // círculo de 12 tonos
  return diff;
}

/**
 * Score de compatibilidad tonal (key + mode).
 * Valores típicos: 0 (perfecto) hasta ~2 (peor).
 */
function keyCompatibilityScore(baseKey, baseMode, candKey, candMode) {
  const dist = keyDistance(baseKey, candKey);

  if (dist === null) {
    // Sin información -> penalización moderada, pero no infinita
    return 1.0;
  }

  const sameMode = baseMode === candMode;

  // Muy compatible
  if (dist === 0 && sameMode) return 0.0;  // misma tonalidad exacta
  if (dist === 0 && !sameMode) return 0.3; // misma nota, distinto modo

  // Tonos muy cercanos
  if (dist === 1 && sameMode) return 0.5;
  if (dist === 2 && sameMode) return 0.7;

  // Quinta / cuarta (muy usadas en DJing)
  if (dist === 5 || dist === 7) {
    return sameMode ? 0.8 : 1.0;
  }

  // Resto: aceptable pero no ideal
  return 1.5;
}

/* ===========================
 * Popularidad
 * =========================== */

/**
 * Extrae una medida de popularidad a partir de la fila de BBDD.
 * Priorizamos campos en rango [0,100]:
 *  - track_popularity
 *  - track_spotify_popularity
 *
 * (Si quisieras usar streams, habría que escalarlo aparte).
 */
function extractPopularityFromRow(row) {
  const candidates = [
    row.track_popularity,
    row.track_spotify_popularity,
    // podrías añadir aquí una transformación de track_spotify_streams
  ];

  for (const p of candidates) {
    if (p !== null && p !== undefined && !Number.isNaN(p)) {
      return Number(p);
    }
  }
  return null;
}

/**
 * Dado el objeto de features (no la fila cruda), devuelve la popularidad usable.
 */
function getPopularity(features) {
  const p = features.popularity;
  if (p === null || p === undefined || Number.isNaN(p)) {
    return null;
  }
  return Number(p);
}

/* ===========================
 * Mapeo fila BBDD → features
 * =========================== */

/**
 * Dado un row de Postgres (con columnas track_*)
 * lo mapeamos a un objeto más amigable para el motor.
 */
function mapDbRowToFeatures(row) {
  return {
    // Audio features principales
    tempo: row.track_tempo,               // BPM
    energy: row.track_energy,             // [0,1]
    danceability: row.track_danceability, // [0,1]
    valence: row.track_valence,           // [0,1]
    loudness: row.track_loudness,         // dB (típicamente negativos)
    key: row.track_key,                   // 0-11
    mode: row.track_mode,                 // 0 o 1 (menor/mayor)

    // Popularidad normalizada a 0-100 (si existe)
    popularity: extractPopularityFromRow(row),

    // Para evitar recomendar siempre el mismo artista
    artist_id: row.artist_id,
  };
}

/* ===========================
 * Similaridad
 * =========================== */

/**
 * Calcula el similarity_score entre dos canciones,
 * pero usando ya el objeto de "features" (no la fila bruta de BBDD).
 *
 * base y cand deben tener:
 *  tempo, energy, danceability, valence, loudness,
 *  key, mode, popularity, artist_id
 *
 * Devuelve un número >= 0 (cuanto menor, mejor).
 */
function computeSimilarityScore(baseFeatures, candFeatures) {
  /* ---------- TEMPO ---------- */
  const hasBaseTempo =
    baseFeatures.tempo !== null &&
    baseFeatures.tempo !== undefined &&
    !Number.isNaN(baseFeatures.tempo);

  const hasCandTempo =
    candFeatures.tempo !== null &&
    candFeatures.tempo !== undefined &&
    !Number.isNaN(candFeatures.tempo);

  let tempoScore = 0;

  if (hasBaseTempo && hasCandTempo) {
    const baseTempo = Number(baseFeatures.tempo);
    const candTempo = Number(candFeatures.tempo);
    const tempoDiff = Math.abs(candTempo - baseTempo);
    // ±4 BPM ~ casi perfecto, ±8 BPM empieza a notarse
    tempoScore = Math.pow(tempoDiff / 8.0, 2);
  } else {
    // Si no tenemos tempo en alguna de las dos, no penalizamos por tempo
    tempoScore = 0;
  }

  /* ---------- RESTO DE FEATURES ---------- */

  const baseEnergy = nz(baseFeatures.energy, 0.5);
  const candEnergy = nz(candFeatures.energy, baseEnergy);

  const baseDance = nz(baseFeatures.danceability, 0.5);
  const candDance = nz(candFeatures.danceability, baseDance);

  const baseValence = nz(baseFeatures.valence, 0.5);
  const candValence = nz(candFeatures.valence, baseValence);

  const baseLoud = nz(baseFeatures.loudness, -10); // dB típicos Spotify
  const candLoud = nz(candFeatures.loudness, baseLoud);

  const baseKey = baseFeatures.key ?? null;
  const baseMode = baseFeatures.mode ?? null;
  const candKey = candFeatures.key ?? null;
  const candMode = candFeatures.mode ?? null;

  // Energy, danceability, valence: en [0,1]
  const energyScore = Math.pow(candEnergy - baseEnergy, 2);
  const danceScore = Math.pow(candDance - baseDance, 2);
  const valenceScore = Math.pow(candValence - baseValence, 2);

  // Loudness: diferencia en dB (menos peso)
  const loudScore = Math.pow((candLoud - baseLoud) / 12.0, 2); // 12 dB ~ distancia 1

  // Key+mode: compatibilidad tonal específica
  const keyScore = keyCompatibilityScore(baseKey, baseMode, candKey, candMode);

  // Popularidad: preferimos temas algo populares (pero sin que domine)
  const popCand = getPopularity(candFeatures);
  const popCandNorm = normalize(popCand, 0, 100, 0.5);
  const popPenalty = 1.0 - popCandNorm; // 0 = súper popular, 1 = nada popular

  // Penalización ligera si es el mismo artista (para diversificar)
  const sameArtist =
    baseFeatures.artist_id &&
    candFeatures.artist_id &&
    baseFeatures.artist_id === candFeatures.artist_id;
  const sameArtistPenalty = sameArtist ? 0.3 : 0.0;

  /* ---------- COMBINACIÓN PONDERADA ---------- */

  // Pesos: tempo sigue siendo importante, pero no lo único.
  const W_TEMPO = 2.5;
  const W_ENERGY = 1.8;
  const W_DANCE = 1.8;
  const W_VALENCE = 1.0;
  const W_LOUD = 0.6;
  const W_KEY = 2.2;
  const W_POP = 0.5;
  const W_SAME_ARTIST = 0.7;

  const score =
    W_TEMPO * tempoScore +
    W_ENERGY * energyScore +
    W_DANCE * danceScore +
    W_VALENCE * valenceScore +
    W_LOUD * loudScore +
    W_KEY * keyScore +
    W_POP * popPenalty +
    W_SAME_ARTIST * sameArtistPenalty;

  return score;
}

/* ===========================
 * Rankeo de candidatos
 * =========================== */

/**
 * Dado un track base (fila de la BBDD) y una lista de candidatos (filas BBDD),
 * devuelve los candidatos ordenados por similitud ASC (mejor primero),
 * añadiendo el campo "similarity_score" en cada objeto.
 *
 * baseTrackRaw: fila devuelta por Postgres (t.* + artist_id, etc.)
 * candidatesRaw: array de filas de Postgres.
 */
function rankCandidatesForTrack(baseTrackRaw, candidatesRaw) {
  // Convertimos la fila base a features
  const baseFeatures = mapDbRowToFeatures(baseTrackRaw);

  const scored = candidatesRaw.map((candRaw) => {
    const candFeatures = mapDbRowToFeatures(candRaw);
    const similarity_score = computeSimilarityScore(baseFeatures, candFeatures);

    // Devolvemos la fila original + el score calculado
    return {
      ...candRaw,
      similarity_score,
    };
  });

  // Ordenamos por similitud (menor primero)
  scored.sort((a, b) => a.similarity_score - b.similarity_score);

  return scored;
}

module.exports = {
  computeSimilarityScore,
  rankCandidatesForTrack,
  // helpers exportados por si quieres testearlos
  mapDbRowToFeatures,
  keyCompatibilityScore,
};
