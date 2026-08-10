const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const { executeQuery, inMemoryStore } = require('../config/database');

class VehicleController {
  static getVehicleTypes = asyncHandler(async (req, res) => {
    const types = await executeQuery('SELECT * FROM vehicle_types WHERE is_active = TRUE ORDER BY id ASC');
    return res.status(200).json(new ApiResponse(200, types, 'Vehicle categories retrieved.'));
  });

  static getAvailableVehicles = asyncHandler(async (req, res) => {
    const { category } = req.query;
    let sql = `SELECT v.*, vt.name as category_name, vt.capacity, vt.base_fare, vt.per_km_rate 
               FROM vehicles v 
               JOIN vehicle_types vt ON v.vehicle_type_id = vt.id 
               WHERE v.status = 'available'`;
    const params = [];
    if (category) {
      sql += ` AND vt.type_key = ?`;
      params.push(category);
    }

    const vehicles = await executeQuery(sql, params);
    return res.status(200).json(new ApiResponse(200, vehicles, 'Available verified transport units fetched.'));
  });

  static estimateFare = asyncHandler(async (req, res) => {
    const { category = 'sedan', distanceKm = 5.0 } = req.body;
    const types = await executeQuery(`SELECT * FROM vehicle_types WHERE type_key = ? LIMIT 1`, [category]);
    const type = types.length > 0 ? types[0] : { base_fare: 100.00, per_km_rate: 18.00 };

    const baseFare = parseFloat(type.base_fare || 100);
    const perKmRate = parseFloat(type.per_km_rate || 18);
    const dist = parseFloat(distanceKm);

    const estimatedFare = Math.round(baseFare + dist * perKmRate);
    return res.status(200).json(
      new ApiResponse(200, { category, distanceKm: dist, baseFare, perKmRate, estimatedFare, currency: 'INR' }, 'Fare estimate calculated.')
    );
  });

  static createBooking = asyncHandler(async (req, res) => {
    const { category, pickupLocation, destination, date, time, passengers = 1, estimatedFare = 250 } = req.body;
    const userId = req.user ? req.user.id : 4; // Default fallback user for guest demo

    const bookingCode = `BK-RS-${Date.now().toString().slice(-6)}`;
    const sql = `INSERT INTO vehicle_bookings (booking_code, user_id, vehicle_category, pickup_location, destination, booking_date, booking_time, passengers, estimated_fare, status, payment_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'test_mode')`;

    const result = await executeQuery(sql, [
      bookingCode,
      userId,
      category || 'Sedan',
      pickupLocation || 'Current Tourist GPS Location',
      destination || 'Selected Destination',
      date || new Date().toISOString().split('T')[0],
      time || '12:00:00',
      passengers,
      estimatedFare
    ]);

    const booking = {
      id: result.insertId || Date.now(),
      booking_code: bookingCode,
      user_id: userId,
      vehicle_category: category,
      pickup_location: pickupLocation,
      destination,
      booking_date: date,
      booking_time: time,
      passengers,
      estimated_fare: estimatedFare,
      status: 'confirmed',
      payment_status: 'test_mode',
      driver_name: 'Rajesh Kumar (RakshaSetu Verified Driver)',
      driver_phone: '+919876543210',
      vehicle_registration: 'DL-01-RS-9988'
    };

    return res.status(201).json(new ApiResponse(201, booking, 'Vehicle booking confirmed with verified driver.'));
  });

  static getUserBookings = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : 4;
    const bookings = await executeQuery(
      `SELECT * FROM vehicle_bookings WHERE user_id = ? ORDER BY id DESC`,
      [userId]
    );
    return res.status(200).json(new ApiResponse(200, bookings, 'User vehicle booking history fetched.'));
  });
}

module.exports = VehicleController;
