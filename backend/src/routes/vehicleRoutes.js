const express = require('express');
const router = express.Router();
const VehicleController = require('../controllers/vehicleController');
const { optionalAuth } = require('../middleware/auth');

router.get('/types', VehicleController.getVehicleTypes);
router.get('/available', VehicleController.getAvailableVehicles);
router.post('/estimate-fare', VehicleController.estimateFare);
router.post('/book', optionalAuth, VehicleController.createBooking);
router.post('/verify-otp', optionalAuth, VehicleController.verifyOtp);
router.post('/complete-ride', optionalAuth, VehicleController.completeRide);
router.post('/complete-payment', optionalAuth, VehicleController.completePayment);
router.get('/my-bookings', optionalAuth, VehicleController.getUserBookings);

module.exports = router;
