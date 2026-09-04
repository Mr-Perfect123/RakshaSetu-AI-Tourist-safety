const GeminiService = require('../services/geminiService');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { executeQuery } = require('../config/database');

class AiController {
  static chatAssistant = asyncHandler(async (req, res) => {
    const { message, context = {}, isSosActive = false, language = 'English' } = req.body;
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required.');
    }
    const userId = parseInt(req.user.id, 10);
    const sessionId = req.body.sessionId || `session_${userId}`;

    // 1. Save user query to chat_history table
    await executeQuery(
      `INSERT INTO chat_history (user_id, session_id, sender, message, language) VALUES (?, ?, 'user', ?, ?)`,
      [userId, sessionId, message, language]
    );

    // 2. Generate AI response (Emergency Mode or Normal Mode)
    const contextInfo = { ...context, lang: language, isSosActive };
    let aiResponse = await GeminiService.chatAssistant(message, contextInfo);

    // 3. Save AI response to chat_history table
    await executeQuery(
      `INSERT INTO chat_history (user_id, session_id, sender, message, language, intent_classified) VALUES (?, ?, 'ai', ?, ?, ?)`,
      [userId, sessionId, aiResponse.response, language, aiResponse.intent || 'GENERAL_TOURIST_GUIDANCE']
    );

    return res.status(200).json(new ApiResponse(200, aiResponse, 'AI assistant response generated.'));
  });

  static predictCrimeDanger = asyncHandler(async (req, res) => {
    const { latitude, longitude, timeOfDay } = req.body;
    const prediction = await GeminiService.predictDangerRisk(latitude, longitude, timeOfDay);
    return res.status(200).json(new ApiResponse(200, prediction, 'AI crime & danger prediction generated.'));
  });

  static suggestSafeRoute = asyncHandler(async (req, res) => {
    const { origin, destination } = req.body;
    const route = await GeminiService.suggestSafeRoute(origin, destination);
    return res.status(200).json(new ApiResponse(200, route, 'Safe route suggestions calculated.'));
  });

  static translateEmergency = asyncHandler(async (req, res) => {
    const { message, targetLanguage } = req.body;
    const translation = await GeminiService.translateEmergencyMessage(message, targetLanguage);
    return res.status(200).json(new ApiResponse(200, translation, 'Emergency text translated successfully.'));
  });

  static getChatHistory = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required.');
    }
    const userId = parseInt(req.user.id, 10);
    const history = await executeQuery(
      `SELECT * FROM chat_history WHERE user_id = ? ORDER BY id ASC LIMIT 50`,
      [userId]
    );
    return res.status(200).json(new ApiResponse(200, history, 'Chat history retrieved.'));
  });
}

module.exports = AiController;
