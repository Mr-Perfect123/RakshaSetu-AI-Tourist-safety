/**
 * Incident-to-Danger Zone Service
 * Automatically processes verified tourist incident reports into active geofenced danger zones
 * using validation rules, deduplication, existing-zone merging, and category-based expiration policies.
 */

const { executeQuery, inMemoryStore } = require('../config/database');
const SafetyValidationService = require('./safety/safetyValidationService');
const GeofenceEngine = require('../utils/geofence');

// Category policies for radius (meters), validity period (days), and geofence eligibility
const CATEGORY_POLICIES = {
  THEFT: { radius: 300, expiryDays: 60, geofenceEligible: true, titlePrefix: 'Theft & Pickpocket Risk' },
  HIGH_CRIME: { radius: 500, expiryDays: 60, geofenceEligible: true, titlePrefix: 'High Crime Perimeter' },
  ACCIDENT_PRONE: { radius: 400, expiryDays: 90, geofenceEligible: true, titlePrefix: 'Accident-Prone Zone' },
  ROAD_HAZARD: { radius: 300, expiryDays: 14, geofenceEligible: true, titlePrefix: 'Road Obstruction Hazard' },
  WILDLIFE: { radius: 800, expiryDays: 14, geofenceEligible: true, titlePrefix: 'Active Wildlife Hazard' },
  FLOOD_RISK: { radius: 1000, expiryDays: 14, geofenceEligible: true, titlePrefix: 'Flood Risk Sector' },
  LANDSLIDE_RISK: { radius: 800, expiryDays: 30, geofenceEligible: true, titlePrefix: 'Landslide Warning Area' },
  FIRE_RISK: { radius: 800, expiryDays: 14, geofenceEligible: true, titlePrefix: 'Fire Hazard Zone' },
  EXTREME_WEATHER: { radius: 1000, expiryDays: 7, geofenceEligible: true, titlePrefix: 'Extreme Weather Hazard' },
  DANGEROUS_TERRAIN: { radius: 500, expiryDays: 90, geofenceEligible: true, titlePrefix: 'Dangerous Terrain Warning' },
  WATER_DANGER: { radius: 400, expiryDays: 60, geofenceEligible: true, titlePrefix: 'Unsafe Water Warning' },
  DROWNING_RISK: { radius: 400, expiryDays: 60, geofenceEligible: true, titlePrefix: 'Drowning Risk Area' },
  RESTRICTED_AREA: { radius: 500, expiryDays: 180, geofenceEligible: true, titlePrefix: 'Restricted Access Zone' },
  RIOT_OR_UNREST: { radius: 600, expiryDays: 7, geofenceEligible: true, titlePrefix: 'Civil Unrest Warning' },
  CONSTRUCTION_HAZARD: { radius: 300, expiryDays: 30, geofenceEligible: true, titlePrefix: 'Construction Hazard Area' },
  NO_NETWORK: { radius: 800, expiryDays: 180, geofenceEligible: true, titlePrefix: 'No Network Coverage Zone' },
  MEDICAL_RISK: { radius: 400, expiryDays: 14, geofenceEligible: true, titlePrefix: 'Medical Risk Area' },
  COMMUNITY_REPORT: { radius: 300, expiryDays: 30, geofenceEligible: true, titlePrefix: 'Community Safety Alert' },
  OTHER: { radius: 300, expiryDays: 30, geofenceEligible: true, titlePrefix: 'Safety Hazard Alert' }
};

class IncidentZoneService {
  /**
   * Check if incident is eligible for automatic geofence creation
   */
  static shouldCreateZone(incident) {
    if (!incident) return { eligible: false, reason: 'Incident report is missing or invalid.' };

    const status = String(incident.status || '').toLowerCase();
    if (status !== 'verified' && status !== 'approved') {
      return { eligible: false, reason: `Incident status is '${status}'. Only VERIFIED reports trigger automatic geofencing.` };
    }

    const lat = parseFloat(incident.latitude);
    const lng = parseFloat(incident.longitude);
    if (!GeofenceEngine.isValidCoord(lat, lng)) {
      return { eligible: false, reason: 'Incident report contains invalid numeric GPS coordinates.' };
    }

    const category = SafetyValidationService.normalizeCategory(incident.category);
    const policy = CATEGORY_POLICIES[category] || CATEGORY_POLICIES.OTHER;

    if (!policy.geofenceEligible) {
      return { eligible: false, reason: `Category '${category}' does not require a spatial geofence perimeter.` };
    }

    return { eligible: true, category, policy };
  }

