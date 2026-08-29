const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const { executeQuery } = require('../config/database');

class ZoneController {
  /**
   * Get all active danger zones for tourists, or all zones for admin
   */
  static getDangerZones = asyncHandler(async (req, res) => {
    const showAll = req.query.all === 'true' || req.query.all === true;
    const { minLat, maxLat, minLng, maxLng, type } = req.query;

    let sql = 'SELECT * FROM danger_zones WHERE is_active = TRUE';
    let params = [];

    if (showAll) {
      sql = 'SELECT * FROM danger_zones WHERE 1=1';
    }

    if (minLat && maxLat && minLng && maxLng) {
      sql += ' AND latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ?';
      params.push(parseFloat(minLat), parseFloat(maxLat), parseFloat(minLng), parseFloat(maxLng));
    }

    if (type) {
      sql += ' AND danger_type = ?';
      params.push(type.toUpperCase());
    }

    sql += ' ORDER BY id DESC';

    const zones = await executeQuery(sql, params);
    return res.status(200).json(new ApiResponse(200, zones, 'Danger zones retrieved successfully.'));
  });

  /**
   * Get single danger zone by ID
   */
  static getDangerZoneById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const rows = await executeQuery('SELECT * FROM danger_zones WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      throw new ApiError(404, 'Danger zone not found.');
    }
    return res.status(200).json(new ApiResponse(200, rows[0], 'Danger zone details retrieved.'));
  });

  /**
   * Create new danger zone (Admin/Police)
   */
  static createDangerZone = asyncHandler(async (req, res) => {
    const {
      name,
      description = '',
      latitude,
      longitude,
      radiusMeters = 500,
      radius = 500,
      warningDistanceMeters = 200,
      warningDistance = 200,
      severity = 'high',
      dangerType = 'THEFT',
      crimeType,
      advisoryMessage,
      safetyInstructions,
      recommendedAction,
      networkStatus = 'available'
    } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      throw new ApiError(400, 'Zone name, latitude, and longitude are required.');
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new ApiError(400, 'Valid numeric latitude [-90, 90] and longitude [-180, 180] are required.');
    }

    const finalRadius = parseInt(radiusMeters || radius || 500, 10);
    const finalWarningDist = parseInt(warningDistanceMeters || warningDistance || 200, 10);
    const finalDangerType = (dangerType || 'THEFT').toUpperCase();
    const finalSeverity = (severity || 'high').toLowerCase();
    const finalInstructions = safetyInstructions || advisoryMessage || 'Exercise high vigilance and secure personal valuables.';
    const finalAction = recommendedAction || 'Move toward a safer well-lit public area.';
    const zoneCode = `DZ-${Date.now().toString().slice(-6)}`;

    const sql = `INSERT INTO danger_zones (
      zone_code, name, description, latitude, longitude, radius_meters, 
      warning_distance_meters, severity, danger_type, safety_instructions, 
      recommended_action, network_status, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const result = await executeQuery(sql, [
      zoneCode,
      name,
      description,
      lat,
      lng,
      finalRadius,
      finalWarningDist,
      finalSeverity,
      finalDangerType,
      finalInstructions,
      finalAction,
      networkStatus,
      1
    ]);

    const newZone = {
      id: result.insertId || Date.now(),
      zone_code: zoneCode,
      name,
      description,
      latitude: lat,
      longitude: lng,
      radius_meters: finalRadius,
      warning_distance_meters: finalWarningDist,
      severity: finalSeverity,
      danger_type: finalDangerType,
      safety_instructions: finalInstructions,
      recommended_action: finalAction,
      network_status: networkStatus,
      is_active: 1,
      is_sample_data: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return res.status(201).json(new ApiResponse(201, newZone, 'Danger zone registered successfully.'));
  });

  /**
   * Update existing danger zone (Admin/Police)
   */
  static updateDangerZone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      name,
      description,
      latitude,
      longitude,
      radiusMeters,
      radius,
      warningDistanceMeters,
      warningDistance,
      severity,
      dangerType,
      safetyInstructions,
      recommendedAction,
      networkStatus
    } = req.body;

    const existing = await executeQuery('SELECT * FROM danger_zones WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      throw new ApiError(404, 'Danger zone not found.');
    }

    const current = existing[0];
    const lat = latitude !== undefined ? parseFloat(latitude) : current.latitude;
    const lng = longitude !== undefined ? parseFloat(longitude) : current.longitude;
    const finalRadius = parseInt(radiusMeters || radius || current.radius_meters, 10);
    const finalWarningDist = parseInt(warningDistanceMeters || warningDistance || current.warning_distance_meters || 200, 10);
    const finalSeverity = (severity || current.severity || 'high').toLowerCase();
    const finalDangerType = (dangerType || current.danger_type || 'THEFT').toUpperCase();
    const finalName = name || current.name;
    const finalDesc = description !== undefined ? description : current.description;
    const finalInstructions = safetyInstructions || current.safety_instructions || current.advisory_message || '';
    const finalAction = recommendedAction || current.recommended_action || '';
    const finalNet = networkStatus || current.network_status || 'available';

    const sql = `UPDATE danger_zones SET 
      name = ?, description = ?, latitude = ?, longitude = ?, 
      radius_meters = ?, warning_distance_meters = ?, severity = ?, 
      danger_type = ?, safety_instructions = ?, recommended_action = ?, 
      network_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?`;

    await executeQuery(sql, [
      finalName,
      finalDesc,
      lat,
      lng,
      finalRadius,
      finalWarningDist,
      finalSeverity,
      finalDangerType,
      finalInstructions,
      finalAction,
      finalNet,
      id
    ]);

    const updatedRows = await executeQuery('SELECT * FROM danger_zones WHERE id = ?', [id]);
    return res.status(200).json(new ApiResponse(200, updatedRows[0] || current, 'Danger zone updated successfully.'));
  });

  /**
   * Analyze safety score of a proposed travel route
   */
  static analyzeRouteSafety = asyncHandler(async (req, res) => {
    const { routeCoordinates } = req.body;

    if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0) {
      throw new ApiError(400, 'routeCoordinates array is required for safety analysis.');
    }

    // Load active danger zones
    const zones = await executeQuery('SELECT * FROM danger_zones WHERE is_active = TRUE');

    const warnings = [];
    const intersectedZoneIds = new Set();

    const calculateDist = (lat1, lon1, lat2, lon2) => {
      const R = 6371000;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    for (const point of routeCoordinates) {
      const ptLat = parseFloat(point.lat || point[0]);
      const ptLng = parseFloat(point.lng || point[1]);

      if (isNaN(ptLat) || isNaN(ptLng)) continue;

      for (const zone of zones) {
        if (intersectedZoneIds.has(zone.id)) continue;

        const distance = calculateDist(ptLat, ptLng, parseFloat(zone.latitude), parseFloat(zone.longitude));
        const radius = zone.radius_meters || 500;

        if (distance <= radius) {
          intersectedZoneIds.add(zone.id);
          warnings.push({
            id: zone.id,
            zone_code: zone.zone_code,
            name: zone.name,
            danger_type: zone.danger_type,
            severity: zone.severity,
            description: zone.description,
            safety_instructions: zone.safety_instructions,
            distanceMeters: Math.round(distance),
            type: 'INTERSECTING'
          });
        } else if (distance <= radius + 300) {
          intersectedZoneIds.add(zone.id);
          warnings.push({
            id: zone.id,
            zone_code: zone.zone_code,
            name: zone.name,
            danger_type: zone.danger_type,
            severity: zone.severity,
            description: zone.description,
            safety_instructions: zone.safety_instructions,
            distanceMeters: Math.round(distance),
            type: 'NEAR_ROUTE'
          });
        }
      }
    }

    let safetyScore = 100;
    warnings.forEach(w => {
      const reduction = w.severity === 'critical' ? 25 : w.severity === 'high' ? 15 : 8;
      safetyScore = Math.max(10, safetyScore - reduction);
    });

    let safetyStatus = 'Mostly Safe';
    let safetyColor = 'Green';

    if (safetyScore < 50) {
      safetyStatus = 'Dangerous';
      safetyColor = 'Red';
    } else if (safetyScore < 85) {
      safetyStatus = 'Caution Advisable';
      safetyColor = 'Orange';
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          safetyScore,
          safetyStatus,
          safetyColor,
          warnings
        },
        'Route safety analysis completed.'
      )
    );
  });

  /**
   * Delete danger zone (Admin/Police)
   */
  static deleteDangerZone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await executeQuery('DELETE FROM danger_zones WHERE id = ?', [id]);
    return res.status(200).json(new ApiResponse(200, { id: parseInt(id, 10) }, 'Danger zone removed successfully.'));
  });

  /**
   * Toggle danger zone active status (Admin/Police)
   */
  static toggleDangerZone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await executeQuery(`UPDATE danger_zones SET is_active = NOT is_active WHERE id = ?`, [id]);
    const updated = await executeQuery('SELECT * FROM danger_zones WHERE id = ?', [id]);
    return res.status(200).json(new ApiResponse(200, updated[0] || null, 'Danger zone status toggled.'));
  });
}

module.exports = ZoneController;

