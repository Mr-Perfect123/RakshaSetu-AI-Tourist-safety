/**
 * Community Safety Ingestion Service
 * Handles tourist incident reports and converts admin-verified reports into verified safety zones.
 */

const { executeQuery, inMemoryStore } = require('../../config/database');
const SafetyValidationService = require('./safetyValidationService');

class CommunitySafetyService {
  /**
   * Process verified incident report into a verified safety zone
   */
  static async createZoneFromIncident(incident, adminUserId) {
    if (!incident || !incident.id) {
      throw new Error('Valid incident report is required.');
    }

    const lat = parseFloat(incident.latitude);
    const lng = parseFloat(incident.longitude);

    if (!SafetyValidationService.isValidCoord(lat, lng)) {
      throw new Error(`Invalid incident coordinates: [${lat}, ${lng}]`);
    }

    const category = SafetyValidationService.normalizeCategory(incident.category);
    const severity = SafetyValidationService.normalizeSeverity(incident.severity);
    const zoneCode = `COMM-INC-${incident.id}-${Date.now().toString().slice(-4)}`;

    const zoneTitle = incident.title 
      ? `Verified Alert: ${incident.title}` 
      : `Verified ${category.replace(/_/g, ' ')} Hazard (${incident.location_name || 'Area'})`;

    const description = incident.description 
      ? `Verified tourist incident: ${incident.description}`
      : `Admin-verified safety incident report #${incident.id}.`;

    const instructions = 'Exercise heightened vigilance in this perimeter. Keep valuables secure and report suspicious activity.';
    const action = 'Avoid isolated paths and proceed via well-lit public corridors.';

    const zoneData = {
      zone_code: zoneCode,
      name: zoneTitle,
      description: description,
      category: category,
      danger_type: category,
      severity: severity,
      geometry_type: 'circle',
      latitude: lat,
      longitude: lng,
      radius_meters: severity === 'critical' ? 800 : severity === 'high' ? 500 : 300,
      warning_distance_meters: 150,
      safety_instructions: instructions,
      recommended_action: action,
      network_status: 'available',
      source: 'Verified Community Report',
      source_url: null,
      confidence: 'HIGH',
      status: 'active',
      is_verified: true,
      reported_by: incident.user_id || null,
      incident_id: incident.id,
      reported_at: incident.created_at || new Date().toISOString(),
      verified_by: adminUserId || null,
      verified_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), // 30-day active window
      is_active: true
    };

    // Check if zone already exists for this incident
    let existing = null;
    try {
      const rows = await executeQuery('SELECT * FROM danger_zones WHERE incident_id = ?', [incident.id]);
      if (rows && rows.length > 0) existing = rows[0];
    } catch {
      existing = inMemoryStore.danger_zones.find(z => z.incident_id === incident.id);
    }

    if (existing) {
      // Update existing zone
      const sql = `
        UPDATE danger_zones SET
          name = ?, description = ?, category = ?, danger_type = ?, severity = ?,
          latitude = ?, longitude = ?, radius_meters = ?, status = 'active', is_active = 1,
          is_verified = 1, verified_by = ?, verified_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `;
      try {
        await executeQuery(sql, [
          zoneData.name, zoneData.description, zoneData.category, zoneData.danger_type, zoneData.severity,
          zoneData.latitude, zoneData.longitude, zoneData.radius_meters, adminUserId, existing.id
        ]);
      } catch {
        const idx = inMemoryStore.danger_zones.findIndex(z => z.id === existing.id);
        if (idx !== -1) inMemoryStore.danger_zones[idx] = { ...inMemoryStore.danger_zones[idx], ...zoneData };
      }
      return { created: false, zoneId: existing.id, zone: zoneData };
    } else {
      // Insert new safety zone
      const sql = `
        INSERT INTO danger_zones (
          zone_code, name, description, category, danger_type, severity, geometry_type,
          latitude, longitude, radius_meters, warning_distance_meters, safety_instructions,
          recommended_action, network_status, source, confidence, status, is_verified,
          reported_by, incident_id, reported_at, verified_by, verified_at, expires_at, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const params = [
        zoneData.zone_code, zoneData.name, zoneData.description, zoneData.category, zoneData.danger_type,
        zoneData.severity, zoneData.geometry_type, zoneData.latitude, zoneData.longitude, zoneData.radius_meters,
        zoneData.warning_distance_meters, zoneData.safety_instructions, zoneData.recommended_action,
        zoneData.network_status, zoneData.source, zoneData.confidence, zoneData.status, 1,
        zoneData.reported_by, zoneData.incident_id, zoneData.reported_at, zoneData.verified_by,
        zoneData.verified_at, zoneData.expires_at, 1
      ];

      try {
        const result = await executeQuery(sql, params);
        zoneData.id = result.insertId;
      } catch {
        zoneData.id = inMemoryStore.danger_zones.length + 1;
        inMemoryStore.danger_zones.unshift(zoneData);
      }
      return { created: true, zoneId: zoneData.id, zone: zoneData };
    }
  }

  /**
   * Deactivate zone when incident report is rejected or revoked
   */
  static async deactivateZoneForIncident(incidentId) {
    if (!incidentId) return;
    try {
      await executeQuery(`UPDATE danger_zones SET is_active = 0, status = 'rejected', updated_at = NOW() WHERE incident_id = ?`, [incidentId]);
    } catch {
      const z = inMemoryStore.danger_zones.find(item => item.incident_id === incidentId);
      if (z) {
        z.is_active = 0;
        z.status = 'rejected';
      }
    }
  }
}

module.exports = CommunitySafetyService;
