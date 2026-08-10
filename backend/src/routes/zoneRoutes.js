const express = require('express');
const router = express.Router();
const ZoneController = require('../controllers/zoneController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

router.get('/danger-zones', ZoneController.getDangerZones);
router.post('/danger-zones', authenticateJWT, authorizeRoles('Admin', 'Police'), ZoneController.createDangerZone);
router.patch('/danger-zones/:id/toggle', authenticateJWT, authorizeRoles('Admin', 'Police'), ZoneController.toggleDangerZone);

module.exports = router;
