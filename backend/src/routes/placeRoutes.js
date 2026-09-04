const express = require('express');
const router = express.Router();
const PlaceController = require('../controllers/placeController');

router.get('/category-counts', PlaceController.getCategoryCounts);
router.get('/states', PlaceController.getStates);
router.get('/by-state', PlaceController.getByState);
router.get('/search', PlaceController.searchPlaces);
router.get('/autocomplete', PlaceController.autocompletePlaces);
router.get('/details', PlaceController.getGooglePlaceDetails);
router.get('/nearby', PlaceController.getNearbyPlaces);
router.get('/weather', PlaceController.getWeather);
router.get('/details/:id', PlaceController.getPlaceDetails);
router.get('/:id/safety-analysis', PlaceController.getPlaceSafetyAnalysis);
router.get('/:id', PlaceController.getPlaceDetails);


module.exports = router;
