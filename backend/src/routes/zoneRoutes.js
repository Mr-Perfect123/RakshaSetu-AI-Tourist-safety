const express = require('express');
const router = express.Router();
const ZoneController = require('../controllers/zoneController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

// Public & Tourist Read Endpoints
router.get('/', ZoneController.getDangerZones);
router.get('/danger-zones', ZoneController.getDangerZones);
router.post('/route-analysis', ZoneController.analyzeRouteSafety);
router.post('/sync', ZoneController.syncDangerZones);
router.get('/danger-zones/:id', ZoneController.getDangerZoneById);
router.get('/:id', ZoneController.getDangerZoneById);

// Admin & Police Management Endpoints
router.post('/danger-zones', authenticateJWT, authorizeRoles('Admin', 'Police'), ZoneController.createDangerZone);
router.post('/', authenticateJWT, authorizeRoles('Admin', 'Police'), ZoneController.createDangerZone);

router.put('/danger-zones/:id', authenticateJWT, authorizeRoles('Admin', 'Police'), ZoneController.updateDangerZone);
router.put('/:id', authenticateJWT, authorizeRoles('Admin', 'Police'), ZoneController.updateDangerZone);

router.delete('/danger-zones/:id', authenticateJWT, authorizeRoles('Admin', 'Police'), ZoneController.deleteDangerZone);
router.delete('/:id', authenticateJWT, authorizeRoles('Admin', 'Police'), ZoneController.deleteDangerZone);

router.patch('/danger-zones/:id/toggle', authenticateJWT, authorizeRoles('Admin', 'Police'), ZoneController.toggleDangerZone);
router.patch('/:id/toggle', authenticateJWT, authorizeRoles('Admin', 'Police'), ZoneController.toggleDangerZone);

module.exports = router;

