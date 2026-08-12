const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/locationController');
const { authenticateJWT } = require('../middleware/auth');

router.get('/safe-locations', authenticateJWT, LocationController.getNearbySafeLocations);
router.post('/permission', authenticateJWT, LocationController.setLocationPermission);
router.post('/update', authenticateJWT, LocationController.updateLiveLocation);
router.post('/update-live', authenticateJWT, LocationController.updateLiveLocation);
router.post('/stop', authenticateJWT, LocationController.stopLocationSharing);
router.get('/status', authenticateJWT, LocationController.getLocationStatus);
router.post('/respond-request', authenticateJWT, LocationController.respondLocationRequest);

module.exports = router;
