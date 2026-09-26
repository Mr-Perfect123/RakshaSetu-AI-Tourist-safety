/**
 * Temporary Safety Alert Zones Service
 * 
 * Manages admin-controlled dynamic temporary safety alert zones for ANY worldwide location.
 * Provides circle & polygon geometry validation, auto-expiration, lifecycle management,
 * geofencing evaluation, route safety intersection analysis, and Socket.IO real-time dispatch.
 */

const { executeQuery, inMemoryStore } = require('../config/database');
const GeofenceEngine = require('../utils/geofence');
const { broadcastTemporaryAlertEvent } = require('../socket/sosSocket');

// Extensible list of supported alert types
const SUPPORTED_ALERT_TYPES = [
  'Heavy Rain',
  'Flood',
  'Storm',
  'Cyclone',
  'Thunderstorm',
  'Lightning',
  'Landslide',
  'Mountain Fall / Rockfall',
  'Earthquake',
  'High Waves',
  'Wildfire',
  'Extreme Heat',
  'Extreme Cold',
  'Road Closure',
  'Tourist Spot Closed',
  'Waterfall Closed',
  'Trekking Area Closed',
  'Temporary Restricted Area',
  'Other'
];

const VALID_STATUSES = ['DRAFT', 'ACTIVE', 'RESOLVED', 'EXPIRED', 'DISABLED'];
const VALID_SEVERITIES = ['low', 'moderate', 'high', 'critical'];

class TemporaryAlertService {
  /**
   * Validate Geometry (Circle or Polygon)
   */
  static validateGeometry(geometryType = 'circle', radiusMeters = 500, polygonCoordinates = null) {
    const geomType = (geometryType || 'circle').toLowerCase();

    if (geomType === 'polygon') {
      const coords = GeofenceEngine.normalizePolygonCoordinates(polygonCoordinates);
      if (!coords || coords.length < 3) {
        return { valid: false, error: 'Polygon geometry requires at least 3 valid coordinate vertices.' };
      }
      return { valid: true, geometryType: 'polygon', polygonCoordinates: coords };
    }

    const r = parseInt(radiusMeters, 10);
    if (isNaN(r) || r < 10 || r > 100000) {
      return { valid: false, error: 'Circle radius must be between 10 and 100,000 meters.' };
    }

    return { valid: true, geometryType: 'circle', radiusMeters: r };
  }

  /**
   * Normalize Alert Type (Extensible)
   */
  static normalizeAlertType(type) {
    if (!type) return 'Other';
    const trimmed = String(type).trim();
    const match = SUPPORTED_ALERT_TYPES.find(t => t.toLowerCase() === trimmed.toLowerCase());
    return match || trimmed;
  }

  /**
   * Normalize Severity
   */
  static normalizeSeverity(severity) {
    if (!severity) return 'high';
    const lower = String(severity).trim().toLowerCase();
    if (VALID_SEVERITIES.includes(lower)) return lower;
    if (lower === 'medium' || lower === 'med') return 'moderate';
    if (lower === 'danger' || lower === 'emergency') return 'critical';
    return 'high';
  }

  /**
   * Lazy backend auto-expiration check:
   * Marks any active alerts past `expires_at` as EXPIRED in DB.
   */
  static async autoExpireAlerts() {
    try {
      const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await executeQuery(
        `UPDATE temporary_safety_alerts 
         SET status = 'EXPIRED', updated_at = NOW() 
         WHERE status = 'ACTIVE' AND expires_at IS NOT NULL AND expires_at < ?`,
        [nowUtc]
      );
    } catch (_) {}

    // Also update in-memory store
    if (inMemoryStore.temporary_safety_alerts) {
      const now = new Date();
      inMemoryStore.temporary_safety_alerts.forEach(a => {
        if (a.status === 'ACTIVE' && a.expires_at && new Date(a.expires_at) < now) {
          a.status = 'EXPIRED';
          a.updated_at = new Date().toISOString();
        }
      });
    }
  }

  static normalizeAlertRecord(alert) {
    if (!alert) return null;
    let poly = alert.polygon_coordinates;
    if (typeof poly === 'string') {
      try { poly = JSON.parse(poly); } catch (_) {}
    }
    const expiry = alert.expires_at || alert.valid_until;
    const start = alert.starts_at || alert.valid_from;
    return {
      ...alert,
      polygon_coordinates: poly,
      starts_at: start,
      valid_from: start,
      expires_at: expiry,
      valid_until: expiry,
      advisory_message: alert.safety_instruction || alert.advisory_message,
      safety_instruction: alert.safety_instruction || alert.advisory_message,
      source_attribution: alert.source_name || alert.source_attribution,
      source_name: alert.source_name || alert.source_attribution,
      location_name: alert.location_name || alert.city || alert.state || 'Monitored Sector'
    };
  }

