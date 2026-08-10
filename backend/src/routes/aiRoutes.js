const express = require('express');
const router = express.Router();
const AiController = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/auth');

router.post('/chat', optionalAuth, AiController.chatAssistant);
router.get('/history', optionalAuth, AiController.getChatHistory);
router.post('/predict-risk', optionalAuth, AiController.predictCrimeDanger);
router.post('/safe-route', optionalAuth, AiController.suggestSafeRoute);
router.post('/translate', optionalAuth, AiController.translateEmergency);

module.exports = router;
