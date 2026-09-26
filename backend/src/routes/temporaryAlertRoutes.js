const express = require('express');
const router = express.Router();
const TemporaryAlertController = require('../controllers/temporaryAlertController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// Public & Tourist Endpoints (ACTIVE ONLY)
router.get('/active', TemporaryAlertController.getActiveAlerts);
router.get('/active/:id', TemporaryAlertController.getAlertById);

// Admin Management Endpoints
router.get('/', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.getAllAlerts);
router.post('/', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.createAlert);

router.get('/:id', TemporaryAlertController.getAlertById);
router.put('/:id', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.updateAlert);

router.patch('/:id/resolve', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.resolveAlert);
router.post('/:id/resolve', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.resolveAlert);

router.patch('/:id/extend', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.extendAlert);
router.post('/:id/extend', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.extendAlert);

router.patch('/:id/disable', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.disableAlert);
router.post('/:id/disable', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.disableAlert);

router.patch('/:id/activate', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.activateAlert);
router.post('/:id/activate', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.activateAlert);

router.patch('/:id/status', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.updateStatus);
router.post('/:id/status', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.updateStatus);

router.delete('/:id', authenticateJWT, authorizeRoles('Admin', 'Police'), TemporaryAlertController.deleteAlert);

module.exports = router;
