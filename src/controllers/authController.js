const authService = require('../services/authService');

const requestContext = (req) => ({
  userAgent: req.get('user-agent'),
  ipAddress: req.ip
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const data = await authService.register(req.body, requestContext(req));
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const data = await authService.login(req.body, requestContext(req));
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const refreshToken = async (req, res) => {
  try {
    const data = await authService.refresh({
      userId: req.user && req.user.id,
      refreshToken: req.body && req.body.refreshToken
    }, requestContext(req));
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const logoutUser = async (req, res) => {
  try {
    const data = await authService.logout({
      userId: req.user && req.user.id,
      refreshToken: req.body && req.body.refreshToken,
      all: req.body && req.body.all
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    res.json({ success: true, data: await authService.forgotPassword(req.body.email) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    res.json({ success: true, data: await authService.resetPassword(req.params.token, req.body.password, requestContext(req)) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const data = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.password, requestContext(req));
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
};
