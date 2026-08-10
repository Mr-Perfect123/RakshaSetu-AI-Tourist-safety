const express = require('express');
const router = express.Router();
const AlertController = require('../controllers/alertController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

router.get('/active', AlertController.getActiveRedAlerts);
router.post('/', authenticateJWT, authorizeRoles('Admin', 'Police'), AlertController.createRedAlert);
router.patch('/:id/deactivate', authenticateJWT, authorizeRoles('Admin', 'Police'), AlertController.deactivateAlert);

module.exports = router;
