const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const WeatherService = require('../services/weatherService');

class WeatherController {
  /**
   * GET /api/v1/weather/current
   * Query params: lat, lng, name, country, state, representative
   */
  static getCurrentWeather = asyncHandler(async (req, res) => {
    const { lat, lng, name, country, state, representative } = req.query;

    if (!lat || !lng) {
      throw new ApiError(400, 'Latitude and Longitude query parameters are required.');
    }

    const weather = await WeatherService.getWeatherByCoordinates({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      locationName: name || '',
      country: country || '',
      state: state || '',
      isRepresentative: representative === 'true' || representative === true
    });

    return res.status(200).json(
      new ApiResponse(200, weather, 'Real-time weather retrieved successfully.')
    );
  });

  /**
   * GET /api/v1/weather/search
   * Query params: query (e.g. Paris, Tokyo, Munnar, Kerala, France, California)
   */
  static searchLocations = asyncHandler(async (req, res) => {
    const query = req.query.query || req.query.q || req.query.input || '';

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(200).json(
        new ApiResponse(200, [], 'Please provide at least 2 characters for worldwide location search.')
      );
    }

    const locations = await WeatherService.searchLocations(query);

    return res.status(200).json(
      new ApiResponse(200, locations, `Found ${locations.length} matching locations worldwide.`)
    );
  });

  /**
   * GET /api/v1/weather/overview
   * Summary overview of weather & warnings for Admin Dashboard
   */
  static getWeatherOverview = asyncHandler(async (req, res) => {
    const overview = await WeatherService.getWeatherOverview();
    return res.status(200).json(
      new ApiResponse(200, overview, 'Weather overview retrieved.')
    );
  });
}

module.exports = WeatherController;
