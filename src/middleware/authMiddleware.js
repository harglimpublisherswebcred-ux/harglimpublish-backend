const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { getJwtSecret } = require('../config/environment');

const attachUserFromToken = async (req) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) return null;
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, getJwtSecret());
  const user = await User.findById(decoded.id).select('-password');
  return user;
};

const protect = async (req, res, next) => {
  try {
    const user = await attachUserFromToken(req);
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Not authorized, no token' });
    }
    req.user = user;
    next();
  } catch (error) {
    logger.warn('auth.token_failed', { message: error.message });
    res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
  }
};

const optionalProtect = async (req, res, next) => {
  try {
    const user = await attachUserFromToken(req);
    if (user) req.user = user;
    next();
  } catch (error) {
    logger.warn('auth.optional_token_failed', { message: error.message });
    next();
  }
};

module.exports = { protect, optionalProtect };
