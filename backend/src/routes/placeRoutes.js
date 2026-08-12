const express = require('express');
const router = express.Router();
const PlaceController = require('../controllers/placeController');

router.get('/search', PlaceController.searchPlaces);
router.get('/nearby', PlaceController.getNearbyPlaces);
router.get('/weather', PlaceController.getWeather);
router.get('/details/:id', PlaceController.getPlaceDetails);
router.get('/:id/safety-analysis', PlaceController.getPlaceSafetyAnalysis);
router.get('/:id', PlaceController.getPlaceDetails);

module.exports = router;
