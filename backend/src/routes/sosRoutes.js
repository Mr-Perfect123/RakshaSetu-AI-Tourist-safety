const express = require('express');
const router = express.Router();
const SosController = require('../controllers/sosController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const { triggerSosValidation } = require('../validators/sosValidator');
const { sosRateLimiter } = require('../middleware/rateLimiter');

router.post('/trigger', authenticateJWT, sosRateLimiter, triggerSosValidation, SosController.triggerSos);
router.get('/active', authenticateJWT, authorizeRoles('Admin', 'Police', 'Hospital'), SosController.getActiveSos);
router.get('/history', authenticateJWT, SosController.getUserSosHistory);
router.patch('/:id/status', authenticateJWT, authorizeRoles('Admin', 'Police', 'Hospital'), SosController.updateSosStatus);
router.post('/:id/cancel', authenticateJWT, SosController.cancelSos);

module.exports = router;
