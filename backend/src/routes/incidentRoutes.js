const express = require('express');
const router = express.Router();
const IncidentController = require('../controllers/incidentController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post(
  '/report',
  authenticateJWT,
  upload.fields([{ name: 'images', maxCount: 5 }, { name: 'videos', maxCount: 2 }]),
  IncidentController.createReport
);
router.get('/cluster-recommendation', authenticateJWT, IncidentController.getClusterRecommendation);
router.get('/', authenticateJWT, IncidentController.getAllReports);
router.get('/:id', authenticateJWT, IncidentController.getReportById);
router.patch('/:id/status', authenticateJWT, authorizeRoles('Admin', 'Police'), IncidentController.updateReportStatus);

module.exports = router;
