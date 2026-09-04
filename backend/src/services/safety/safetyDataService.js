/**
 * Core Safety Data Service
 * Provides viewport queries, point-in-polygon & circle geofencing, route safety analysis, and CRUD operations.
 */

const { executeQuery, inMemoryStore } = require('../../config/database');
const SafetyValidationService = require('./safetyValidationService');
const GeofenceEngine = require('../../utils/geofence');

class SafetyDataService {
  /**
   * Query Safety Zones with Viewport Bounding-Box & Advanced Filters
   */
  static async getZones({
    minLat,
    maxLat,
    minLng,
    maxLng,
    category,
    type,
    severity,
    status,
    isVerified,
    country,
    source,
    showAll = false,
    limit = 200,
    offset = 0
  } = {}) {
    let sql = 'SELECT * FROM danger_zones WHERE 1=1';
    const params = [];

    if (!showAll) {
      sql += ' AND is_active = 1';
      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      } else {
        sql += " AND (status = 'active' OR status IS NULL)";
      }
    } else if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (isVerified !== undefined && isVerified !== null && isVerified !== '') {
      const v = isVerified === 'true' || isVerified === true || isVerified === '1' || isVerified === 1;
      sql += ' AND is_verified = ?';
      params.push(v ? 1 : 0);
    }

    // Viewport Bounding Box Filtering
    if (minLat !== undefined && maxLat !== undefined && minLng !== undefined && maxLng !== undefined) {
      const pMinLat = parseFloat(minLat);
      const pMaxLat = parseFloat(maxLat);
      const pMinLng = parseFloat(minLng);
      const pMaxLng = parseFloat(maxLng);

      if (
        !isNaN(pMinLat) && !isNaN(pMaxLat) &&
        !isNaN(pMinLng) && !isNaN(pMaxLng)
      ) {
        sql += ' AND latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ?';
        params.push(pMinLat, pMaxLat, pMinLng, pMaxLng);
      }
    }

    // Category / Danger Type Filtering
    const catFilter = category || type;
    if (catFilter) {
      const normCat = SafetyValidationService.normalizeCategory(catFilter);
      sql += ' AND (category = ? OR danger_type = ? OR crime_type = ?)';
      params.push(normCat, normCat, normCat);
    }

    // Severity Filtering
    if (severity) {
      const normSev = SafetyValidationService.normalizeSeverity(severity);
      sql += ' AND severity = ?';
      params.push(normSev);
    }

    // Country Filtering
    if (country) {
      sql += ' AND country = ?';
      params.push(country);
    }

