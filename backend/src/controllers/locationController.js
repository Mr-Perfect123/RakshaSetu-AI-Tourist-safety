const SafeLocation = require('../models/SafeLocation');
const User = require('../models/User');
const ApiResponse = require('../utils/response');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { executeQuery, inMemoryStore } = require('../config/database');
const LocationPermissionService = require('../services/locationPermissionService');

class LocationController {
  static getNearbySafeLocations = asyncHandler(async (req, res) => {
    const { latitude, longitude, radiusKm = 10, type } = req.query;
    if (!latitude || !longitude) {
      throw new ApiError(400, 'Latitude and longitude coordinates are required for finding nearby safe locations.');
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    const locations = await SafeLocation.findNearby(lat, lng, parseFloat(radiusKm), type);
    return res.status(200).json(new ApiResponse(200, locations, 'Nearby safe locations retrieved.'));
  });

  /**
   * Grant / Revoke Global Location Sharing Permission
   */
  static setLocationPermission = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication token required.');
    }
    const userId = parseInt(req.user.id, 10);
    const { location_sharing_active } = req.body;
    const isActive = Boolean(location_sharing_active);

    try {
      await executeQuery(
        `INSERT INTO location_permissions (user_id, location_sharing_active, permission_granted_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE location_sharing_active = VALUES(location_sharing_active), permission_granted_at = CURRENT_TIMESTAMP`,
        [userId, isActive]
      );
    } catch {}

    if (!inMemoryStore.location_permissions) inMemoryStore.location_permissions = [];
    const idx = inMemoryStore.location_permissions.findIndex(p => p.user_id === userId);
    if (idx !== -1) {
      inMemoryStore.location_permissions[idx].location_sharing_active = isActive;
    } else {
      inMemoryStore.location_permissions.push({ user_id: userId, location_sharing_active: isActive });
    }

    if (!isActive) {
      await LocationPermissionService.revokeLocationPermission(userId);
      // Socket notification
      try {
        const { emitSocketLocationRevoked } = require('../socket/sosSocket');
        emitSocketLocationRevoked(userId);
      } catch {}
    }

