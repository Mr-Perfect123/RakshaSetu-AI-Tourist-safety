const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const { executeQuery } = require('../config/database');

class ZoneController {
  static getDangerZones = asyncHandler(async (req, res) => {
    const zones = await executeQuery('SELECT * FROM danger_zones WHERE is_active = TRUE ORDER BY id DESC');
    return res.status(200).json(new ApiResponse(200, zones, 'Active danger zones retrieved.'));
  });

  static createDangerZone = asyncHandler(async (req, res) => {
    const { name, description, latitude, longitude, radiusMeters = 500, severity = 'high', crimeType, advisoryMessage } = req.body;
    const zoneCode = `DZ-${Date.now().toString().slice(-6)}`;

    const sql = `INSERT INTO danger_zones (zone_code, name, description, latitude, longitude, radius_meters, severity, crime_type, advisory_message)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const result = await executeQuery(sql, [
      zoneCode,
      name,
      description,
      latitude,
      longitude,
      radiusMeters,
      severity,
      crimeType || 'General Hazard',
      advisoryMessage || 'Exercise caution in this sector.'
    ]);

    const newZone = {
      id: result.insertId || Date.now(),
      zone_code: zoneCode,
      name,
      description,
      latitude,
      longitude,
      radius_meters: radiusMeters,
      severity,
      crime_type: crimeType,
      advisory_message: advisoryMessage,
      is_active: 1
    };

    return res.status(201).json(new ApiResponse(201, newZone, 'Danger zone registered successfully.'));
  });

  static toggleDangerZone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await executeQuery(`UPDATE danger_zones SET is_active = NOT is_active WHERE id = ?`, [id]);
    return res.status(200).json(new ApiResponse(200, null, 'Danger zone status toggled.'));
  });
}

module.exports = ZoneController;
