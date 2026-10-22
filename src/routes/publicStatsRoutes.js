const express = require('express');
const { getPublicStats } = require('../controllers/publicStatsController');

const router = express.Router();
router.get('/public', getPublicStats);

module.exports = router;
