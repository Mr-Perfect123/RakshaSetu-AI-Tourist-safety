const express = require('express');
const router = express.Router();
const VehicleController = require('../controllers/vehicleController');
const { optionalAuth } = require('../middleware/auth');

router.get('/types', VehicleController.getVehicleTypes);
router.get('/available', VehicleController.getAvailableVehicles);
router.post('/estimate-fare', VehicleController.estimateFare);
router.post('/book', optionalAuth, VehicleController.createBooking);
router.get('/my-bookings', optionalAuth, VehicleController.getUserBookings);

module.exports = router;
