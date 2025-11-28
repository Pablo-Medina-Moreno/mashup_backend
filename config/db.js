// config/db.js
const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida en el .env");
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false
});

pool.on("error", (err) => {
  console.error("Error inesperado en el pool de PostgreSQL", err);
  process.exit(-1);
});

module.exports = pool;
