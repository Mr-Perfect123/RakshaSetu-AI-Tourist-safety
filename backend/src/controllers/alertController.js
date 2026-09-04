const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const { executeQuery } = require('../config/database');

class AlertController {
  static getActiveRedAlerts = asyncHandler(async (req, res) => {
    const alerts = await executeQuery(
      `SELECT * FROM red_alerts WHERE status = 'active' ORDER BY id DESC`
    );
    return res.status(200).json(new ApiResponse(200, alerts, 'Active red alerts retrieved.'));
  });

  static createRedAlert = asyncHandler(async (req, res) => {
    const { title, description, latitude, longitude, radiusMeters = 1000, severity = 'critical' } = req.body;
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication required.');
    }
    const userId = parseInt(req.user.id, 10);
    const alertCode = `RA-${Date.now().toString().slice(-6)}`;

    const sql = `INSERT INTO red_alerts (alert_code, title, description, latitude, longitude, radius_meters, severity, status, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`;

    const result = await executeQuery(sql, [
      alertCode,
      title,
      description,
      latitude,
      longitude,
      radiusMeters,
      severity,
      userId
    ]);

    const newAlert = {
      id: result.insertId || Date.now(),
      alert_code: alertCode,
      title,
      description,
      latitude,
      longitude,
      radius_meters: radiusMeters,
      severity,
      status: 'active',
      created_at: new Date().toISOString()
    };

    return res.status(201).json(new ApiResponse(201, newAlert, 'Red Alert broadcasted successfully.'));
  });

  static deactivateAlert = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await executeQuery(`UPDATE red_alerts SET status = 'deactivated' WHERE id = ?`, [id]);
    return res.status(200).json(new ApiResponse(200, null, 'Red Alert deactivated.'));
  });
}

module.AlertController = AlertController;
module.exports = AlertController;