  /**
   * Get Active Temporary Alerts for Tourists / Public Map
   * Only returns currently active and non-expired alerts.
   */
  static async getActiveAlerts({ minLat, maxLat, minLng, maxLng, alertType, severity, limit = 100, offset = 0 } = {}) {
    await this.autoExpireAlerts();

    const nowUtc = new Date().toISOString().slice(0, 19).replace('T', ' ');
    let sql = `
      SELECT * FROM temporary_safety_alerts 
      WHERE status = 'ACTIVE' 
        AND starts_at <= ? 
        AND (expires_at IS NULL OR expires_at > ?)
    `;
    const params = [nowUtc, nowUtc];

    if (minLat !== undefined && maxLat !== undefined && minLng !== undefined && maxLng !== undefined) {
      const pMinLat = parseFloat(minLat);
      const pMaxLat = parseFloat(maxLat);
      const pMinLng = parseFloat(minLng);
      const pMaxLng = parseFloat(maxLng);
      if (!isNaN(pMinLat) && !isNaN(pMaxLat) && !isNaN(pMinLng) && !isNaN(pMaxLng)) {
        sql += ' AND latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ?';
        params.push(pMinLat, pMaxLat, pMinLng, pMaxLng);
      }
    }

    if (alertType) {
      sql += ' AND alert_type = ?';
      params.push(this.normalizeAlertType(alertType));
    }

    if (severity) {
      sql += ' AND severity = ?';
      params.push(this.normalizeSeverity(severity));
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10) || 100, parseInt(offset, 10) || 0);

    let rows = [];
    try {
      rows = await executeQuery(sql, params);
    } catch {
      rows = [];
    }

    // Blend with in-memory fallback
    const now = new Date();
    let memList = (inMemoryStore.temporary_safety_alerts || []).filter(a => 
      a.status === 'ACTIVE' &&
      new Date(a.starts_at) <= now &&
      (!a.expires_at || new Date(a.expires_at) > now)
    );

    const combined = [...(rows || [])];
    for (const mem of memList) {
      if (!combined.some(r => r.id === mem.id || r.alert_code === mem.alert_code)) {
        combined.push(mem);
      }
    }

