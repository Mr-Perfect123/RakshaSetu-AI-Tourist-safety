const Payment = require('../models/Payment');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

class PaymentController {
  static createPayment = asyncHandler(async (req, res) => {
    const { amount, purpose, payment_gateway, payment_method } = req.body;
    if (!amount || amount <= 0) {
      throw new ApiError(400, 'Valid payment amount is required.');
    }
    const payment = await Payment.create({
      user_id: req.user.id,
      amount,
      purpose,
      payment_gateway,
      payment_method
    });
    return res.status(201).json(new ApiResponse(201, payment, 'Payment processed successfully. Invoice generated.'));
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
