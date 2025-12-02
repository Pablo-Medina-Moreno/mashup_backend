// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const apiRoutes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Mensaje cuando se visita /api
app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend de Mashup Intelligence en ejecución"
  });
});

// Rutas API reales
app.use("/api", apiRoutes);

// Middleware de errores
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

module.exports = app;
