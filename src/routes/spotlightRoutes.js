const express = require('express');
const { listPublic } = require('../controllers/spotlightController');

const router = express.Router();
router.get('/', listPublic);

module.exports = router;
