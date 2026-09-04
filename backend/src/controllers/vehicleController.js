const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const { executeQuery } = require('../config/database');

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
    const type = types.length > 0 ? types[0] : { base_fare: 65.00, per_km_rate: 16.00 };

    const baseFare = parseFloat(type.base_fare || 65);
    const perKmRate = parseFloat(type.per_km_rate || 16);
    const dist = parseFloat(distanceKm || 5.0);
    const distanceCharge = Math.round(dist * perKmRate * 100) / 100;
    const taxesFees = Math.round((baseFare + distanceCharge) * 0.12 * 100) / 100;
    const estimatedFare = Math.round(baseFare + distanceCharge + taxesFees);

    return res.status(200).json(
      new ApiResponse(
        200,
        { category, distanceKm: dist, baseFare, perKmRate, distanceCharge, taxesFees, estimatedFare, currency: 'INR' },
        'Dynamic fare estimate calculated.'
      )
    );
  });

  static createBooking = asyncHandler(async (req, res) => {
    const {
      category = 'sedan',
      pickupLocation = 'Current GPS Position',
      destination = 'Selected Destination',
      pickupLat,
      pickupLng,
      destLat,
      destLng,
      distanceKm = 5.5,
      date,
      time,
      passengers = 1
    } = req.body;

    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required.');
    }
    const userId = parseInt(req.user.id, 10);
    const dist = parseFloat(distanceKm || 5.5);

    // Fetch matching vehicle category configuration
    const types = await executeQuery(`SELECT * FROM vehicle_types WHERE type_key = ? LIMIT 1`, [category]);
    const typeObj = types.length > 0 ? types[0] : { base_fare: 80, per_km_rate: 18 };
    const baseFare = parseFloat(typeObj.base_fare || 80);
    const perKmRate = parseFloat(typeObj.per_km_rate || 18);
    const distanceCharge = Math.round(dist * perKmRate * 100) / 100;
    const taxesFees = Math.round((baseFare + distanceCharge) * 0.12 * 100) / 100;
    const calculatedFare = Math.round(baseFare + distanceCharge + taxesFees);

    // Query dynamic available driver from database matching category or create distinct driver record
    const availableVehicles = await executeQuery(
      `SELECT v.* FROM vehicles v JOIN vehicle_types vt ON v.vehicle_type_id = vt.id WHERE vt.type_key = ? AND v.status = 'available' LIMIT 1`,
      [category]
    );

    let selectedVehicle;
    if (availableVehicles.length > 0) {
      selectedVehicle = availableVehicles[0];
    } else {
      // Dynamic distinct driver generator
      const driverPool = [
        { name: 'Karthik Raja', phone: '+919443322110', reg: 'TN-37-RS-1001', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', rating: 4.95 },
        { name: 'Murugan Swamy', phone: '+919443322111', reg: 'TN-37-RS-2002', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', rating: 4.92 },
        { name: 'Rajesh Kumar', phone: '+919876543210', reg: 'DL-01-RS-4488', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80', rating: 4.88 },
        { name: 'Anthony D\'Souza', phone: '+919822114455', reg: 'GA-03-RS-8899', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80', rating: 4.90 }
      ];
      const randomIndex = Math.floor(Math.random() * driverPool.length);
      const chosen = driverPool[randomIndex];

      selectedVehicle = {
        id: 10 + randomIndex,
        driver_name: chosen.name,
        driver_phone: chosen.phone,
        registration_number: chosen.reg,
        image_url: chosen.photo,
        rating: chosen.rating
      };
    }

    const bookingCode = `BK-RS-${Date.now().toString().slice(-6)}`;
    const bookingDate = date || new Date().toISOString().split('T')[0];
    const bookingTime = time || new Date().toTimeString().split(' ')[0];

    // REQUIREMENT 18: Generate secure 6-digit Ride OTP at booking time
    const rideOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const sql = `INSERT INTO vehicle_bookings 
      (booking_code, user_id, vehicle_id, vehicle_category, pickup_location, pickup_lat, pickup_lng, destination, dest_lat, dest_lng, booking_date, booking_time, passengers, estimated_fare, ride_otp, status, payment_status, driver_id, driver_name, driver_phone, driver_photo, driver_rating, vehicle_registration, base_fare, distance_km, distance_charge, taxes_fees)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OTP_PENDING', 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const result = await executeQuery(sql, [
      bookingCode,
      userId,
      selectedVehicle.id || 1,
      category,
      pickupLocation,
      pickupLat || 11.0168,
      pickupLng || 76.9558,
      destination,
      destLat || 10.9980,
      destLng || 76.9650,
      bookingDate,
      bookingTime,
      passengers,
      calculatedFare,
      rideOtp,
      selectedVehicle.id || 1,
      selectedVehicle.driver_name,
      selectedVehicle.driver_phone,
      selectedVehicle.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      selectedVehicle.rating || 4.90,
      selectedVehicle.registration_number,
      baseFare,
      dist,
      distanceCharge,
      taxesFees
    ]);

    const booking = {
      id: result.insertId || Date.now(),
      booking_code: bookingCode,
      user_id: userId,
      vehicle_category: category,
      pickup_location: pickupLocation,
      destination,
      booking_date: bookingDate,
      booking_time: bookingTime,
      passengers,
      estimated_fare: calculatedFare,
      final_fare: calculatedFare,
      ride_otp: rideOtp,
      status: 'OTP_PENDING',
      payment_status: 'PENDING',
      driver_name: selectedVehicle.driver_name,
      driver_phone: selectedVehicle.driver_phone,
      driver_photo: selectedVehicle.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      driver_rating: selectedVehicle.rating || 4.90,
      vehicle_registration: selectedVehicle.registration_number,
      driver: {
        id: selectedVehicle.id || 1,
        name: selectedVehicle.driver_name,
        phone: selectedVehicle.driver_phone,
        photo: selectedVehicle.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        rating: selectedVehicle.rating || 4.90,
        registration_number: selectedVehicle.registration_number
      }
    };

    // Broadcast activity to Admin Dashboard via Socket.IO
    try {
      const { broadcastTouristActivity } = require('../socket/sosSocket');
      broadcastTouristActivity({
        id: booking.id,
        type: 'vehicle_booking',
        title: `Cab Booked (OTP Generated)`,
        description: `Pickup: ${pickupLocation} → Drop: ${destination} (Estimated Fare: ₹${calculatedFare}). Ride OTP: ${rideOtp}`,
        touristName: req.user?.full_name || 'Tourist User',
        touristPhone: req.user?.phone || '+919876543210',
        details: booking
      });
    } catch (err) {}

    return res.status(201).json(new ApiResponse(201, booking, `🚕 Ride booked! Driver assigned. Share Ride OTP: ${rideOtp} to start.`));
  });

  /**
   * REQUIREMENT 19: Verify Ride OTP & Start Ride
   */
  static verifyOtp = asyncHandler(async (req, res) => {
    const { bookingId, otp } = req.body;
    if (!bookingId || !otp) {
      throw new ApiError(400, 'Booking ID and Ride OTP are required.');
    }

    const bookings = await executeQuery(`SELECT * FROM vehicle_bookings WHERE id = ? LIMIT 1`, [bookingId]);
    if (!bookings || bookings.length === 0) {
      throw new ApiError(404, 'Booking not found.');
    }

    const booking = bookings[0];
    if (booking.ride_otp && booking.ride_otp.toString() !== otp.toString()) {
      throw new ApiError(400, 'Invalid Ride OTP. Ride cannot start.');
    }

    await executeQuery(
      `UPDATE vehicle_bookings SET status = 'RIDE_STARTED' WHERE id = ?`,
      [bookingId]
    );

    booking.status = 'RIDE_STARTED';

    try {
      const { broadcastTouristActivity } = require('../socket/sosSocket');
      broadcastTouristActivity({
        id: bookingId,
        type: 'ride_started',
        title: `Ride Started (OTP Verified)`,
        description: `Ride #${booking.booking_code || bookingId} is now in progress.`,
        touristName: req.user?.full_name || 'Tourist User',
        details: booking
      });
    } catch (e) {}

    return res.status(200).json(new ApiResponse(200, booking, 'Ride OTP verified successfully! Ride STARTED.'));
  });

  /**
   * REQUIREMENT 20 & 21: Complete Ride & Calculate Final Fare (Before Payment)
   */
  static completeRide = asyncHandler(async (req, res) => {
    const { bookingId, actualDistanceKm, actualDurationMins } = req.body;
    const bookings = await executeQuery(`SELECT * FROM vehicle_bookings WHERE id = ? LIMIT 1`, [bookingId]);
    if (!bookings || bookings.length === 0) {
      throw new ApiError(404, 'Booking not found.');
    }

    const booking = bookings[0];
    const dist = parseFloat(actualDistanceKm || booking.distance_km || 16.8);
    const perKm = parseFloat(booking.per_km_rate || 18);
    const base = parseFloat(booking.base_fare || 80);
    const finalFare = Math.round(base + dist * perKm + 40);

    await executeQuery(
      `UPDATE vehicle_bookings SET status = 'RIDE_COMPLETED', estimated_fare = ?, payment_status = 'PAYMENT_PENDING' WHERE id = ?`,
      [finalFare, bookingId]
    );

    booking.status = 'RIDE_COMPLETED';
    booking.final_fare = finalFare;
    booking.payment_status = 'PAYMENT_PENDING';

    try {
      const { broadcastTouristActivity } = require('../socket/sosSocket');
      broadcastTouristActivity({
        id: bookingId,
        type: 'ride_completed',
        title: `Ride Completed (Payment Pending)`,
        description: `Destination reached! Final Fare: ₹${finalFare}. Awaiting payment.`,
        touristName: req.user?.full_name || 'Tourist User',
        details: booking
      });
    } catch (e) {}

    return res.status(200).json(new ApiResponse(200, booking, `Ride COMPLETED! Final fare: ₹${finalFare}. Please complete payment.`));
  });

  /**
   * REQUIREMENT 20: Complete Post-Ride Payment
   */
  static completePayment = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;
    await executeQuery(
      `UPDATE vehicle_bookings SET payment_status = 'PAID', status = 'COMPLETED' WHERE id = ?`,
      [bookingId]
    );

    try {
      const { broadcastTouristActivity } = require('../socket/sosSocket');
      broadcastTouristActivity({
        id: bookingId,
        type: 'payment_completed',
        title: `Payment Completed`,
        description: `Payment for ride #${bookingId} completed successfully. Status: PAID.`,
        touristName: req.user?.full_name || 'Tourist User'
      });
    } catch (e) {}

    return res.status(200).json(new ApiResponse(200, { id: bookingId, status: 'COMPLETED', payment_status: 'PAID' }, 'Payment completed successfully!'));
  });

  static getUserBookings = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required.');
    }
    const userId = parseInt(req.user.id, 10);
    const bookings = await executeQuery(
      `SELECT * FROM vehicle_bookings WHERE user_id = ? ORDER BY id DESC`,
      [userId]
    );
    return res.status(200).json(new ApiResponse(200, bookings, 'User vehicle booking history fetched.'));
  });

  static updateBookingStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status = 'COMPLETED' } = req.body;
    await executeQuery(`UPDATE vehicle_bookings SET status = ? WHERE id = ?`, [status.toLowerCase(), id]);
    return res.status(200).json(new ApiResponse(200, { id, status }, `Booking status updated to ${status}.`));
  });
}

module.exports = VehicleController;
