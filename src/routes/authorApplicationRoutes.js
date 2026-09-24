const express = require('express');
const { submitAuthorApplication, getMyAuthorApplication } = require('../controllers/authorApplicationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, submitAuthorApplication);
router.get('/me', protect, getMyAuthorApplication);

module.exports = router;
