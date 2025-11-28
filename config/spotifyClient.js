// config/spotifyClient.js
require("dotenv").config();
const axios = require("axios");
const qs = require("qs");

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
} = process.env;

let accessToken = null;
let tokenExpiresAt = 0; // timestamp en ms

async function fetchAccessToken() {
  const now = Date.now();
  // si el token sigue siendo válido 60s más, no pedimos otro
  if (accessToken && now < tokenExpiresAt - 60_000) {
    return accessToken;
  }

  const authHeader = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const body = qs.stringify({
    grant_type: "client_credentials",
  });

  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    body,
    {
      headers: {
        Authorization: `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  accessToken = res.data.access_token;
  const expiresIn = res.data.expires_in || 3600; // segundos
  tokenExpiresAt = Date.now() + expiresIn * 1000;

  return accessToken;
}

/**
 * Devuelve una instancia de axios ya configurada con el
 * access token válido de Spotify.
 */
async function getSpotifyClient() {
  const token = await fetchAccessToken();

  return axios.create({
    baseURL: "https://api.spotify.com/v1",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    timeout: 5000,
  });
}

module.exports = {
  getSpotifyClient,
};
