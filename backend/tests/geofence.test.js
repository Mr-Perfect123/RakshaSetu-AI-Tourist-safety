const GeofenceEngine = require('../src/utils/geofence');

describe('GeofenceEngine Unit Tests', () => {
  describe('Coordinate Validation', () => {
    test('validates numeric coordinates in [-90,90] and [-180,180]', () => {
      expect(GeofenceEngine.isValidCoord(11.0, 76.9)).toBe(true);
      expect(GeofenceEngine.isValidCoord(-90, 180)).toBe(true);
      expect(GeofenceEngine.isValidCoord(95, 76.9)).toBe(false);
      expect(GeofenceEngine.isValidCoord(11.0, 185)).toBe(false);
      expect(GeofenceEngine.isValidCoord('abc', 76.9)).toBe(false);
      expect(GeofenceEngine.isValidCoord(0, 0)).toBe(false);
    });
  });

  describe('Circle Geofencing', () => {
    const centerZone = {
      geometry_type: 'circle',
      latitude: 11.0000,
      longitude: 76.9500,
      radius_meters: 500,
      warning_distance_meters: 200
    };

    test('1. point inside circle', () => {
      const res = GeofenceEngine.getZoneState([11.0010, 76.9505], centerZone);
      expect(res.state).toBe('INSIDE');
    });

    test('2. point outside circle', () => {
      const res = GeofenceEngine.getZoneState([11.0100, 76.9600], centerZone);
      expect(res.state).toBe('OUTSIDE');
    });

    test('3. point exactly on boundary', () => {
      // ~500m north is approx +0.0045 deg lat
      const latOnEdge = 11.0000 + (500 / 111320);
      const res = GeofenceEngine.getZoneState([latOnEdge, 76.9500], centerZone);
      expect(['INSIDE', 'APPROACHING']).toContain(res.state);
    });

    test('4. point near circle (approaching)', () => {
      const latNear = 11.0000 + (600 / 111320);
      const res = GeofenceEngine.getZoneState([latNear, 76.9500], centerZone);
      expect(res.state).toBe('APPROACHING');
    });

    test('5. invalid radius defaults safely', () => {
      const badZone = { geometry_type: 'circle', latitude: 11.0, longitude: 76.9, radius_meters: 'invalid' };
      const res = GeofenceEngine.getZoneState([11.001, 76.901], badZone);
      expect(res.state).toBe('INSIDE');
    });
  });

  describe('Polygon Geofencing & Ray-Casting', () => {
    // Standard square: (11.0000, 76.9500) to (11.0100, 76.9600)
    const squarePoly = [
      [11.0000, 76.9500],
      [11.0100, 76.9500],
      [11.0100, 76.9600],
      [11.0000, 76.9600]
    ];

    const polyZone = {
      geometry_type: 'polygon',
      latitude: 11.0050,
      longitude: 76.9550,
      polygon_coordinates: squarePoly,
      warning_distance_meters: 200
    };

    test('1. point inside triangle', () => {
      const trianglePoly = [
        [11.0000, 76.9500],
        [11.0100, 76.9500],
        [11.0050, 76.9600]
      ];
      expect(GeofenceEngine.isPointInPolygon([11.0050, 76.9520], trianglePoly)).toBe(true);
    });

    test('2. point outside triangle', () => {
      const trianglePoly = [
        [11.0000, 76.9500],
        [11.0100, 76.9500],
        [11.0050, 76.9600]
      ];
      expect(GeofenceEngine.isPointInPolygon([11.0200, 76.9700], trianglePoly)).toBe(false);
    });

    test('3. point inside rectangle', () => {
      expect(GeofenceEngine.isPointInPolygon([11.0050, 76.9550], squarePoly)).toBe(true);
      const res = GeofenceEngine.getZoneState([11.0050, 76.9550], polyZone);
      expect(res.state).toBe('INSIDE');
    });

    test('4. point outside rectangle', () => {
      expect(GeofenceEngine.isPointInPolygon([11.0200, 76.9700], squarePoly)).toBe(false);
      const res = GeofenceEngine.getZoneState([11.0200, 76.9700], polyZone);
      expect(res.state).toBe('OUTSIDE');
    });

    test('5. point on polygon edge', () => {
      expect(GeofenceEngine.isPointInPolygon([11.0050, 76.9500], squarePoly)).toBe(true);
    });

    test('6. point on polygon vertex', () => {
      expect(GeofenceEngine.isPointInPolygon([11.0000, 76.9500], squarePoly)).toBe(true);
    });

    test('7. concave polygon containment', () => {
      // L-shaped concave polygon
      const concavePoly = [
        [11.0000, 76.9500],
        [11.0200, 76.9500],
        [11.0200, 76.9600],
        [11.0100, 76.9600],
        [11.0100, 76.9700],
        [11.0000, 76.9700]
      ];
      // Inside L
      expect(GeofenceEngine.isPointInPolygon([11.0050, 76.9650], concavePoly)).toBe(true);
      // In hollow cutout region (outside L)
      expect(GeofenceEngine.isPointInPolygon([11.0150, 76.9650], concavePoly)).toBe(false);
    });

    test('8. clockwise polygon', () => {
      const cwPoly = [
        [11.0000, 76.9500],
        [11.0100, 76.9500],
        [11.0100, 76.9600],
        [11.0000, 76.9600]
      ];
      expect(GeofenceEngine.isPointInPolygon([11.0050, 76.9550], cwPoly)).toBe(true);
    });

    test('9. counter-clockwise polygon', () => {
      const ccwPoly = [
        [11.0000, 76.9500],
        [11.0000, 76.9600],
        [11.0100, 76.9600],
        [11.0100, 76.9500]
      ];
      expect(GeofenceEngine.isPointInPolygon([11.0050, 76.9550], ccwPoly)).toBe(true);
    });

    test('10. malformed polygon handled gracefully without crash', () => {
      expect(GeofenceEngine.isPointInPolygon([11.0, 76.9], 'invalid')).toBe(false);
      expect(GeofenceEngine.isPointInPolygon([11.0, 76.9], [[11.0, 76.9]])).toBe(false);
      expect(GeofenceEngine.isPointInPolygon([11.0, 76.9], null)).toBe(false);
    });

    test('11. minimum 3-point polygon', () => {
      const tri = [[11.0, 76.9], [11.01, 76.9], [11.0, 76.91]];
      const norm = GeofenceEngine.normalizePolygonCoordinates(tri);
      expect(norm.length).toBe(4); // Closed
    });

    test('12. polygon with closing coordinate', () => {
      const closed = [[11.0, 76.9], [11.01, 76.9], [11.0, 76.91], [11.0, 76.9]];
      const norm = GeofenceEngine.normalizePolygonCoordinates(closed);
      expect(norm.length).toBe(4);
    });

    test('13. polygon without closing coordinate', () => {
      const unclosed = [[11.0, 76.9], [11.01, 76.9], [11.0, 76.91]];
      const norm = GeofenceEngine.normalizePolygonCoordinates(unclosed);
      expect(norm[0]).toEqual(norm[norm.length - 1]);
    });

    test('14. latitude/longitude order handling', () => {
      const geoJsonStyle = [{ lat: 11.0, lng: 76.9 }, { lat: 11.01, lng: 76.9 }, { lat: 11.005, lng: 76.91 }];
      expect(GeofenceEngine.isPointInPolygon([11.005, 76.902], geoJsonStyle)).toBe(true);
    });
  });

  describe('Polygon Boundary Distance & Approaching Logic', () => {
    const squarePoly = [
      [11.0000, 76.9500],
      [11.0100, 76.9500],
      [11.0100, 76.9600],
      [11.0000, 76.9600]
    ];

    const polyZone = {
      geometry_type: 'polygon',
      latitude: 11.0050,
      longitude: 76.9550,
      polygon_coordinates: squarePoly,
      warning_distance_meters: 200
    };

    test('approaching polygon uses nearest boundary edge, not center', () => {
      // Point 50 meters outside western edge [11.0050, 76.9500]
      const nearWestEdge = [11.0050, 76.9496];
      const res = GeofenceEngine.getZoneState(nearWestEdge, polyZone);
      expect(res.state).toBe('APPROACHING');
      expect(res.distanceMeters).toBeLessThan(100);
    });
  });

  describe('Route Segment Intersection with Polygon', () => {
    const squarePoly = [
      [11.0000, 76.9500],
      [11.0100, 76.9500],
      [11.0100, 76.9600],
      [11.0000, 76.9600]
    ];

    test('catches route segment cutting through polygon even if endpoints are outside', () => {
      const p1 = { lat: 11.0050, lng: 76.9400 }; // Outside west
      const p2 = { lat: 11.0050, lng: 76.9700 }; // Outside east
      expect(GeofenceEngine.doesRouteSegmentIntersectPolygon(p1, p2, squarePoly)).toBe(true);
    });

    test('returns false for route completely outside polygon', () => {
      const p1 = { lat: 11.0200, lng: 76.9400 };
      const p2 = { lat: 11.0200, lng: 76.9700 };
      expect(GeofenceEngine.doesRouteSegmentIntersectPolygon(p1, p2, squarePoly)).toBe(false);
    });
  });
});
