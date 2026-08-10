const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map((err) => ({ [err.param || err.path]: err.msg }));
    return next(new ApiError(422, 'Validation failed. Invalid input provided.', extractedErrors));
  };
};

const registerValidation = validate([
  body('full_name').notEmpty().withMessage('Full name is required.').trim(),
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone number is required.').trim(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.'),
  body('role').optional().isIn(['Admin', 'Tourist', 'Police', 'Hospital']).withMessage('Invalid role specified.')
]);

const loginValidation = validate([
  body('email').isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password cannot be empty.')
]);

module.exports = {
  registerValidation,
  loginValidation
};
