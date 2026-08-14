const express = require('express');
const router = express.Router();
const ActivityController = require('../controllers/activityController');

router.post('/log', ActivityController.logActivity);
router.get('/', ActivityController.getActivities);

module.exports = router;
