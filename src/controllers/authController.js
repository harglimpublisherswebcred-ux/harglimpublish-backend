const authService = require('../services/authService');

const requestContext = (req) => ({
  userAgent: req.get('user-agent'),
  ipAddress: req.ip
});

const sendAuthError = (res, error) => {
  res.status(error.statusCode || 500).json({
    success: false,
    ...(error.code && { error: error.code }),
    message: error.message
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const data = await authService.register(req.body, requestContext(req));
    res.status(201).json({ success: true, data });
  } catch (error) {
    sendAuthError(res, error);
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
    sendAuthError(res, error);
  }
};

// @desc    Authenticate with Google Identity Services credential
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const data = await authService.loginWithGoogle(req.body, requestContext(req));
    res.json({ success: true, data });
  } catch (error) {
    sendAuthError(res, error);
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
    sendAuthError(res, error);
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
    sendAuthError(res, error);
  }
};

const forgotPassword = async (req, res) => {
  try {
    res.json({ success: true, data: await authService.forgotPassword(req.body.email) });
  } catch (error) {
    sendAuthError(res, error);
  }
};

const resetPassword = async (req, res) => {
  try {
    res.json({ success: true, data: await authService.resetPassword(req.params.token, req.body.password, requestContext(req)) });
  } catch (error) {
    sendAuthError(res, error);
  }
};

const changePassword = async (req, res) => {
  try {
    const data = await authService.changePassword(req.user.id, req.body.currentPassword, req.body.password, requestContext(req));
    res.json({ success: true, data });
  } catch (error) {
    sendAuthError(res, error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLogin,
  getMe,
  refreshToken,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
};