  /**
   * Process Verified Incident (Idempotent Automatic Conversion)
   */
  static async processVerifiedIncident(incidentOrId, adminUserId = null) {
    let incident = incidentOrId;

    // Load from DB if ID passed
    if (typeof incidentOrId === 'number' || typeof incidentOrId === 'string') {
      try {
        const rows = await executeQuery('SELECT * FROM incident_reports WHERE id = ?', [incidentOrId]);
        incident = rows && rows.length > 0 ? rows[0] : null;
      } catch {
        incident = inMemoryStore.incident_reports.find(i => i.id === parseInt(incidentOrId, 10)) || null;
      }
    }

    if (!incident) {
      return { zoneCreated: false, zoneUpdated: false, reason: 'Incident report not found in database.' };
    }

    const check = this.shouldCreateZone(incident);
    if (!check.eligible) {
      // Deactivate any existing zone if status changed to non-verified/rejected
      if (['rejected', 'dismissed', 'revoked'].includes(String(incident.status).toLowerCase())) {
        await this.deactivateZoneForIncident(incident.id);
      }
      return { zoneCreated: false, zoneUpdated: false, incident, reason: check.reason };
    }

    const incLat = parseFloat(incident.latitude);
    const incLng = parseFloat(incident.longitude);
    const category = check.category;
    const severity = SafetyValidationService.normalizeSeverity(incident.severity);
    const policy = check.policy;

    // Determine radius based on severity override or category default
    let radiusMeters = policy.radius;
    if (severity === 'critical') radiusMeters = Math.max(radiusMeters, 800);
    else if (severity === 'high') radiusMeters = Math.max(radiusMeters, 500);

    const expiryMs = (policy.expiryDays || 30) * 24 * 3600 * 1000;
    const expiresAt = new Date(Date.now() + expiryMs).toISOString();

    // 1. SEARCH FOR EXISTING COMPATIBLE ZONE NEARBY (within 500m and same category)
    let existingZones = [];
    try {
      existingZones = await executeQuery('SELECT * FROM danger_zones WHERE is_active = 1');
    } catch {
      existingZones = (inMemoryStore.danger_zones || []).filter(z => z.is_active === 1 || z.is_active === true);
    }
    if (!existingZones || existingZones.length === 0) {
      existingZones = (inMemoryStore.danger_zones || []).filter(z => z.is_active === 1 || z.is_active === true);
    }

    let compatibleZone = null;
    for (const z of existingZones) {
      const zLat = parseFloat(z.latitude);
      const zLng = parseFloat(z.longitude);
      if (!GeofenceEngine.isValidCoord(zLat, zLng)) continue;

      const zCat = SafetyValidationService.normalizeCategory(z.category || z.danger_type);
      if (zCat === category) {
        const dist = GeofenceEngine.calculateDistanceMeters(incLat, incLng, zLat, zLng);
        if (dist <= 500) {
          compatibleZone = z;
          break;
        }
      }
    }

    // 2. UPDATE EXISTING COMPATIBLE ZONE IF FOUND
    if (compatibleZone) {
      const newCount = (compatibleZone.incident_count || 1) + 1;
      let relatedIds = [];
      try {
        relatedIds = typeof compatibleZone.related_incident_ids === 'string' ? JSON.parse(compatibleZone.related_incident_ids) : (compatibleZone.related_incident_ids || []);
      } catch {
        relatedIds = [];
      }
      if (!relatedIds.includes(incident.id)) {
        relatedIds.push(incident.id);
      }

      const elevatedConfidence = newCount >= 3 ? 'HIGH' : 'MEDIUM';
      const updatedRadius = Math.max(compatibleZone.radius_meters || 500, radiusMeters);

      const updateSql = `
        UPDATE danger_zones SET
          incident_count = ?,
          related_incident_ids = ?,
          last_incident_at = NOW(),
          confidence = ?,
          radius_meters = ?,
          expires_at = ?,
          status = 'active',
          is_active = 1,
          updated_at = NOW()
        WHERE id = ?
      `;

      const updateParams = [
        newCount,
        JSON.stringify(relatedIds),
        elevatedConfidence,
        updatedRadius,
        expiresAt,
        compatibleZone.id
      ];

      try {
        await executeQuery(updateSql, updateParams);
      } catch {}

      const idx = (inMemoryStore.danger_zones || []).findIndex(z => z.id === compatibleZone.id);
      if (idx !== -1) {
        inMemoryStore.danger_zones[idx] = {
          ...inMemoryStore.danger_zones[idx],
          incident_count: newCount,
          related_incident_ids: JSON.stringify(relatedIds),
          confidence: elevatedConfidence,
          radius_meters: updatedRadius,
          expires_at: expiresAt,
          status: 'active',
          is_active: 1
        };
      }

      const updatedZone = {
        ...compatibleZone,
        incident_count: newCount,
        confidence: elevatedConfidence,
        radius_meters: updatedRadius,
        expires_at: expiresAt
      };

      this.emitSocketEvent('safety-zone-updated', updatedZone);

      return {
        incident,
        zoneCreated: false,
        zoneUpdated: true,
        zone: updatedZone,
        reason: `Merged verified incident into existing ${category} safety zone #${compatibleZone.id} (Total verified reports: ${newCount}).`
      };
    }

    // 3. CREATE NEW AUTOMATIC DANGER ZONE IF NO COMPATIBLE ZONE EXISTS
    const zoneCode = `COMM-INC-${incident.id}-${Date.now().toString().slice(-4)}`;
    const zoneName = incident.title ? `${policy.titlePrefix}: ${incident.title}` : `${policy.titlePrefix} (${incident.location_name || 'Reported Area'})`;
    const description = incident.description ? `Verified report: ${incident.description}` : `Admin-verified safety incident #${incident.id}.`;

    const instructions = 'Exercise high vigilance in this perimeter. Secure valuables and proceed along main well-lit arterial roads.';
    const action = 'Move towards safe public corridors with high pedestrian presence.';

    const newZoneData = {
      zone_code: zoneCode,
      name: zoneName,
      description,
      category,
      danger_type: category,
      severity,
      geometry_type: incident.polygon_coordinates ? 'polygon' : 'circle',
      latitude: incLat,
      longitude: incLng,
      radius_meters: radiusMeters,
      warning_distance_meters: 200,
      polygon_coordinates: incident.polygon_coordinates ? (typeof incident.polygon_coordinates === 'string' ? incident.polygon_coordinates : JSON.stringify(incident.polygon_coordinates)) : null,
      safety_instructions: instructions,
      recommended_action: action,
      network_status: 'available',
      source: 'Verified Community Report',
      source_url: null, // No fake URLs
      confidence: 'MEDIUM',
      status: 'active',
      is_verified: true,
      reported_by: incident.user_id || null,
      incident_id: incident.id,
      incident_count: 1,
      related_incident_ids: JSON.stringify([incident.id]),
      reported_at: incident.created_at || new Date().toISOString(),
      verified_by: adminUserId || null,
      verified_at: new Date().toISOString(),
      expires_at: expiresAt,
      is_active: 1
    };

    const insertSql = `
      INSERT INTO danger_zones (
        zone_code, name, description, category, danger_type, severity, geometry_type,
        latitude, longitude, radius_meters, warning_distance_meters, polygon_coordinates,
        safety_instructions, recommended_action, network_status, source, source_url,
        confidence, status, is_verified, reported_by, incident_id, incident_count,
        related_incident_ids, reported_at, verified_by, verified_at, expires_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertParams = [
      newZoneData.zone_code, newZoneData.name, newZoneData.description, newZoneData.category, newZoneData.danger_type,
      newZoneData.severity, newZoneData.geometry_type, newZoneData.latitude, newZoneData.longitude, newZoneData.radius_meters,
      newZoneData.warning_distance_meters, newZoneData.polygon_coordinates, newZoneData.safety_instructions,
      newZoneData.recommended_action, newZoneData.network_status, newZoneData.source, newZoneData.source_url,
      newZoneData.confidence, newZoneData.status, 1, newZoneData.reported_by, newZoneData.incident_id,
      1, newZoneData.related_incident_ids, newZoneData.reported_at, newZoneData.verified_by, newZoneData.verified_at,
      newZoneData.expires_at, 1
    ];

    try {
      const result = await executeQuery(insertSql, insertParams);
      newZoneData.id = result.insertId || (inMemoryStore.danger_zones.length + 1);
    } catch {
      newZoneData.id = inMemoryStore.danger_zones.length + 1;
    }
    inMemoryStore.danger_zones.unshift(newZoneData);

    this.emitSocketEvent('safety-zone-created', newZoneData);

    return {
      incident,
      zoneCreated: true,
      zoneUpdated: false,
      zone: newZoneData,
      reason: `Automatically created new verified geofenced danger zone #${newZoneData.id} (${category}, ${radiusMeters}m radius).`
    };
  }

  /**
   * Deactivate zone linked to rejected or revoked incident
   */
  static async deactivateZoneForIncident(incidentId) {
    if (!incidentId) return;
    try {
      await executeQuery(`UPDATE danger_zones SET is_active = 0, status = 'rejected', updated_at = NOW() WHERE incident_id = ?`, [incidentId]);
    } catch {}

    const z = (inMemoryStore.danger_zones || []).find(item => item.incident_id === incidentId);
    if (z) {
      z.is_active = 0;
      z.status = 'rejected';
    }
  }

  /**
   * Safe Socket IO Broadcaster
   */
  static emitSocketEvent(eventName, data) {
    try {
      const { broadcastTouristActivity } = require('../socket/sosSocket');
      broadcastTouristActivity({
        type: eventName,
        data
      });
    } catch {}
  }
}

module.exports = IncidentZoneService;
