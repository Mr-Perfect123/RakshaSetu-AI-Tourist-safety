const express = require('express');
const router = express.Router();
const PlaceController = require('../controllers/placeController');

router.get('/search', PlaceController.searchPlaces);
router.get('/details/:id', PlaceController.getPlaceDetails);
router.get('/weather', PlaceController.getWeather);

module.exports = router;
