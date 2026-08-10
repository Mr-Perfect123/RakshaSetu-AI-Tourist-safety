const { body, validationResult } = require('express-validator');
const ApiError = require('../utils/apiError');

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();
    return next(new ApiError(422, 'Invalid SOS request payload.', errors.array()));
  };
};

const triggerSosValidation = validate([
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required.'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required.'),
  body('triggerType').optional().isIn(['one_tap', 'voice', 'shake', 'auto_crash', 'offline_sms']).withMessage('Invalid trigger type.')
]);

module.exports = { triggerSosValidation };
