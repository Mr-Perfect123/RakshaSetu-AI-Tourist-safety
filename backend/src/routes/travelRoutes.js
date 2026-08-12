const express = require('express');
const router = express.Router();
const TravelController = require('../controllers/travelController');
const { optionalAuth, authenticateJWT } = require('../middleware/auth');

router.get('/search', TravelController.searchTravel);
router.post('/book', optionalAuth, TravelController.createTravelBooking);
router.get('/bookings', optionalAuth, TravelController.getTouristTravelBookings);
router.get('/admin/bookings', authenticateJWT, TravelController.getAllTravelBookingsAdmin);

module.exports = router;
