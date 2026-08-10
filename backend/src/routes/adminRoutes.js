const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth');

router.use(authenticateJWT, authorizeRoles('Admin', 'Police', 'Hospital'));

router.get('/stats', AdminController.getDashboardStats);
router.get('/users', AdminController.getAllUsers);
router.get('/tourists/:id', AdminController.getTouristDetails);
router.post('/tourists/seed', AdminController.seedDemoTourists);
router.get('/crime-reports', AdminController.getCrimeReports);
router.get('/safe-locations', AdminController.getSafeLocations);
router.post('/safe-locations', AdminController.createSafeLocation);
router.get('/analytics', AdminController.getAnalytics);
router.get('/audit-logs', AdminController.getAuditLogs);
router.post('/broadcast', AdminController.broadcastNotification);
router.get('/vehicle-bookings', AdminController.getVehicleBookings);
router.get('/food-orders', AdminController.getFoodOrders);

module.exports = router;
