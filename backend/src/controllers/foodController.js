const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const { executeQuery } = require('../config/database');

class FoodController {
  static getRestaurants = asyncHandler(async (req, res) => {
    const { search, cuisine, lat, lng } = req.query;
    let sql = `SELECT * FROM restaurants WHERE is_active = TRUE`;
    const params = [];

    if (search) {
      sql += ` AND (name LIKE ? OR cuisine_type LIKE ? OR address LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (cuisine) {
      sql += ` AND cuisine_type LIKE ?`;
      params.push(`%${cuisine}%`);
    }

    const restaurants = await executeQuery(sql, params);

    // Dynamic Google Maps-style Sorting & Calculations
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    let processed = restaurants.map(r => {
      let distanceKm = null;
      if (userLat && userLng && r.latitude && r.longitude) {
        // Haversine formula calculation
        const R = 6371; // Earth radius in km
        const dLat = ((parseFloat(r.latitude) - userLat) * Math.PI) / 180;
        const dLon = ((parseFloat(r.longitude) - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLat * Math.PI) / 180) * Math.cos((parseFloat(r.latitude) * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm = parseFloat((R * c).toFixed(1));
      }
      return {
        ...r,
        distanceKm,
        formattedDistance: distanceKm !== null ? `${distanceKm} km away` : null
      };
    });

    // Google Maps-style relevance sorting:
    processed.sort((a, b) => {
      // 1. If keyword search is used, check for direct name prefix matches first
      if (search) {
        const cleanSearch = search.trim().toLowerCase();
        const aPrefix = a.name.toLowerCase().startsWith(cleanSearch);
        const bPrefix = b.name.toLowerCase().startsWith(cleanSearch);
        if (aPrefix && !bPrefix) return -1;
        if (!aPrefix && bPrefix) return 1;
      }

      // 2. Proximity sorting (nearest first)
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }

      // 3. Fallback to rating sorting (highest first)
      return b.rating - a.rating;
    });

    return res.status(200).json(new ApiResponse(200, processed, 'Verified hygienic restaurants retrieved.'));
  });

  static getRestaurantDetails = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const restaurants = await executeQuery(`SELECT * FROM restaurants WHERE id = ? LIMIT 1`, [id]);
    if (!restaurants || restaurants.length === 0) {
      throw new ApiError(404, 'Restaurant not found.');
    }

    const items = await executeQuery(`SELECT * FROM food_items WHERE restaurant_id = ? AND is_available = TRUE`, [id]);
    return res.status(200).json(
      new ApiResponse(200, { ...restaurants[0], menu: items }, 'Restaurant menu & details retrieved.')
    );
  });

  static placeOrder = asyncHandler(async (req, res) => {
    const { restaurantId, items, deliveryAddress, subtotal, deliveryFee = 30, totalAmount } = req.body;
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required.');
    }
    const userId = parseInt(req.user.id, 10);

    if (!restaurantId || !items || items.length === 0) {
      throw new ApiError(400, 'Restaurant and cart items are required.');
    }

    const orderCode = `FD-RS-${Date.now().toString().slice(-6)}`;
    const sql = `INSERT INTO food_orders (order_code, user_id, restaurant_id, items_json, subtotal, delivery_fee, total_amount, delivery_address, status, payment_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'placed', 'paid')`;

    const result = await executeQuery(sql, [
      orderCode,
      userId,
      restaurantId,
      JSON.stringify(items),
      subtotal || totalAmount - deliveryFee,
      deliveryFee,
      totalAmount,
      deliveryAddress || 'Hotel Reception Desk'
    ]);

    const order = {
      id: result.insertId || Date.now(),
      order_code: orderCode,
      user_id: userId,
      restaurant_id: restaurantId,
      items,
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      delivery_address: deliveryAddress,
      status: 'placed',
      estimated_delivery_min: 30
    };

    // Broadcast food activity to Admin Dashboard
    try {
      const { broadcastTouristActivity } = require('../socket/sosSocket');
      broadcastTouristActivity({
        id: order.id,
        type: 'food_booking',
        title: `Restaurant / Food Order Placed`,
        description: `Order #${orderCode} - Amount: ₹${totalAmount} to ${deliveryAddress || 'Hotel Address'}`,
        touristName: req.user?.full_name || 'Tourist User',
        touristPhone: req.user?.phone || '+919876543210',
        details: order
      });
    } catch (err) {}

    return res.status(201).json(new ApiResponse(201, order, 'Food order placed successfully with hotel delivery.'));
  });

  static getUserOrders = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required.');
    }
    const userId = parseInt(req.user.id, 10);
    const orders = await executeQuery(
      `SELECT fo.*, r.name as restaurant_name 
       FROM food_orders fo 
       JOIN restaurants r ON fo.restaurant_id = r.id 
       WHERE fo.user_id = ? 
       ORDER BY fo.id DESC`,
      [userId]
    );

    const parsedOrders = orders.map(o => {
      try {
        o.items = typeof o.items_json === 'string' ? JSON.parse(o.items_json) : o.items_json;
      } catch (e) {
        o.items = [];
      }
      return o;
    });

    return res.status(200).json(new ApiResponse(200, parsedOrders, 'User food orders history fetched.'));
  });
}

module.exports = FoodController;
