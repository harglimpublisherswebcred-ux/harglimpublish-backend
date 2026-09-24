const express = require('express');
const { submitContactRequest } = require('../controllers/contactController');

const router = express.Router();

router.post('/', submitContactRequest);

module.exports = router;
