const publicStatsService = require('../services/publicStatsService');

const getPublicStats = async (req, res) => {
  try {
    res.json({ success: true, data: await publicStatsService.getPublicStats() });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = { getPublicStats };
