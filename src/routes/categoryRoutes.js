const express = require('express');
const {
  listCategories,
  getCategoryBySlug,
  getCategoryBooks
} = require('../controllers/categoryController');

const router = express.Router();

router.get('/', listCategories);
router.get('/:slug/books', getCategoryBooks);
router.get('/:slug', getCategoryBySlug);

module.exports = router;
