// controllers/mix.controller.js
const mixService = require("../services/mix.service");

exports.getMixRecommendationsController = async (req, res, next) => {
  try {
    const trackId = req.query.trackId;

    if (!trackId) {
      return res.status(400).json({ error: "trackId es obligatorio" });
    }

    const result = await mixService.getMixByTrackIdService(trackId);

    if (!result.base_track) {
      return res.status(404).json({ error: "Canción base no encontrada" });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};
