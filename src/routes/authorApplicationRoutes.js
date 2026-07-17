const express = require('express');
const { submitAuthorApplication } = require('../controllers/authorApplicationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, submitAuthorApplication);

module.exports = router;
