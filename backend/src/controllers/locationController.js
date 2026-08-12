const SafeLocation = require('../models/SafeLocation');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { executeQuery } = require('../config/database');

const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

class LocationController {
  static getNearbySafeLocations = asyncHandler(async (req, res) => {
    const { latitude, longitude, radiusKm = 10, type } = req.query;
    const lat = parseFloat(latitude) || 28.6139;
    const lng = parseFloat(longitude) || 77.2090;

    const locations = await SafeLocation.findNearby(lat, lng, parseFloat(radiusKm), type);
    return res.status(200).json(new ApiResponse(200, locations, 'Nearby safe locations retrieved.'));
  });

  /**
   * Grant / Revoke Location Sharing Permission
   */
  static setLocationPermission = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : 4;
    const { location_sharing_active } = req.body;
    const isActive = Boolean(location_sharing_active);

    await executeQuery(
      `INSERT INTO location_permissions (user_id, location_sharing_active, permission_granted_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)
       ON DUPLICATE KEY UPDATE location_sharing_active = VALUES(location_sharing_active), permission_granted_at = CURRENT_TIMESTAMP`,
      [userId, isActive]
    );

    return res.status(200).json(
      new ApiResponse(200, { userId, location_sharing_active: isActive }, `Location sharing ${isActive ? 'ENABLED' : 'DISABLED'}.`)
    );
  });

  /**
   * Live Location Update (watchPosition stream + Danger-Zone Geofencing Engine)
   */
  static updateLiveLocation = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : 4;
    const { latitude, longitude, speed = 0, heading = 0, accuracy = 10 } = req.body;

    if (!latitude || !longitude) {
      throw new ApiError(400, 'Latitude and longitude coordinates are required.');
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Update current active location in users table
    await User.updateLocation(userId, lat, lng);

    // Log tracking history
    await executeQuery(
      `INSERT INTO tourist_locations (user_id, latitude, longitude, speed, heading) VALUES (?, ?, ?, ?, ?)`,
      [userId, lat, lng, speed, heading]
    );

    // Ensure permission record exists
    await executeQuery(
      `INSERT INTO location_permissions (user_id, location_sharing_active) VALUES (?, TRUE)
       ON DUPLICATE KEY UPDATE location_sharing_active = TRUE`,
      [userId]
    );

    // Danger Zone Geofencing Evaluation
    const dangerZones = await executeQuery('SELECT * FROM danger_zones WHERE is_active = TRUE');
    let geofenceAlert = {
      status: 'SAFE',
      riskLevel: 'Green',
      message: 'Tourist is in a clear safe area.'
    };

    for (const zone of dangerZones) {
      const distMeters = calculateDistanceMeters(lat, lng, parseFloat(zone.latitude), parseFloat(zone.longitude));
      const radius = zone.radius_meters || 500;

      if (distMeters <= radius) {
        geofenceAlert = {
          status: 'INSIDE_DANGER_ZONE',
          riskLevel: zone.severity === 'critical' ? 'Red' : 'Orange',
          zoneId: zone.id,
          zoneCode: zone.zone_code,
          zoneName: zone.name,
          crimeType: zone.crime_type,
          advisory: zone.advisory_message,
          distanceMeters: Math.round(distMeters),
          precautions: zone.precautions || 'Exercise extreme caution. Contact emergency desk if solicited.'
        };
        // Log safety event to ai_safety_logs
        await executeQuery(
          `INSERT INTO ai_safety_logs (user_id, latitude, longitude, safety_score, risk_level, action_triggered)
           VALUES (?, ?, ?, ?, ?, 'warning_sent')`,
          [userId, lat, lng, zone.risk_score || 85, zone.severity === 'critical' ? 'danger_zone' : 'high']
        );
        break;
      } else if (distMeters <= radius + 800) {
        geofenceAlert = {
          status: 'APPROACHING_RISK_ZONE',
          riskLevel: 'Yellow',
          zoneId: zone.id,
          zoneCode: zone.zone_code,
          zoneName: zone.name,
          crimeType: zone.crime_type,
          distanceMeters: Math.round(distMeters),
          message: `Approaching ${zone.name} (${Math.round(distMeters)}m away).`
        };
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { userId, latitude: lat, longitude: lng, accuracy, timestamp: new Date(), geofenceAlert },
        'Live location updated & geofence evaluated.'
      )
    );
  });

  /**
   * Stop Location Sharing
   */
  static stopLocationSharing = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : 4;
    await executeQuery(
      `UPDATE location_permissions SET location_sharing_active = FALSE WHERE user_id = ?`,
      [userId]
    );

    return res.status(200).json(
      new ApiResponse(200, { userId, location_sharing_active: false }, 'Live location sharing stopped.')
    );
  });

  /**
   * Get Current Location Permission & Pending Admin Requests Status
   */
  static getLocationStatus = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : 4;
    const user = await User.findById(userId);

    const permRows = await executeQuery(`SELECT * FROM location_permissions WHERE user_id = ? LIMIT 1`, [userId]);
    const reqRows = await executeQuery(
      `SELECT lr.*, u.full_name as admin_name FROM location_requests lr JOIN users u ON lr.requested_by = u.id WHERE lr.user_id = ? AND lr.status = 'pending' ORDER BY lr.id DESC`,
      [userId]
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          location_sharing_active: Boolean(permRows[0]?.location_sharing_active),
          latitude: user?.latitude,
          longitude: user?.longitude,
          last_active_at: user?.last_active_at,
          pending_admin_requests: reqRows || []
        },
        'Location privacy status retrieved.'
      )
    );
  });

  /**
   * Tourist Responds to Admin Location Request (ALLOW / DECLINE)
   */
  static respondLocationRequest = asyncHandler(async (req, res) => {
    const userId = req.user ? req.user.id : 4;
    const { requestId, status } = req.body;

    if (!requestId || !['approved', 'declined'].includes(status)) {
      throw new ApiError(400, 'Request ID and valid status (approved or declined) are required.');
    }

    await executeQuery(
      `UPDATE location_requests SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [status, requestId, userId]
    );

    if (status === 'approved') {
      await executeQuery(
        `INSERT INTO location_permissions (user_id, location_sharing_active) VALUES (?, TRUE)
         ON DUPLICATE KEY UPDATE location_sharing_active = TRUE`,
        [userId]
      );
    }

    return res.status(200).json(
      new ApiResponse(200, { requestId, status }, `Location request ${status}.`)
    );
  });
}

module.exports = LocationController;
