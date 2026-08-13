const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, getMe, refreshToken, logoutUser, forgotPassword, resetPassword, changePassword } = require('../controllers/authController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin, validateGoogleLogin } = require('../validators/authValidator');

router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/google', validateGoogleLogin, googleLogin);
router.get('/me', protect, getMe);
router.post('/refresh', optionalProtect, refreshToken);
router.post('/logout', optionalProtect, logoutUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.post('/reset-password/:token', resetPassword);
router.put('/change-password', protect, changePassword);
router.post('/change-password', protect, changePassword);

module.exports = router;
