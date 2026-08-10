const express = require('express');
const router = express.Router();
const FoodController = require('../controllers/foodController');
const { optionalAuth } = require('../middleware/auth');

router.get('/restaurants', FoodController.getRestaurants);
router.get('/restaurants/:id', FoodController.getRestaurantDetails);
router.post('/orders', optionalAuth, FoodController.placeOrder);
router.get('/my-orders', optionalAuth, FoodController.getUserOrders);

module.exports = router;