    return combined.slice(offset, offset + limit).map(a => this.normalizeAlertRecord(a));
  }

  /**
   * Get All Temporary Alerts for Admin Dashboard (Supports Status Filter Tabs)
   */
  static async getAllAlerts({ status = 'ALL', alertType, severity, search, limit = 100, offset = 0 } = {}) {
    await this.autoExpireAlerts();

    let sql = 'SELECT * FROM temporary_safety_alerts WHERE 1=1';
    const params = [];

    const normStatus = (status || 'ALL').toUpperCase();
    if (normStatus !== 'ALL' && VALID_STATUSES.includes(normStatus)) {
      sql += ' AND status = ?';
      params.push(normStatus);
    }

    if (alertType) {
      sql += ' AND alert_type = ?';
      params.push(this.normalizeAlertType(alertType));
    }

    if (severity) {
      sql += ' AND severity = ?';
      params.push(this.normalizeSeverity(severity));
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      sql += ' AND (title LIKE ? OR location_name LIKE ? OR description LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10) || 100, parseInt(offset, 10) || 0);

    let rows = [];
    try {
      rows = await executeQuery(sql, params);
    } catch {
      rows = [];
    }

    let memList = [...(inMemoryStore.temporary_safety_alerts || [])];
    if (normStatus !== 'ALL') {
      memList = memList.filter(a => (a.status || '').toUpperCase() === normStatus);
    }

    const combined = [...(rows || [])];
    for (const mem of memList) {
      if (!combined.some(r => r.id === mem.id || r.alert_code === mem.alert_code)) {
        combined.push(mem);
      }
    }

    return combined.slice(offset, offset + limit).map(a => this.normalizeAlertRecord(a));
  }

  /**
   * Get Single Temporary Alert by ID
   */
  static async getAlertById(id) {
    const numId = parseInt(id, 10);
    try {
      const rows = await executeQuery('SELECT * FROM temporary_safety_alerts WHERE id = ?', [numId]);
      if (rows && rows.length > 0) return this.normalizeAlertRecord(rows[0]);
    } catch {}

    const found = (inMemoryStore.temporary_safety_alerts || []).find(a => a.id === numId);
    return this.normalizeAlertRecord(found) || null;
  }

  /**
   * Create New Temporary Alert (Admin/Police)
   */
  static async createAlert(data, createdBy = null) {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);

    if (!GeofenceEngine.isValidCoord(lat, lng)) {
      throw new Error('Valid latitude and longitude are required.');
    }

    const geomValidation = this.validateGeometry(
      data.geometry_type || data.geometryType || 'circle',
      data.radius_meters || data.radiusMeters || 500,
      data.polygon_coordinates || data.polygonCoordinates
    );

    if (!geomValidation.valid) {
      throw new Error(geomValidation.error);
    }

    const alertCode = data.alert_code || `TSA-${Date.now().toString().slice(-6)}`;
    const title = data.title ? String(data.title).trim() : 'Temporary Safety Advisory';
    const description = data.description || '';
    const alertType = this.normalizeAlertType(data.alert_type || data.alertType);
    const severity = this.normalizeSeverity(data.severity);
    const status = (data.status || 'ACTIVE').toUpperCase();
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    const locationName = data.location_name || data.locationName || 'Monitored Sector';
    const country = data.country || null;
    const state = data.state || null;
    const city = data.city || null;
    const radiusMeters = geomValidation.radiusMeters || 500;
    const warningDistance = parseInt(data.warning_distance_meters || data.warningDistanceMeters || 200, 10);
    const polygonCoordsJson = geomValidation.polygonCoordinates ? JSON.stringify(geomValidation.polygonCoordinates) : null;
    const safetyInstruction = data.safety_instruction || data.safetyInstruction || data.advisory_message || 'Exercise caution and follow local official safety directives.';
    const sourceType = data.source_type || data.sourceType || 'Official Authority';
    const sourceName = data.source_name || data.sourceName || data.source_attribution || 'District Administration';
    const sourceUrl = data.source_url || data.sourceUrl || null;
    const isVerified = data.is_verified !== undefined ? (data.is_verified ? 1 : 0) : 1;
    const startsAt = data.starts_at || data.valid_from || new Date().toISOString().slice(0, 19).replace('T', ' ');
    const expiresAt = data.expires_at || data.valid_until || null;

    const sql = `
      INSERT INTO temporary_safety_alerts (
        alert_code, title, description, alert_type, severity, status, location_name,
        country, state, city, latitude, longitude, geometry_type, radius_meters,
        warning_distance_meters, polygon_coordinates, safety_instruction, source_type,
        source_name, source_url, is_verified, starts_at, expires_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      alertCode, title, description, alertType, severity, status, locationName,
      country, state, city, lat, lng, geomValidation.geometryType, radiusMeters,
      warningDistance, polygonCoordsJson, safetyInstruction, sourceType,
      sourceName, sourceUrl, isVerified, startsAt, expiresAt, createdBy
    ];

    const newAlert = {
      alert_code: alertCode,
      title,
      description,
      alert_type: alertType,
      severity,
      status,
      location_name: locationName,
      country,
      state,
      city,
      latitude: lat,
      longitude: lng,
      geometry_type: geomValidation.geometryType,
      radius_meters: radiusMeters,
      warning_distance_meters: warningDistance,
      polygon_coordinates: polygonCoordsJson,
      safety_instruction: safetyInstruction,
      source_type: sourceType,
      source_name: sourceName,
      source_url: sourceUrl,
      is_verified: isVerified,
      starts_at: startsAt,
      expires_at: expiresAt,
      resolved_at: null,
      created_by: createdBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const res = await executeQuery(sql, params);
      newAlert.id = res.insertId || ((inMemoryStore.temporary_safety_alerts || []).length + 1);
    } catch {
      newAlert.id = (inMemoryStore.temporary_safety_alerts || []).length + 1;
    }

    if (!inMemoryStore.temporary_safety_alerts) inMemoryStore.temporary_safety_alerts = [];
    if (!inMemoryStore.temporary_safety_alerts.some(a => a.id === newAlert.id || a.alert_code === newAlert.alert_code)) {
      inMemoryStore.temporary_safety_alerts.unshift(newAlert);
    }

    const normalized = this.normalizeAlertRecord(newAlert);

    // Real-time broadcast if ACTIVE
    if (status === 'ACTIVE') {
      broadcastTemporaryAlertEvent('temporary_alert_created', normalized);
    }

    return normalized;
  }

  /**
   * Update Existing Temporary Alert
   */
  static async updateAlert(id, data) {
    const existing = await this.getAlertById(id);
    if (!existing) return null;

    const lat = data.latitude !== undefined ? parseFloat(data.latitude) : parseFloat(existing.latitude);
    const lng = data.longitude !== undefined ? parseFloat(data.longitude) : parseFloat(existing.longitude);

    if (!GeofenceEngine.isValidCoord(lat, lng)) {
      throw new Error('Valid latitude and longitude are required.');
    }

    const geomValidation = this.validateGeometry(
      data.geometry_type || existing.geometry_type,
      data.radius_meters || existing.radius_meters,
      data.polygon_coordinates || existing.polygon_coordinates
    );

    if (!geomValidation.valid) {
      throw new Error(geomValidation.error);
    }

    const title = data.title !== undefined ? String(data.title).trim() : existing.title;
    const description = data.description !== undefined ? data.description : existing.description;
    const alertType = data.alert_type ? this.normalizeAlertType(data.alert_type) : existing.alert_type;
    const severity = data.severity ? this.normalizeSeverity(data.severity) : existing.severity;
    const status = data.status ? String(data.status).toUpperCase() : existing.status;
    const locationName = data.location_name || existing.location_name;
    const country = data.country !== undefined ? data.country : existing.country;
    const state = data.state !== undefined ? data.state : existing.state;
    const city = data.city !== undefined ? data.city : existing.city;
    const radiusMeters = geomValidation.radiusMeters || existing.radius_meters;
    const warningDistance = data.warning_distance_meters !== undefined ? parseInt(data.warning_distance_meters, 10) : existing.warning_distance_meters;
    const polygonCoordsJson = geomValidation.polygonCoordinates ? JSON.stringify(geomValidation.polygonCoordinates) : null;
    const safetyInstruction = data.safety_instruction || data.advisory_message || existing.safety_instruction;
    const sourceName = data.source_name || data.source_attribution || existing.source_name;
    const sourceUrl = data.source_url !== undefined ? data.source_url : existing.source_url;
    const isVerified = data.is_verified !== undefined ? (data.is_verified ? 1 : 0) : existing.is_verified;
    const expiresAt = data.expires_at || data.valid_until || existing.expires_at;

    const sql = `
      UPDATE temporary_safety_alerts SET
        title = ?, description = ?, alert_type = ?, severity = ?, status = ?,
        location_name = ?, country = ?, state = ?, city = ?, latitude = ?,
        longitude = ?, geometry_type = ?, radius_meters = ?, warning_distance_meters = ?,
        polygon_coordinates = ?, safety_instruction = ?, source_name = ?,
        source_url = ?, is_verified = ?, expires_at = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      title, description, alertType, severity, status, locationName,
      country, state, city, lat, lng, geomValidation.geometryType, radiusMeters,
      warningDistance, polygonCoordsJson, safetyInstruction, sourceName, sourceUrl,
      isVerified, expiresAt, id
    ];

    try {
      await executeQuery(sql, params);
    } catch {}

    const numId = parseInt(id, 10);
    (inMemoryStore.temporary_safety_alerts || []).forEach(a => {
      if (a.id === numId || (existing && a.alert_code === existing.alert_code)) {
        Object.assign(a, {
          title, description, alert_type: alertType, severity, status,
          location_name: locationName, country, state, city, latitude: lat,
          longitude: lng, geometry_type: geomValidation.geometryType, radius_meters: radiusMeters,
          warning_distance_meters: warningDistance, polygon_coordinates: polygonCoordsJson,
          safety_instruction: safetyInstruction, source_name: sourceName,
          source_url: sourceUrl, is_verified: isVerified, expires_at: expiresAt,
          valid_until: expiresAt, updated_at: new Date().toISOString()
        });
      }
    });

    const updated = await this.getAlertById(id);
    if (updated) {
      broadcastTemporaryAlertEvent('temporary_alert_updated', updated);
    }

    return updated;
  }

  /**
   * Resolve Temporary Alert Immediately (ACTIVE -> RESOLVED)
   */
  static async resolveAlert(id) {
    const existing = await this.getAlertById(id);
    if (!existing) return null;

    try {
      await executeQuery(
        `UPDATE temporary_safety_alerts SET status = 'RESOLVED', resolved_at = NOW(), updated_at = NOW() WHERE id = ?`,
        [id]
      );
    } catch {}

    const numId = parseInt(id, 10);
    (inMemoryStore.temporary_safety_alerts || []).forEach(a => {
      if (a.id === numId || (existing && a.alert_code === existing.alert_code)) {
        a.status = 'RESOLVED';
        a.resolved_at = new Date().toISOString();
        a.updated_at = new Date().toISOString();
      }
    });

    const updated = await this.getAlertById(id);
    if (updated) {
      broadcastTemporaryAlertEvent('temporary_alert_resolved', { id: numId, status: 'RESOLVED' });
    }
    return updated;
  }

  /**
   * Extend Temporary Alert Validity Expiry
   */
  static async extendAlert(id, newExpiresAt) {
    if (!newExpiresAt) {
      throw new Error('New expiration timestamp is required to extend alert.');
    }

    const existing = await this.getAlertById(id);

    try {
      await executeQuery(
        `UPDATE temporary_safety_alerts SET expires_at = ?, status = 'ACTIVE', updated_at = NOW() WHERE id = ?`,
        [newExpiresAt, id]
      );
    } catch {}

    const numId = parseInt(id, 10);
    (inMemoryStore.temporary_safety_alerts || []).forEach(a => {
      if (a.id === numId || (existing && a.alert_code === existing.alert_code)) {
        a.expires_at = newExpiresAt;
        a.valid_until = newExpiresAt;
        a.status = 'ACTIVE';
        a.updated_at = new Date().toISOString();
      }
    });

    const updated = await this.getAlertById(id);
    if (updated) {
      broadcastTemporaryAlertEvent('temporary_alert_updated', updated);
    }
    return updated;
  }

  /**
   * Disable Temporary Alert (ACTIVE -> DISABLED)
   */
  static async disableAlert(id) {
    const existing = await this.getAlertById(id);
    try {
      await executeQuery(
        `UPDATE temporary_safety_alerts SET status = 'DISABLED', updated_at = NOW() WHERE id = ?`,
        [id]
      );
    } catch {}

    const numId = parseInt(id, 10);
    (inMemoryStore.temporary_safety_alerts || []).forEach(a => {
      if (a.id === numId || (existing && a.alert_code === existing.alert_code)) {
        a.status = 'DISABLED';
        a.updated_at = new Date().toISOString();
      }
    });

    const updated = await this.getAlertById(id);
    if (updated) {
      broadcastTemporaryAlertEvent('temporary_alert_resolved', { id: numId, status: 'DISABLED' });
    }
    return updated;
  }

  /**
   * Activate Temporary Alert (DRAFT/DISABLED -> ACTIVE)
   */
  static async activateAlert(id) {
    const existing = await this.getAlertById(id);
    try {
      await executeQuery(
        `UPDATE temporary_safety_alerts SET status = 'ACTIVE', updated_at = NOW() WHERE id = ?`,
        [id]
      );
    } catch {}

    const numId = parseInt(id, 10);
    (inMemoryStore.temporary_safety_alerts || []).forEach(a => {
      if (a.id === numId || (existing && a.alert_code === existing.alert_code)) {
        a.status = 'ACTIVE';
        a.updated_at = new Date().toISOString();
      }
    });

    const updated = await this.getAlertById(id);
    if (updated) {
      broadcastTemporaryAlertEvent('temporary_alert_created', updated);
    }
    return updated;
  }

  /**
   * Delete Temporary Alert Permanently
   */
  static async deleteAlert(id) {
    const numId = parseInt(id, 10);
    const existing = await this.getAlertById(id);
    try {
      await executeQuery('DELETE FROM temporary_safety_alerts WHERE id = ?', [numId]);
    } catch {}

    inMemoryStore.temporary_safety_alerts = (inMemoryStore.temporary_safety_alerts || []).filter(
      a => a.id !== numId && (!existing || a.alert_code !== existing.alert_code)
    );

    broadcastTemporaryAlertEvent('temporary_alert_deleted', { id: numId });
    return { id: numId, deleted: true };
  }

  /**
   * Evaluate Geofence Containment for Tourist Location against Temporary Alert Zone
   */
  static evaluateZoneContainment(touristLat, touristLng, alert) {
    return GeofenceEngine.getZoneState(touristLat, touristLng, alert);
  }
}

module.exports = TemporaryAlertService;
