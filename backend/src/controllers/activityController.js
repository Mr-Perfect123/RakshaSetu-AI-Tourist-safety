const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const { executeQuery } = require('../config/database');
const { broadcastTouristActivity } = require('../socket/sosSocket');

class ActivityController {
  /**
   * Log Tourist Action (e.g. Search Place, Search Restaurant, View Safety Map, Book Vehicle, SOS, Incident Report)
   */
  static logActivity = asyncHandler(async (req, res) => {
    const { activityType, description, latitude = 11.0168, longitude = 76.9558, address = 'Coimbatore, India', metadata = {} } = req.body;
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required.');
    }
    const userId = parseInt(req.user.id, 10);
    const touristName = req.user.full_name || 'Unknown Tourist';
    const touristPhone = req.user.phone || '';

    const sql = `INSERT INTO tourist_activities (user_id, tourist_name, activity_type, description, latitude, longitude, address, metadata_json, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const result = await executeQuery(sql, [
      userId,
      touristName,
      activityType || 'GENERAL_ACTIVITY',
      description || 'Tourist performed action',
      latitude,
      longitude,
      address,
      JSON.stringify(metadata)
    ]);

    const activityObj = {
      id: result?.insertId || Date.now(),
      user_id: userId,
      touristName,
      touristPhone,
      type: activityType || 'general',
      activity_type: activityType || 'GENERAL_ACTIVITY',
      title: description || 'Tourist Action',
      description: description || '',
      latitude,
      longitude,
      address,
      details: metadata,
      timestamp: new Date().toISOString()
    };

    // Real-time WebSocket Broadcast to Admin Dashboard & Police HQ
    try {
      broadcastTouristActivity(activityObj);
    } catch (err) {
      console.warn('Socket activity broadcast warning');
    }

    return res.status(201).json(new ApiResponse(201, activityObj, 'Tourist activity logged and broadcasted to admin.'));
  });

  /**
   * Fetch Recent Tourist Activities for Admin Dashboard
   */
  static getActivities = asyncHandler(async (req, res) => {
    const { limit = 30 } = req.query;
    const rows = await executeQuery(
      `SELECT * FROM tourist_activities ORDER BY id DESC LIMIT ?`,
      [parseInt(limit, 10) || 30]
    );

    const activities = (rows || []).map(r => {
      let meta = {};
      try {
        meta = typeof r.metadata_json === 'string' ? JSON.parse(r.metadata_json) : r.metadata_json;
      } catch (e) {}
      return {
        ...r,
        metadata: meta
      };
    });

    return res.status(200).json(new ApiResponse(200, activities, 'Tourist activity log retrieved.'));
  });
}

module.exports = ActivityController;
