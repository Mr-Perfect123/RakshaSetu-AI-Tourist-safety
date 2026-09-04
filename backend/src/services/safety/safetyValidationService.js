/**
 * Safety Validation & Geometry Normalization Service
 * Ensures rigorous validation of coordinates, geometries, categories, severities, confidence, and deduplication.
 */

// Supported Safety Categories
const SUPPORTED_CATEGORIES = [
  'HIGH_CRIME',
  'THEFT',
  'NO_NETWORK',
  'WILDLIFE',
  'ACCIDENT_PRONE',
  'ROAD_HAZARD',
  'HILL_CURVE',
  'NATURAL_DISASTER',
  'FLOOD_RISK',
  'EARTHQUAKE',
  'LANDSLIDE_RISK',
  'FIRE_RISK',
  'CYCLONE_RISK',
  'EXTREME_WEATHER',
  'DANGEROUS_TERRAIN',
  'WATER_DANGER',
  'DROWNING_RISK',
  'POLICE_ALERT',
  'MEDICAL_RISK',
  'RIOT_OR_UNREST',
  'CONSTRUCTION_HAZARD',
  'RESTRICTED_AREA',
  'COMMUNITY_REPORT',
  'OTHER'
];

const SUPPORTED_SEVERITIES = ['low', 'moderate', 'high', 'critical'];

const GeofenceEngine = require('../../utils/geofence');

class SafetyValidationService {
  /**
   * Validate Numeric Coordinates
   */
  static isValidCoord(lat, lng) {
    return GeofenceEngine.isValidCoord(lat, lng);
  }

  /**
   * Validate Geometry (Circle or Polygon)
   */
  static validateGeometry(geometryType = 'circle', radiusMeters = 500, polygonCoordinates = null) {
    const geomType = (geometryType || 'circle').toLowerCase();
    if (geomType === 'polygon') {
      const coords = GeofenceEngine.normalizePolygonCoordinates(polygonCoordinates);
      if (!coords || coords.length < 3) {
        return { valid: false, error: 'Polygon must have at least 3 valid coordinate points.' };
      }
      return { valid: true, geometryType: 'polygon', polygonCoordinates: coords };
    }

    // Circle validation
    const r = parseInt(radiusMeters, 10);
    if (isNaN(r) || r <= 0 || r > 100000) {
      return { valid: false, error: 'Circle radius must be a positive number up to 100,000 meters.' };
    }
    return { valid: true, geometryType: 'circle', radiusMeters: r };
  }

  /**
   * Normalize Safety Category
   */
  static normalizeCategory(category) {
    if (!category) return 'OTHER';
    const upper = String(category).trim().toUpperCase().replace(/[\s-]+/g, '_');
    if (SUPPORTED_CATEGORIES.includes(upper)) return upper;

    // Fuzzy mapping
    if (upper.includes('THEFT') || upper.includes('PICKPOCKET')) return 'THEFT';
    if (upper.includes('CRIME')) return 'HIGH_CRIME';
    if (upper.includes('NETWORK') || upper.includes('SIGNAL')) return 'NO_NETWORK';
    if (upper.includes('WILDLIFE') || upper.includes('ANIMAL')) return 'WILDLIFE';
    if (upper.includes('ACCIDENT')) return 'ACCIDENT_PRONE';
    if (upper.includes('FLOOD')) return 'FLOOD_RISK';
    if (upper.includes('EARTHQUAKE') || upper.includes('SEISMIC')) return 'EARTHQUAKE';
    if (upper.includes('LANDSLIDE') || upper.includes('ROCKFALL')) return 'LANDSLIDE_RISK';
    if (upper.includes('FIRE') || upper.includes('WILDFIRE')) return 'FIRE_RISK';
    if (upper.includes('CYCLONE') || upper.includes('TYPHOON') || upper.includes('HURRICANE')) return 'CYCLONE_RISK';
    if (upper.includes('WATER') || upper.includes('DROWN')) return 'DROWNING_RISK';
    if (upper.includes('COMMUNITY')) return 'COMMUNITY_REPORT';

    return 'OTHER';
  }

  /**
   * Normalize Severity
   */
  static normalizeSeverity(severity) {
    if (!severity) return 'high';
    const lower = String(severity).trim().toLowerCase();
    if (SUPPORTED_SEVERITIES.includes(lower)) return lower;
    if (lower === 'med' || lower === 'medium') return 'moderate';
    if (lower === 'danger' || lower === 'emergency') return 'critical';
    return 'high';
  }

  /**
   * Assign Meaningful Confidence based on Data Provenance
   */
  static assignConfidence(source, isVerified = true, externalId = null) {
    const src = String(source || '').toLowerCase();
    if (!isVerified) return 'UNVERIFIED';

    if (src.includes('usgs') || src.includes('gdacs') || src.includes('geological') || src.includes('imd') || src.includes('police')) {
      return 'VERY_HIGH';
    }
    if (src.includes('forest') || src.includes('disaster') || src.includes('lifesaver') || src.includes('official') || src.includes('government')) {
      return 'HIGH';
    }
    if (src.includes('verified community') || src.includes('community report')) {
      return 'MEDIUM';
    }
    if (src.includes('curated') || src.includes('desk')) {
      return 'HIGH';
    }
    return 'MEDIUM';
  }

  /**
   * Haversine Distance Calculation (in meters)
   */
  static calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    return GeofenceEngine.calculateDistanceMeters(lat1, lon1, lat2, lon2);
  }

  /**
   * Ray-Casting Point-in-Polygon containment algorithm
   */
  static isPointInPolygon(point, polygon) {
    return GeofenceEngine.isPointInPolygon(point, polygon);
  }

  /**
   * Check if zone is a duplicate of existing zones
   */
  static isDuplicate(newZone, existingZones = []) {
    if (!Array.isArray(existingZones) || existingZones.length === 0) return false;

    // 1. Exact zone_code or external ID match
    if (newZone.zone_code) {
      const matchCode = existingZones.find(z => z.zone_code === newZone.zone_code);
      if (matchCode) return matchCode;
    }

    // 2. Incident ID match
    if (newZone.incident_id) {
      const matchInc = existingZones.find(z => z.incident_id === newZone.incident_id);
      if (matchInc) return matchInc;
    }

    // 3. Close proximity + same category + same source
    const nLat = parseFloat(newZone.latitude);
    const nLng = parseFloat(newZone.longitude);
    const nCat = this.normalizeCategory(newZone.category || newZone.danger_type);

    for (const z of existingZones) {
      const zLat = parseFloat(z.latitude);
      const zLng = parseFloat(z.longitude);
      const zCat = this.normalizeCategory(z.category || z.danger_type);

      if (nCat === zCat && (z.source === newZone.source || (z.name && z.name === newZone.name))) {
        const dist = this.calculateDistanceMeters(nLat, nLng, zLat, zLng);
        const radius = Math.max(z.radius_meters || 500, newZone.radius_meters || 500);
        if (dist < radius * 0.5) {
          return z; // Likely duplicate event
        }
      }
    }

    return false;
  }
}

module.exports = SafetyValidationService;