    return res.status(200).json(
      new ApiResponse(200, { userId, location_sharing_active: isActive }, `Global location sharing ${isActive ? 'ENABLED' : 'DISABLED'}.`)
    );
  });

  /**
   * Live Location Update (watchPosition stream + Danger-Zone Geofencing Engine)
   */
  static updateLiveLocation = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication token required.');
    }
    const userId = parseInt(req.user.id, 10);
    const { latitude, longitude, speed = 0, heading = 0, accuracy = 10 } = req.body;

    if (!latitude || !longitude) {
      throw new ApiError(400, 'Latitude and longitude coordinates are required.');
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new ApiError(400, 'Invalid numeric GPS coordinates.');
    }

    // Update current active location in users table
    await User.updateLocation(userId, lat, lng);

    // Log tracking history
    try {
      await executeQuery(
        `INSERT INTO tourist_locations (user_id, latitude, longitude, speed, heading) VALUES (?, ?, ?, ?, ?)`,
        [userId, lat, lng, speed, heading]
      );
    } catch {}

    // Danger Zone Geofencing Evaluation
    const GeofenceEngine = require('../utils/geofence');
    let dangerZones = [];
    try {
      dangerZones = await executeQuery('SELECT * FROM danger_zones WHERE is_active = TRUE');
    } catch {
      dangerZones = (inMemoryStore.danger_zones || []).filter(z => z.is_active === 1 || z.is_active === true);
    }
    if (!dangerZones || dangerZones.length === 0) {
      dangerZones = (inMemoryStore.danger_zones || []).filter(z => z.is_active === 1 || z.is_active === true);
    }

    let geofenceAlert = {
      status: 'SAFE',
      riskLevel: 'Green',
      message: 'Tourist is in a clear safe area.'
    };

    for (const zone of dangerZones) {
      const containment = GeofenceEngine.getZoneState(lat, lng, zone);

      if (containment.state === 'INSIDE') {
        geofenceAlert = {
          status: 'INSIDE_DANGER_ZONE',
          riskLevel: zone.severity === 'critical' ? 'Red' : 'Orange',
          zoneId: zone.id,
          zoneCode: zone.zone_code,
          zoneName: zone.name,
          crimeType: zone.category || zone.crime_type,
          advisory: zone.safety_instructions || zone.advisory_message,
          distanceMeters: containment.distanceMeters,
          precautions: zone.safety_instructions || zone.precautions || 'Exercise extreme caution. Contact emergency desk if solicited.'
        };
        try {
          await executeQuery(
            `INSERT INTO ai_safety_logs (user_id, latitude, longitude, safety_score, risk_level, action_triggered)
             VALUES (?, ?, ?, ?, ?, 'warning_sent')`,
            [userId, lat, lng, zone.risk_score || 85, zone.severity === 'critical' ? 'danger_zone' : 'high']
          );
        } catch {}
        break;
      } else if (containment.state === 'APPROACHING') {
        geofenceAlert = {
          status: 'APPROACHING_RISK_ZONE',
          riskLevel: 'Yellow',
          zoneId: zone.id,
          zoneCode: zone.zone_code,
          zoneName: zone.name,
          crimeType: zone.category || zone.crime_type,
          distanceMeters: containment.distanceMeters,
          message: `Approaching ${zone.name} (${containment.distanceMeters}m away).`
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
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication token required.');
    }
    const userId = parseInt(req.user.id, 10);

    await LocationPermissionService.revokeLocationPermission(userId);

    try {
      const { emitSocketLocationRevoked } = require('../socket/sosSocket');
      emitSocketLocationRevoked(userId);
    } catch {}

    return res.status(200).json(
      new ApiResponse(200, { userId, location_sharing_active: false }, 'Live location sharing stopped.')
    );
  });

  /**
   * Get Current Location Permission & Pending Admin Requests Status
   */
  static getLocationStatus = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication token required.');
    }
    const userId = parseInt(req.user.id, 10);
    const user = await User.findById(userId);

    const isGlobalSharing = await LocationPermissionService.isGlobalSharingActive(userId);

    let reqRows = [];
    try {
      reqRows = await executeQuery(
        `SELECT lr.*, u.full_name as admin_name FROM location_requests lr JOIN users u ON lr.requested_by = u.id WHERE lr.user_id = ? AND lr.status = 'pending' ORDER BY lr.id DESC`,
        [userId]
      );
    } catch {
      reqRows = (inMemoryStore.location_requests || []).filter(r => r.user_id === userId && r.status === 'pending');
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          location_sharing_active: isGlobalSharing,
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
   * Tourist Responds to Admin Location Request (APPROVED / DECLINED)
   */
  static respondLocationRequest = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication token required.');
    }
    const userId = parseInt(req.user.id, 10);
    const { requestId, status } = req.body;

    if (!requestId || !['approved', 'declined', 'declined', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Request ID and valid status (approved or declined) are required.');
    }

    const finalStatus = status === 'approved' ? 'approved' : 'declined';

    // Verify the request exists and belongs to the authenticated tourist
    let requestObj = null;
    try {
      const rows = await executeQuery('SELECT * FROM location_requests WHERE id = ? AND user_id = ?', [requestId, userId]);
      requestObj = rows && rows.length > 0 ? rows[0] : null;
    } catch {
      requestObj = (inMemoryStore.location_requests || []).find(r => r.id === parseInt(requestId, 10) && r.user_id === userId) || null;
    }

    if (!requestObj) {
      throw new ApiError(403, 'Permission request not found or does not belong to the authenticated user.');
    }

    try {
      await executeQuery(
        `UPDATE location_requests SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
        [finalStatus, requestId, userId]
      );
    } catch {}

    const memReq = (inMemoryStore.location_requests || []).find(r => r.id === parseInt(requestId, 10));
    if (memReq) {
      memReq.status = finalStatus;
    }

    if (finalStatus === 'approved') {
      try {
        await executeQuery(
          `INSERT INTO location_permissions (user_id, location_sharing_active) VALUES (?, TRUE)
           ON DUPLICATE KEY UPDATE location_sharing_active = TRUE`,
          [userId]
        );
      } catch {}

      if (!inMemoryStore.location_permissions) inMemoryStore.location_permissions = [];
      const perm = inMemoryStore.location_permissions.find(p => p.user_id === userId);
      if (perm) perm.location_sharing_active = true;
      else inMemoryStore.location_permissions.push({ user_id: userId, location_sharing_active: true });
    }

    return res.status(200).json(
      new ApiResponse(200, { requestId, status: finalStatus }, `Location request ${finalStatus}.`)
    );
  });

  /**
   * Admin-Only REST Endpoint: Get Authorized Tourist Live Locations
   * Filters results strictly using LocationPermissionService.canAdminViewTouristLocation
   */
  static getAuthorizedTouristLocations = asyncHandler(async (req, res) => {
    if (!req.user || !req.user.id) {
      throw new ApiError(401, 'Authentication token required.');
    }
    const adminId = parseInt(req.user.id, 10);

    let allTourists = [];
    try {
      allTourists = await executeQuery(
        `SELECT u.id, u.full_name, u.email, u.phone, u.latitude, u.longitude, u.status, u.last_active_at
         FROM users u WHERE u.role = 'Tourist'`
      );
    } catch {}

    if (!allTourists || allTourists.length === 0) {
      allTourists = (inMemoryStore.users || []).filter(u => u.role === 'Tourist');
    }

    const authorizedList = [];
    for (const t of allTourists) {
      const canView = await LocationPermissionService.canAdminViewTouristLocation(adminId, t.id);
      if (canView) {
        authorizedList.push({
          id: t.id,
          full_name: t.full_name,
          phone: t.phone,
          latitude: t.latitude,
          longitude: t.longitude,
          status: t.status,
          last_active_at: t.last_active_at
        });
      }
    }

    return res.status(200).json(
      new ApiResponse(200, authorizedList, 'Authorized tourist live locations retrieved.')
    );
  });
}

module.exports = LocationController;
