const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const { executeQuery } = require('../config/database');

// Available travel schedule catalog generators for Flights, Trains, Buses, Cabs, Rentals
const generateTravelOptions = (travelType = 'flight', from = 'Coimbatore', to = 'Chennai', date = '2026-08-15') => {
  const fromClean = from.trim() || 'Coimbatore';
  const toClean = to.trim() || 'Chennai';

  if (travelType === 'flight') {
    return [
      {
        id: 'fl-101',
        travel_type: 'flight',
        operator_name: 'IndiGo Express',
        vehicle_number: '6E-402',
        from_location: fromClean,
        to_location: toClean,
        departure_time: '07:15 AM',
        arrival_time: '08:30 AM',
        duration: '1h 15m',
        available_seats: 12,
        fare: 3450.00,
        status: 'Available'
      },
      {
        id: 'fl-102',
        travel_type: 'flight',
        operator_name: 'Air India Safety Jet',
        vehicle_number: 'AI-580',
        from_location: fromClean,
        to_location: toClean,
        departure_time: '02:40 PM',
        arrival_time: '03:55 PM',
        duration: '1h 15m',
        available_seats: 8,
        fare: 4120.00,
        status: 'Available'
      }
    ];
  }

  if (travelType === 'train') {
    return [
      {
        id: 'tr-201',
        travel_type: 'train',
        operator_name: 'Vande Bharat Express',
        vehicle_number: '20644',
        from_location: fromClean,
        to_location: toClean,
        departure_time: '06:00 AM',
        arrival_time: '11:50 AM',
        duration: '5h 50m',
        available_seats: 42,
        fare: 1365.00,
        status: 'Available'
      },
      {
        id: 'tr-202',
        travel_type: 'train',
        operator_name: 'Cheran Superfast Express',
        vehicle_number: '12674',
        from_location: fromClean,
        to_location: toClean,
        departure_time: '10:50 PM',
        arrival_time: '06:15 AM',
        duration: '7h 25m',
        available_seats: 18,
        fare: 890.00,
        status: 'Available'
      }
    ];
  }

  if (travelType === 'bus') {
    return [
      {
        id: 'bs-301',
        travel_type: 'bus',
        operator_name: 'SETC Ultra Deluxe AC Sleeper',
        vehicle_number: 'TN-01-AN-9922',
        from_location: fromClean,
        to_location: toClean,
        departure_time: '09:30 PM',
        arrival_time: '05:30 AM',
        duration: '8h 00m',
        available_seats: 14,
        fare: 750.00,
        status: 'Available'
      },
      {
        id: 'bs-302',
        travel_type: 'bus',
        operator_name: 'KSRTC Swift Multi-Axle Volvo',
        vehicle_number: 'KL-15-X-7001',
        from_location: fromClean,
        to_location: toClean,
        departure_time: '10:15 PM',
        arrival_time: '06:00 AM',
        duration: '7h 45m',
        available_seats: 22,
        fare: 920.00,
        status: 'Available'
      }
    ];
  }

  if (travelType === 'rental') {
    return [
      {
        id: 'rn-401',
        travel_type: 'rental',
        operator_name: 'RakshaSetu Self-Drive SUV',
        vehicle_number: 'TN-37-RS-9090',
        from_location: fromClean,
        to_location: toClean,
        departure_time: '09:00 AM (Pickup)',
        arrival_time: 'Flexi Return',
        duration: '24 Hours Rental',
        available_seats: 5,
        fare: 2800.00,
        status: 'Available'
      }
    ];
  }

  // Default Cabs
  return [
    {
      id: 'cb-501',
      travel_type: 'cab',
      operator_name: 'Verified Tourist Intercity Cab',
      vehicle_number: 'TN-37-RS-3344',
      from_location: fromClean,
      to_location: toClean,
      departure_time: 'Instant Pickup',
      arrival_time: 'On-Demand',
      duration: 'Direct Route',
      available_seats: 4,
      fare: 1850.00,
      status: 'Available'
    }
  ];
};

class TravelController {
  /**
   * Search available travel options (Flights, Trains, Buses, Cabs, Rentals)
   */
  static searchTravel = asyncHandler(async (req, res) => {
    const { travelType = 'flight', from = 'Coimbatore', to = 'Chennai', date, passengers = 1 } = req.query;
    const options = generateTravelOptions(travelType, from, to, date);
    return res.status(200).json(new ApiResponse(200, options, `${travelType.toUpperCase()} schedule options retrieved.`));
  });

