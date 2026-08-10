const ServiceCabin = require('../models/ServiceCabin');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

class CabinController {
  static createCabin = asyncHandler(async (req, res) => {
    const { name, location_name, latitude, longitude, contact_phone, services_offered } = req.body;
    if (!name || !latitude || !longitude || !contact_phone) {
      throw new ApiError(400, 'Name, latitude, longitude, and contact phone are required.');
    }
    const cabin = await ServiceCabin.create({
      name,
      location_name: location_name || name,
      latitude,
      longitude,
      contact_phone,
      services_offered,
      manager_user_id: req.user.id
    });
    return res.status(201).json(new ApiResponse(201, cabin, 'Service cabin registered successfully.'));
  });

  static getAllCabins = asyncHandler(async (req, res) => {
    const cabins = await ServiceCabin.findAll({ status: req.query.status });
    return res.status(200).json(new ApiResponse(200, cabins, 'Service cabins fetched successfully.'));
  });

  static getNearbyCabins = asyncHandler(async (req, res) => {
    const { latitude, longitude, radius } = req.query;
    if (!latitude || !longitude) {
      throw new ApiError(400, 'Latitude and longitude parameters are required.');
    }
    const cabins = await ServiceCabin.findNearby(parseFloat(latitude), parseFloat(longitude), parseFloat(radius || 15));
    return res.status(200).json(new ApiResponse(200, cabins, 'Nearby service cabins fetched successfully.'));
  });
}

module.exports = CabinController;
