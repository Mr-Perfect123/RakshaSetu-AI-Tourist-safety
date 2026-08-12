const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { authenticateJWT } = require('../middleware/auth');

router.post('/process', authenticateJWT, PaymentController.createPayment);
router.post('/', authenticateJWT, PaymentController.createPayment);
router.get('/my-history', authenticateJWT, PaymentController.getUserPayments);
router.post('/refund', authenticateJWT, PaymentController.requestRefund);

module.exports = router;
