// server.js
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const apiRoutes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Rutas API
app.use("/api", apiRoutes);

// Healthcheck
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Music API running" });
});

// Middleware de errores
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

module.exports = app;
