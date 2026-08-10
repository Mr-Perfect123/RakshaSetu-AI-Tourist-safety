const express = require('express');
const router = express.Router();
const CabinController = require('../controllers/cabinController');
const { authenticateJWT, authorizeRoles, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, CabinController.getAllCabins);
router.get('/nearby', optionalAuth, CabinController.getNearbyCabins);
router.post('/', authenticateJWT, authorizeRoles('Admin', 'Police'), CabinController.createCabin);

module.exports = router;
