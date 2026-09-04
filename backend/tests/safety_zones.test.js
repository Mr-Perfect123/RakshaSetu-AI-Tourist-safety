/**
 * Dynamic Safety Zones Comprehensive Test Suite
 */

const SafetyValidationService = require('../src/services/safety/safetyValidationService');
const SafetyDataService = require('../src/services/safety/safetyDataService');
const CommunitySafetyService = require('../src/services/safety/communitySafetyService');
const UsgsService = require('../src/services/safety/usgsService');
const GdacsService = require('../src/services/safety/gdacsService');
const { inMemoryStore } = require('../src/config/database');

describe('Dynamic Safety Zones Data & Ingestion System', () => {

  beforeEach(() => {
    inMemoryStore.danger_zones = [];
  });

  describe('1. Coordinate & Geometry Validation', () => {
    test('rejects invalid coordinates and zero-zero', () => {
      expect(SafetyValidationService.isValidCoord(95, 77)).toBe(false);
      expect(SafetyValidationService.isValidCoord(28, 195)).toBe(false);
      expect(SafetyValidationService.isValidCoord('abc', 'xyz')).toBe(false);
      expect(SafetyValidationService.isValidCoord(0, 0)).toBe(false);
      expect(SafetyValidationService.isValidCoord(28.6139, 77.2090)).toBe(true);
    });

    test('validates circular and polygon geometries', () => {
      const circleValid = SafetyValidationService.validateGeometry('circle', 500, null);
      expect(circleValid.valid).toBe(true);
      expect(circleValid.geometryType).toBe('circle');

      const circleInvalid = SafetyValidationService.validateGeometry('circle', -10, null);
      expect(circleInvalid.valid).toBe(false);

      const validPolygon = [[11.0, 76.9], [11.1, 76.9], [11.1, 77.0], [11.0, 77.0]];
      const polyValid = SafetyValidationService.validateGeometry('polygon', 0, validPolygon);
      expect(polyValid.valid).toBe(true);
      expect(polyValid.geometryType).toBe('polygon');

      const polyInvalid = SafetyValidationService.validateGeometry('polygon', 0, [[11.0, 76.9]]);
      expect(polyInvalid.valid).toBe(false);
    });
  });

  describe('2. Category & Confidence Provenance', () => {
    test('normalizes categories and assigns proper confidence', () => {
      expect(SafetyValidationService.normalizeCategory('theft')).toBe('THEFT');
      expect(SafetyValidationService.normalizeCategory('earthquake-risk')).toBe('EARTHQUAKE');
      expect(SafetyValidationService.normalizeCategory('flood_alert')).toBe('FLOOD_RISK');

      expect(SafetyValidationService.assignConfidence('United States Geological Survey (USGS)', true)).toBe('VERY_HIGH');
      expect(SafetyValidationService.assignConfidence('Global Disaster Alert & Coordination System (GDACS)', true)).toBe('VERY_HIGH');
      expect(SafetyValidationService.assignConfidence('Verified Community Report', true)).toBe('MEDIUM');
      expect(SafetyValidationService.assignConfidence('Random Public Source', false)).toBe('UNVERIFIED');
    });
  });

  describe('3. Geofencing: Point-in-Polygon & Haversine Distance', () => {
    test('point-in-polygon correctly identifies points inside and outside polygon', () => {
      // Square polygon in Coimbatore around [11.0, 76.9] to [11.1, 77.0]
      const polygon = [
        [11.0, 76.9],
        [11.1, 76.9],
        [11.1, 77.0],
        [11.0, 77.0]
      ];

      const insidePoint = { lat: 11.05, lng: 76.95 };
      const outsidePoint = { lat: 11.25, lng: 77.15 };

      expect(SafetyValidationService.isPointInPolygon(insidePoint, polygon)).toBe(true);
      expect(SafetyValidationService.isPointInPolygon(outsidePoint, polygon)).toBe(false);
    });

    test('evaluates zone containment correctly for circles and polygons', () => {
      const circleZone = {
        id: 1,
        geometry_type: 'circle',
        latitude: 11.0168,
        longitude: 76.9558,
        radius_meters: 500,
        warning_distance_meters: 200
      };

      // Inside circle
      const resInside = SafetyDataService.evaluateZoneContainment(11.0168, 76.9558, circleZone);
      expect(resInside.state).toBe('INSIDE');

      // Far outside
      const resOutside = SafetyDataService.evaluateZoneContainment(12.9716, 77.5946, circleZone);
      expect(resOutside.state).toBe('OUTSIDE');
    });
  });

  describe('4. Deduplication Logic', () => {
    test('detects duplicate zones by zone_code, incident_id, and proximity', () => {
      const existing = [
        {
          id: 1,
          zone_code: 'USGS-eq101',
          incident_id: null,
          category: 'EARTHQUAKE',
          latitude: 28.6139,
          longitude: 77.2090,
          radius_meters: 5000,
          source: 'USGS'
        }
      ];

      const dupCode = { zone_code: 'USGS-eq101', latitude: 28.6, longitude: 77.2 };
      expect(SafetyValidationService.isDuplicate(dupCode, existing)).toBeTruthy();

      const nonDup = { zone_code: 'USGS-eq999', latitude: 12.97, longitude: 77.59, category: 'EARTHQUAKE', source: 'USGS' };
      expect(SafetyValidationService.isDuplicate(nonDup, existing)).toBeFalsy();
    });
  });

  describe('5. Community Incident to Safety Zone Creation', () => {
    test('creates a verified safety zone when admin verifies incident report', async () => {
      const incident = {
        id: 42,
        user_id: 10,
        category: 'THEFT',
        severity: 'high',
        title: 'Bag snatching at bus station',
        description: 'Two motorbikers grabbed handbag',
        latitude: 11.0017,
        longitude: 76.9629,
        location_name: 'Coimbatore Bus Station'
      };

      const result = await CommunitySafetyService.createZoneFromIncident(incident, 1);
      expect(result.created).toBe(true);
      expect(result.zone.source).toBe('Verified Community Report');
      expect(result.zone.incident_id).toBe(42);
      expect(result.zone.is_verified).toBe(true);
      expect(result.zone.confidence).toBe('HIGH');
    });
  });

  describe('6. Viewport Query Filtering', () => {
    test('filters zones strictly within bounding box', async () => {
      await SafetyDataService.createZone({
        name: 'Delhi Zone',
        latitude: 28.6139,
        longitude: 77.2090,
        category: 'THEFT',
        severity: 'high'
      });

      await SafetyDataService.createZone({
        name: 'Coimbatore Zone',
        latitude: 11.0168,
        longitude: 76.9558,
        category: 'ACCIDENT_PRONE',
        severity: 'moderate'
      });

      // Query bounding box for South India only (lat 8..15, lng 75..80)
      const southZones = await SafetyDataService.getZones({
        minLat: 8.0,
        maxLat: 15.0,
        minLng: 75.0,
        maxLng: 80.0,
        showAll: true
      });

      expect(southZones.some(z => z.name === 'Coimbatore Zone')).toBe(true);
      expect(southZones.some(z => z.name === 'Delhi Zone')).toBe(false);
    });
  });

  describe('7. Explainable Route Safety Analysis', () => {
    test('provides exact contributing reasons when a route intersects hazard zones', async () => {
      await SafetyDataService.createZone({
        name: 'Hill Curve Landslide Zone',
        latitude: 11.0168,
        longitude: 76.9558,
        radius_meters: 1000,
        category: 'LANDSLIDE_RISK',
        severity: 'high',
        source: 'IMD Monitoring'
      });

      const route = [
        [11.0168, 76.9558], // directly on the zone
        [11.0200, 76.9600]
      ];

      const analysis = await SafetyDataService.analyzeRouteSafety(route);
      expect(analysis.warningsCount).toBeGreaterThan(0);
      expect(analysis.safetyScore).toBeLessThan(100);
      expect(analysis.contributingFactors.length).toBeGreaterThan(0);
      expect(analysis.contributingFactors[0]).toContain('Hill Curve Landslide Zone');
    });
  });
});