  /**
   * Book Travel Ticket / Option
   */
  static createTravelBooking = asyncHandler(async (req, res) => {
    const {
      travelType = 'flight',
      fromLocation,
      toLocation,
      travelDate,
      travelTime = '08:00 AM',
      passengers = 1,
      operatorName,
      vehicleNumber,
      departureTime,
      arrivalTime,
      duration,
      fare = 1500.00
    } = req.body;

    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required.');
    }
    const userId = parseInt(req.user.id, 10);
    const bookingCode = `TRV-RS-${Date.now().toString().slice(-6)}`;
    const dateToUse = travelDate || new Date().toISOString().split('T')[0];

    // Convert any 12-hour time strings (e.g. "09:30 PM", "Instant Pickup") to MySQL-safe 24-hour TIME format (HH:MM:SS)
    const convertTo24Hour = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') return '08:00:00';
      const clean = timeStr.trim();
      // Already 24h format like "21:30" or "21:30:00"
      if (/^\d{2}:\d{2}(:\d{2})?$/.test(clean)) {
        return clean.length === 5 ? clean + ':00' : clean;
      }
      // Match 12h format like "09:30 PM", "6:00 AM"
      const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${minutes}:00`;
      }
      // Fallback for values like "Instant Pickup", "On-Demand", "Flexi Return"
      return '08:00:00';
    };

    const safeTravelTime = convertTo24Hour(travelTime);
    const safeDepartureTime = convertTo24Hour(departureTime || travelTime);
    const safeArrivalTime = convertTo24Hour(arrivalTime || travelTime);

    const sql = `INSERT INTO travel_bookings 
      (booking_code, user_id, travel_type, from_location, to_location, travel_date, travel_time, passengers, operator_name, vehicle_number, departure_time, arrival_time, duration, fare, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'paid')`;

    const result = await executeQuery(sql, [
      bookingCode,
      userId,
      travelType,
      fromLocation || 'Coimbatore',
      toLocation || 'Chennai',
      dateToUse,
      safeTravelTime,
      passengers,
      operatorName || 'RakshaSetu Verified Partner',
      vehicleNumber || 'RS-TRAV-101',
      safeDepartureTime,
      safeArrivalTime,
      duration || '5 Hours',
      fare
    ]);

    const booking = {
      id: result.insertId || Date.now(),
      booking_code: bookingCode,
      user_id: userId,
      travel_type: travelType,
      from_location: fromLocation,
      to_location: toLocation,
      travel_date: dateToUse,
      travel_time: travelTime,
      passengers,
      operator_name: operatorName,
      vehicle_number: vehicleNumber,
      departure_time: departureTime,
      arrival_time: arrivalTime,
      duration,
        fare,
      status: 'confirmed',
      payment_status: 'paid'
    };

    // Broadcast travel activity to Admin Dashboard
    try {
      const { broadcastTouristActivity } = require('../socket/sosSocket');
      broadcastTouristActivity({
        id: booking.id,
        type: 'travel_booking',
        title: `Travel Booking (${travelType.toUpperCase()})`,
        description: `${fromLocation || 'Coimbatore'} → ${toLocation || 'Chennai'} via ${operatorName || 'Verified Partner'} (Fare: ₹${fare})`,
        touristName: req.user?.full_name || 'Tourist User',
        touristPhone: req.user?.phone || '+919876543210',
        details: booking
      });
    } catch (err) {}

    return res.status(201).json(new ApiResponse(201, booking, '🎫 Travel ticket booked successfully. Ticket confirmed!'));
  });

  /**
   * Get Authenticated Tourist Travel Bookings History
   */
  static getTouristTravelBookings = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required.');
    }
    const userId = parseInt(req.user.id, 10);
    const bookings = await executeQuery(
      `SELECT * FROM travel_bookings WHERE user_id = ? ORDER BY id DESC`,
      [userId]
    );
    return res.status(200).json(new ApiResponse(200, bookings, 'User travel bookings history retrieved.'));
  });

  /**
   * Admin API: Get All Tourist Travel Bookings Audit
   */
  static getAllTravelBookingsAdmin = asyncHandler(async (req, res) => {
    const bookings = await executeQuery(
      `SELECT tb.*, u.full_name as tourist_name, u.email as tourist_email, u.phone as tourist_phone
       FROM travel_bookings tb
       LEFT JOIN users u ON tb.user_id = u.id
       ORDER BY tb.id DESC`
    );
    return res.status(200).json(new ApiResponse(200, bookings, 'Admin travel bookings audit fetched.'));
  });
}

module.exports = TravelController;
