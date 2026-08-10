const SafeLocation = require('../models/SafeLocation');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

class LocationController {
  static getNearbySafeLocations = asyncHandler(async (req, res) => {
    const { latitude, longitude, radiusKm = 10, type } = req.query;
    const lat = parseFloat(latitude) || 28.6139;
    const lng = parseFloat(longitude) || 77.2090;

    const locations = await SafeLocation.findNearby(lat, lng, parseFloat(radiusKm), type);
    return res.status(200).json(new ApiResponse(200, locations, 'Nearby safe locations retrieved.'));
  });

  static updateLiveLocation = asyncHandler(async (req, res) => {
    const { latitude, longitude } = req.body;
    const updated = await User.updateLocation(req.user.id, latitude, longitude);
    return res.status(200).json(new ApiResponse(200, updated, 'Live location updated successfully.'));
  });
}

module.exports = LocationController;
