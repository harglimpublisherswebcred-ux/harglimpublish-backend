const { check, validationResult } = require('express-validator');

const validateRegister = [
  check('name', 'Name is required').not().isEmpty().trim().escape(),
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    // Public registration never accepts privilege-bearing role input. The
    // service layer also enforces reader creation if this middleware is bypassed.
    delete req.body.role;
    next();
  },
];

const validateLogin = [
  check('email', 'Please include a valid email').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];

const validateGoogleLogin = [
  check('credential', 'Google credential is required').isString().trim().notEmpty().isLength({ max: 4096 }),
  (req, res, next) => {
    const errors = validationResult(req).array();
    const forbiddenFields = ['role', 'email', 'googleId', 'providerSubject', 'author', 'admin', 'dashboardEntitlement'];
    for (const field of forbiddenFields) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        errors.push({
          type: 'field',
          value: req.body[field],
          msg: `${field} is not accepted for Google login`,
          path: field,
          location: 'body'
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }
    next();
  },
];

module.exports = {
  validateRegister,
  validateLogin,
  validateGoogleLogin,
};
