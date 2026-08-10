const express = require('express');
const router = express.Router();
const LocationController = require('../controllers/locationController');
const { authenticateJWT } = require('../middleware/auth');

router.get('/safe-locations', authenticateJWT, LocationController.getNearbySafeLocations);
router.post('/update-live', authenticateJWT, LocationController.updateLiveLocation);

module.exports = router;
