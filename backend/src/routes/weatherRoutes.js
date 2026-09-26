const express = require('express');
const router = express.Router();
const WeatherController = require('../controllers/weatherController');

// Public & Tourist Endpoints
router.get('/current', WeatherController.getCurrentWeather);
router.get('/location', WeatherController.getCurrentWeather);
router.get('/search', WeatherController.searchLocations);
router.get('/overview', WeatherController.getWeatherOverview);

module.exports = router;
