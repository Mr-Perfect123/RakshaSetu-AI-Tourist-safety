const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const { executeQuery } = require('../config/database');

class FoodController {
  static getRestaurants = asyncHandler(async (req, res) => {
    const { search, cuisine } = req.query;
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

    sql += ` ORDER BY rating DESC`;
    const restaurants = await executeQuery(sql, params);
    return res.status(200).json(new ApiResponse(200, restaurants, 'Verified hygienic restaurants retrieved.'));
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
    const userId = req.user ? req.user.id : 4;

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

    return res.status(201).json(new ApiResponse(201, order, 'Food order placed successfully with hotel delivery.'));
  });

  static getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : 4;
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