    // Source Filtering
    if (source) {
      sql += ' AND source LIKE ?';
      params.push(`%${source}%`);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10) || 200, parseInt(offset, 10) || 0);

    let rows = [];
    try {
      rows = await executeQuery(sql, params);
    } catch (err) {
      rows = [];
    }

    let combined = [...(rows || [])];
    let list = [...(inMemoryStore.danger_zones || [])];

    if (!showAll) {
      list = list.filter(z => z.is_active === 1 || z.is_active === true);
    }
    if (minLat !== undefined && maxLat !== undefined && minLng !== undefined && maxLng !== undefined) {
      const pMinLat = parseFloat(minLat);
      const pMaxLat = parseFloat(maxLat);
      const pMinLng = parseFloat(minLng);
      const pMaxLng = parseFloat(maxLng);
      list = list.filter(z => z.latitude >= pMinLat && z.latitude <= pMaxLat && z.longitude >= pMinLng && z.longitude <= pMaxLng);
    }
    if (catFilter) {
      const norm = SafetyValidationService.normalizeCategory(catFilter);
      list = list.filter(z => z.category === norm || z.danger_type === norm || z.crime_type === norm);
    }

    for (const memZone of list) {
      if (!combined.some(r => r.id === memZone.id || (memZone.zone_code && r.zone_code === memZone.zone_code))) {
        combined.push(memZone);
      }
    }

    return combined.slice(offset, offset + limit);
  }

  /**
   * Get single zone by ID
   */
  static async getZoneById(id) {
    try {
      const rows = await executeQuery('SELECT * FROM danger_zones WHERE id = ?', [id]);
      if (rows && rows.length > 0) return rows[0];
    } catch {}
    return (inMemoryStore.danger_zones || []).find(z => z.id === parseInt(id, 10)) || null;
  }

  /**
   * Create new safety zone
   */
  static async createZone(data) {
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);

    const geomValidation = SafetyValidationService.validateGeometry(
      data.geometry_type || data.geometryType || 'circle',
      data.radius_meters || data.radiusMeters || data.radius || 500,
      data.polygon_coordinates || data.polygonCoordinates
    );

    if (!geomValidation.valid) {
      throw new Error(geomValidation.error);
    }

    const category = SafetyValidationService.normalizeCategory(data.category || data.danger_type || data.dangerType);
    const severity = SafetyValidationService.normalizeSeverity(data.severity);
    const zoneCode = data.zone_code || `DZ-${Date.now().toString().slice(-6)}`;
    const source = data.source || 'Admin Curated';
    const confidence = SafetyValidationService.assignConfidence(source, data.is_verified ?? true);

    const radiusMeters = geomValidation.radiusMeters || 500;
    const warningDist = parseInt(data.warning_distance_meters || data.warningDistanceMeters || data.warningDistance || 200, 10);
    const polygonCoordsJson = geomValidation.polygonCoordinates ? JSON.stringify(geomValidation.polygonCoordinates) : null;

    const instructions = data.safety_instructions || data.advisory_message || data.precautions || 'Exercise high vigilance and secure personal valuables.';
    const action = data.recommended_action || data.safe_alternatives || 'Move toward a safer well-lit public area.';

    const sql = `
      INSERT INTO danger_zones (
        zone_code, name, description, category, danger_type, severity, geometry_type,
        latitude, longitude, radius_meters, warning_distance_meters, polygon_coordinates,
        safety_instructions, recommended_action, network_status, source, source_url,
        confidence, status, is_verified, country, state, city, expires_at, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      zoneCode,
      data.name || 'Hazard Zone',
      data.description || '',
      category,
      category,
      severity,
      geomValidation.geometryType,
      lat,
      lng,
      radiusMeters,
      warningDist,
      polygonCoordsJson,
      instructions,
      action,
      data.network_status || 'available',
      source,
      data.source_url || null,
      confidence,
      data.status || 'active',
      data.is_verified !== undefined ? (data.is_verified ? 1 : 0) : 1,
      data.country || null,
      data.state || null,
      data.city || null,
      data.expires_at || null,
      1
    ];

    const newZone = {
      zone_code: zoneCode,
      name: data.name || 'Hazard Zone',
      description: data.description || '',
      category,
      danger_type: category,
      severity,
      geometry_type: geomValidation.geometryType,
      latitude: lat,
      longitude: lng,
      radius_meters: radiusMeters,
      warning_distance_meters: warningDist,
      polygon_coordinates: polygonCoordsJson,
      safety_instructions: instructions,
      recommended_action: action,
      network_status: data.network_status || 'available',
      source,
      source_url: data.source_url || null,
      confidence,
      status: data.status || 'active',
      is_verified: 1,
      country: data.country || null,
      state: data.state || null,
      city: data.city || null,
      expires_at: data.expires_at || null,
      is_active: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const result = await executeQuery(sql, params);
      newZone.id = result.insertId || ((inMemoryStore.danger_zones || []).length + 1);
    } catch {
      newZone.id = (inMemoryStore.danger_zones || []).length + 1;
    }
    if (!inMemoryStore.danger_zones) inMemoryStore.danger_zones = [];
    inMemoryStore.danger_zones.unshift(newZone);

    return newZone;
  }

  /**
   * Update existing safety zone
   */
  static async updateZone(id, data) {
    const existing = await this.getZoneById(id);
    if (!existing) return null;

    const lat = data.latitude !== undefined ? parseFloat(data.latitude) : existing.latitude;
    const lng = data.longitude !== undefined ? parseFloat(data.longitude) : existing.longitude;
    const radiusMeters = parseInt(data.radius_meters || data.radiusMeters || data.radius || existing.radius_meters || 500, 10);
    const warningDist = parseInt(data.warning_distance_meters || data.warningDistanceMeters || existing.warning_distance_meters || 200, 10);
    const category = data.category || data.danger_type || data.dangerType ? SafetyValidationService.normalizeCategory(data.category || data.danger_type || data.dangerType) : (existing.category || existing.danger_type || 'OTHER');
    const severity = data.severity ? SafetyValidationService.normalizeSeverity(data.severity) : existing.severity;
    const instructions = data.safety_instructions || data.advisory_message || existing.safety_instructions || existing.advisory_message || '';
    const action = data.recommended_action || existing.recommended_action || '';
    const name = data.name || existing.name;
    const description = data.description !== undefined ? data.description : existing.description;
    const geomType = data.geometry_type || data.geometryType || existing.geometry_type || 'circle';

    let polyCoordsJson = existing.polygon_coordinates;
    if (data.polygon_coordinates !== undefined) {
      polyCoordsJson = typeof data.polygon_coordinates === 'string' ? data.polygon_coordinates : JSON.stringify(data.polygon_coordinates);
    }

    const sql = `
      UPDATE danger_zones SET
        name = ?, description = ?, category = ?, danger_type = ?, severity = ?,
        geometry_type = ?, latitude = ?, longitude = ?, radius_meters = ?,
        warning_distance_meters = ?, polygon_coordinates = ?, safety_instructions = ?,
        recommended_action = ?, network_status = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const params = [
      name,
      description,
      category,
      category,
      severity,
      geomType,
      lat,
      lng,
      radiusMeters,
      warningDist,
      polyCoordsJson,
      instructions,
      action,
      data.network_status || existing.network_status || 'available',
      id
    ];

    try {
      await executeQuery(sql, params);
      return await this.getZoneById(id);
    } catch {
      const idx = inMemoryStore.danger_zones.findIndex(z => z.id === parseInt(id, 10));
      if (idx !== -1) {
        inMemoryStore.danger_zones[idx] = {
          ...inMemoryStore.danger_zones[idx],
          name,
          description,
          category,
          danger_type: category,
          severity,
          geometry_type: geomType,
          latitude: lat,
          longitude: lng,
          radius_meters: radiusMeters,
          warning_distance_meters: warningDist,
          polygon_coordinates: polyCoordsJson,
          safety_instructions: instructions,
          recommended_action: action,
          updated_at: new Date().toISOString()
        };
        return inMemoryStore.danger_zones[idx];
      }
      return null;
    }
  }

  /**
   * Evaluate Geofence Containment for Tourist Location
   * Supports both Circle radius & Polygon point-in-polygon & boundary distance
   */
  static evaluateZoneContainment(touristLat, touristLng, zone) {
    return GeofenceEngine.getZoneState(touristLat, touristLng, zone);
  }

  /**
   * Route Safety Analysis with Transparent Contributing Factors & Route-Polygon Intersection
   */
  static async analyzeRouteSafety(routeCoordinates) {
    if (!Array.isArray(routeCoordinates) || routeCoordinates.length === 0) {
      throw new Error('routeCoordinates array is required for safety analysis.');
    }

    const zones = await this.getZones({ showAll: false, limit: 1000 });
    const warnings = [];
    const matchedZoneIds = new Set();

    // 1. Waypoint point-in-zone evaluation
    for (const point of routeCoordinates) {
      const ptLat = parseFloat(point.lat ?? point[0]);
      const ptLng = parseFloat(point.lng ?? point[1]);

      if (!SafetyValidationService.isValidCoord(ptLat, ptLng)) continue;

      for (const zone of zones) {
        if (matchedZoneIds.has(zone.id)) continue;

        const containment = this.evaluateZoneContainment(ptLat, ptLng, zone);

        if (containment.state === 'INSIDE') {
          matchedZoneIds.add(zone.id);
          warnings.push({
            id: zone.id,
            zone_code: zone.zone_code,
            name: zone.name,
            category: zone.category || zone.danger_type,
            danger_type: zone.danger_type,
            severity: zone.severity,
            source: zone.source,
            confidence: zone.confidence,
            description: zone.description,
            safety_instructions: zone.safety_instructions,
            distanceMeters: containment.distanceMeters,
            type: 'INTERSECTING',
            reason: `Direct intersection with ${zone.severity} risk ${zone.category || zone.danger_type} zone: ${zone.name} (Source: ${zone.source})`
          });
        } else if (containment.state === 'APPROACHING') {
          matchedZoneIds.add(zone.id);
          warnings.push({
            id: zone.id,
            zone_code: zone.zone_code,
            name: zone.name,
            category: zone.category || zone.danger_type,
            danger_type: zone.danger_type,
            severity: zone.severity,
            source: zone.source,
            confidence: zone.confidence,
            description: zone.description,
            safety_instructions: zone.safety_instructions,
            distanceMeters: containment.distanceMeters,
            type: 'NEAR_ROUTE',
            reason: `Proximity warning: ${zone.name} located ~${containment.distanceMeters}m from route path (Source: ${zone.source})`
          });
        }
      }
    }

    // 2. Segment-to-Polygon Intersection check (catches routes cutting through polygons even if endpoints are outside)
    if (routeCoordinates.length >= 2) {
      for (let i = 0; i < routeCoordinates.length - 1; i++) {
        const p1 = { lat: parseFloat(routeCoordinates[i].lat ?? routeCoordinates[i][0]), lng: parseFloat(routeCoordinates[i].lng ?? routeCoordinates[i][1]) };
        const p2 = { lat: parseFloat(routeCoordinates[i + 1].lat ?? routeCoordinates[i + 1][0]), lng: parseFloat(routeCoordinates[i + 1].lng ?? routeCoordinates[i + 1][1]) };

        if (!SafetyValidationService.isValidCoord(p1.lat, p1.lng) || !SafetyValidationService.isValidCoord(p2.lat, p2.lng)) continue;

        for (const zone of zones) {
          if (matchedZoneIds.has(zone.id)) continue;

          if ((zone.geometry_type || '').toLowerCase() === 'polygon' && zone.polygon_coordinates) {
            const polyCoords = GeofenceEngine.normalizePolygonCoordinates(zone.polygon_coordinates);
            if (polyCoords && polyCoords.length >= 3) {
              if (GeofenceEngine.doesRouteSegmentIntersectPolygon(p1, p2, polyCoords)) {
                matchedZoneIds.add(zone.id);
                warnings.push({
                  id: zone.id,
                  zone_code: zone.zone_code,
                  name: zone.name,
                  category: zone.category || zone.danger_type,
                  danger_type: zone.danger_type,
                  severity: zone.severity,
                  source: zone.source,
                  confidence: zone.confidence,
                  description: zone.description,
                  safety_instructions: zone.safety_instructions,
                  distanceMeters: 0,
                  type: 'INTERSECTING',
                  reason: `Route path segment intersects polygon hazard zone: ${zone.name} (Source: ${zone.source})`
                });
              }
            }
          }
        }
      }
    }

    // Transparent, contributing-factor based score calculation
    let safetyScore = 100;
    const contributingFactors = [];

    warnings.forEach(w => {
      let deduction = 0;
      if (w.type === 'INTERSECTING') {
        deduction = w.severity === 'critical' ? 30 : w.severity === 'high' ? 20 : 10;
      } else {
        deduction = w.severity === 'critical' ? 15 : w.severity === 'high' ? 10 : 5;
      }
      safetyScore = Math.max(10, safetyScore - deduction);
      contributingFactors.push(`-${deduction} pts: ${w.reason}`);
    });

    let safetyStatus = 'Verified Safe Route';
    let safetyColor = 'Green';

    if (safetyScore < 50) {
      safetyStatus = 'Dangerous Route — Multiple Active Hazards';
      safetyColor = 'Red';
    } else if (safetyScore < 85) {
      safetyStatus = 'Caution Advisable — Near Hazard Perimeters';
      safetyColor = 'Orange';
    }

    return {
      safetyScore,
      safetyStatus,
      safetyColor,
      warningsCount: warnings.length,
      contributingFactors,
      warnings
    };
  }
}

module.exports = SafetyDataService;
