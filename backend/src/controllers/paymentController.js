const Payment = require('../models/Payment');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { executeQuery } = require('../config/database');

class PaymentController {
  static createPayment = asyncHandler(async (req, res) => {
    const { amount, purpose, booking_code, booking_type, payment_gateway = 'Razorpay_UPI', payment_method = 'UPI' } = req.body;
    if (!amount || amount <= 0) {
      throw new ApiError(400, 'Valid payment amount is required.');
    }

    const userId = req.user ? req.user.id : 4;
    const txnId = `TXN-RS-${Date.now().toString().slice(-8)}`;

    const payment = await Payment.create({
      user_id: userId,
      amount,
      purpose: purpose || 'Tourist Service Booking',
      payment_gateway,
      payment_method,
      transaction_id: txnId,
      status: 'success'
    });

    // Update related booking payment status if booking_code provided
    if (booking_code) {
      try {
        if (booking_type === 'vehicle') {
          await executeQuery(`UPDATE vehicle_bookings SET payment_status = 'paid' WHERE booking_code = ? OR id = ?`, [booking_code, booking_code]);
        } else if (booking_type === 'travel') {
          await executeQuery(`UPDATE travel_bookings SET payment_status = 'paid' WHERE booking_code = ? OR id = ?`, [booking_code, booking_code]);
        } else if (booking_type === 'food') {
          await executeQuery(`UPDATE food_orders SET payment_status = 'paid' WHERE order_code = ? OR id = ?`, [booking_code, booking_code]);
        }
      } catch (err) {
        console.warn('Booking payment status update warning:', err.message);
      }
    }

    return res.status(201).json(
      new ApiResponse(201, { ...payment, transaction_id: txnId, booking_code, status: 'success' }, '🎉 Payment processed successfully! Digital invoice receipt generated.')
    );
  });

  static getUserPayments = asyncHandler(async (req, res) => {
    const payments = await Payment.findByUserId(req.user.id);
    return res.status(200).json(new ApiResponse(200, payments, 'Payment transactions retrieved successfully.'));
  });

  static requestRefund = asyncHandler(async (req, res) => {
    const { transaction_id, reason } = req.body;
    if (!transaction_id) {
      throw new ApiError(400, 'Transaction ID is required for refund processing.');
    }
    const refund = await Payment.processRefund(transaction_id, reason);
    return res.status(200).json(new ApiResponse(200, refund, 'Refund request processed successfully.'));
  });
}

module.exports = PaymentController;
