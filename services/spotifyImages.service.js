// services/spotifyImages.service.js
const { getSpotifyClient } = require("../config/spotifyClient");

const MAX_IDS_PER_REQUEST = 20;

/**
 * Normaliza un id crudo (URL, spotify:album:..., etc.) a un id base62 de 22 chars.
 * Devuelve null si no es válido.
 */
function normalizeRawId(raw) {
  if (!raw) return null;
  let id = String(raw).trim();

  // quitar query params en caso de URL
  if (id.includes("?")) {
    id = id.split("?")[0];
  }

  // si viene como URL https://open.spotify.com/album/XXXX
  if (id.includes("/")) {
    id = id.split("/").pop();
  }

  // si viene como URI spotify:album:XXXX
  if (id.includes(":")) {
    const parts = id.split(":");
    id = parts[parts.length - 1];
  }

  // id válido: 22 caracteres alfanuméricos
  const re = /^[0-9A-Za-z]{22}$/;
  if (!re.test(id)) return null;

  return id;
}

/**
 * Convierte req.query.ids (string "a,b,c" o array) en una lista limpia de ids válidos.
 */
function buildCleanIdList(idsParam) {
  if (!idsParam) return [];

  const rawList = Array.isArray(idsParam)
    ? idsParam
    : String(idsParam).split(",");

  const cleaned = [];
  for (const raw of rawList) {
    const id = normalizeRawId(raw);
    if (id) cleaned.push(id);
  }

  // quitar duplicados
  return [...new Set(cleaned)];
}

/**
 * Parte un array en trozos de tamaño size.
 */
function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

/**
 * Obtiene imágenes de ARTISTAS.
 * Entrada: idsParam (string o array).
 * Salida: objeto { [artistId]: imageUrl | null }
 */
async function getArtistImages(idsParam) {
  const ids = buildCleanIdList(idsParam);
  if (ids.length === 0) return {};

  const chunks = chunk(ids, MAX_IDS_PER_REQUEST);
  const result = {};

  for (const group of chunks) {
    try {
      const client = await getSpotifyClient();
      const { data } = await client.get("/artists", {
        params: { ids: group.join(",") },
      });

      for (const artist of data.artists || []) {
        const bestImage = artist.images?.[0]?.url || null;
        result[artist.id] = bestImage;
      }
    } catch (err) {
      console.error(
        "[SPOTIFY] Error getArtistImages chunk:",
        err.response?.data || err.message
      );
      // seguimos con el siguiente chunk
    }
  }

  return result;
}

/**
 * Obtiene imágenes de ÁLBUMES.
 * Entrada: idsParam (string o array).
 * Salida: objeto { [albumId]: imageUrl | null }
 */
async function getAlbumImages(idsParam) {
  const ids = buildCleanIdList(idsParam);
  if (ids.length === 0) return {};

  const chunks = chunk(ids, MAX_IDS_PER_REQUEST);
  const result = {};

  for (const group of chunks) {
    try {
      const client = await getSpotifyClient();
      const { data } = await client.get("/albums", {
        params: { ids: group.join(",") },
      });

      for (const album of data.albums || []) {
        const bestImage = album.images?.[0]?.url || null;
        result[album.id] = bestImage;
      }
    } catch (err) {
      console.error(
        "[SPOTIFY] Error getAlbumImages chunk:",
        err.response?.data || err.message
      );
      // seguimos con el siguiente chunk
    }
  }

  return result;
}

/**
 * Obtiene imágenes de CANCIONES (tracks).
 * Entrada: idsParam (string o array).
 * Salida: objeto { [trackId]: imageUrl | null }
 *
 * Nota: la imagen de track realmente viene del álbum asociado.
 */
async function getTrackImages(idsParam) {
  const ids = buildCleanIdList(idsParam);
  if (ids.length === 0) return {};

  const chunks = chunk(ids, MAX_IDS_PER_REQUEST);
  const result = {};

  for (const group of chunks) {
    try {
      const client = await getSpotifyClient();
      const { data } = await client.get("/tracks", {
        params: { ids: group.join(",") },
      });

      for (const track of data.tracks || []) {
        const bestImage = track.album?.images?.[0]?.url || null;
        result[track.id] = bestImage;
      }
    } catch (err) {
      console.error(
        "[SPOTIFY] Error getTrackImages chunk:",
        err.response?.data || err.message
      );
      // seguimos con el siguiente chunk
    }
  }

  return result;
}

module.exports = {
  getArtistImages,
  getAlbumImages,
  getTrackImages,
  // helpers para tests si quieres
  _normalizeRawId: normalizeRawId,
  _buildCleanIdList: buildCleanIdList,
};
