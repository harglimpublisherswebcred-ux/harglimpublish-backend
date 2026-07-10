const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/environment');

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = { generateToken };
