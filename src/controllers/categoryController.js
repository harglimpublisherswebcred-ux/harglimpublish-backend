const categoryService = require('../services/categoryService');

const sendSuccess = (res, data, statusCode = 200) => res.status(statusCode).json({ success: true, data });
const sendPaginated = (res, result) => res.json({ success: true, data: result.items || result.data || [], pagination: result.pagination });
const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

const listCategories = async (req, res) => {
  try {
    sendPaginated(res, await categoryService.listPublicCategories(req.query));
  } catch (error) {
    sendError(res, error);
  }
};

const getCategoryBySlug = async (req, res) => {
  try {
    sendSuccess(res, await categoryService.getPublicCategory(req.params.slug));
  } catch (error) {
    sendError(res, error);
  }
};

const getCategoryBooks = async (req, res) => {
  try {
    const result = await categoryService.getCategoryBooks(req.params.slug, req.query);
    res.json({
      success: true,
      data: result.books,
      category: result.category,
      pagination: result.pagination
    });
  } catch (error) {
    sendError(res, error);
  }
};

const listAdminCategories = async (req, res) => {
  try {
    sendPaginated(res, await categoryService.listAdminCategories(req.query));
  } catch (error) {
    sendError(res, error);
  }
};

const getAdminCategory = async (req, res) => {
  try {
    sendSuccess(res, await categoryService.getAdminCategory(req.params.id));
  } catch (error) {
    sendError(res, error);
  }
};

const createCategory = async (req, res) => {
  try {
    sendSuccess(res, await categoryService.createCategory(req.body, req.user), 201);
  } catch (error) {
    sendError(res, error);
  }
};

const updateCategory = async (req, res) => {
  try {
    sendSuccess(res, await categoryService.updateCategory(req.params.id, req.body, req.user));
  } catch (error) {
    sendError(res, error);
  }
};

const updateCategoryStatus = async (req, res) => {
  try {
    sendSuccess(res, await categoryService.updateCategoryStatus(req.params.id, req.body.active, req.user));
  } catch (error) {
    sendError(res, error);
  }
};

const deleteCategory = async (req, res) => {
  try {
    sendSuccess(res, await categoryService.deleteCategory(req.params.id, req.user));
  } catch (error) {
    sendError(res, error);
  }
};

module.exports = {
  listCategories,
  getCategoryBySlug,
  getCategoryBooks,
  listAdminCategories,
  getAdminCategory,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  deleteCategory
};
