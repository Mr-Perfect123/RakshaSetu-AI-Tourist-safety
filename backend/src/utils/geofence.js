/**
 * Unified Geofence Engine (Circle & Polygon)
 * Provides Ray-Casting Point-in-Polygon containment, Shortest Boundary-Edge Distance calculation,
 * Line Segment Intersection for Route Analysis, and Circle Haversine evaluation.
 */

class GeofenceEngine {
  /**
   * Validate Numeric Coordinates
   */
  static isValidCoord(lat, lng) {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    return (
      !isNaN(parsedLat) &&
      !isNaN(parsedLng) &&
      parsedLat >= -90 && parsedLat <= 90 &&
      parsedLng >= -180 && parsedLng <= 180 &&
      !(parsedLat === 0 && parsedLng === 0)
    );
  }

  /**
   * Haversine Distance Calculation (in meters)
   */
  static calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    const pLat1 = parseFloat(lat1);
    const pLon1 = parseFloat(lon1);
    const pLat2 = parseFloat(lat2);
    const pLon2 = parseFloat(lon2);

    if (!this.isValidCoord(pLat1, pLon1) || !this.isValidCoord(pLat2, pLon2)) return Infinity;
    if (pLat1 === pLat2 && pLon1 === pLon2) return 0;

    const R = 6371000; // Earth radius in meters
    const dLat = ((pLat2 - pLat1) * Math.PI) / 180;
    const dLon = ((pLon2 - pLon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pLat1 * Math.PI) / 180) * Math.cos((pLat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Normalize Polygon Coordinates array into standard [[lat, lng], ...] structure
   * Handles JSON strings, GeoJSON [lng, lat], objects {lat, lng}, and unclosed polygons.
   */
  static normalizePolygonCoordinates(input) {
    if (!input) return [];
    let coords = input;
    if (typeof coords === 'string') {
      try {
        coords = JSON.parse(coords);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(coords)) return [];

    const normalized = [];
    for (const pt of coords) {
      if (!pt) continue;
      let lat, lng;
      if (Array.isArray(pt)) {
        // Check if item looks like GeoJSON [lng, lat] vs standard [lat, lng]
        // In this application, standard coordinate arrays are [lat, lng]
        lat = parseFloat(pt[0]);
        lng = parseFloat(pt[1]);
      } else if (typeof pt === 'object') {
        lat = parseFloat(pt.lat ?? pt.latitude);
        lng = parseFloat(pt.lng ?? pt.longitude);
      }

      if (this.isValidCoord(lat, lng)) {
        normalized.push([lat, lng]);
      }
    }

    if (normalized.length < 3) return [];

    // Ensure polygon is closed (first point === last point) for boundary calculations
    const first = normalized[0];
    const last = normalized[normalized.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      normalized.push([first[0], first[1]]);
    }

    return normalized;
  }

  /**
   * Calculate Bounding Box of Polygon [minLat, maxLat, minLng, maxLng]
   */
  static getPolygonBoundingBox(polygonCoords) {
    if (!Array.isArray(polygonCoords) || polygonCoords.length === 0) {
      return null;
    }

    let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (const pt of polygonCoords) {
      const lat = pt[0];
      const lng = pt[1];
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
    return { minLat, maxLat, minLng, maxLng };
  }

  /**
   * Ray-Casting Point-in-Polygon Containment Algorithm
   */
  static isPointInPolygon(point, polygonInput) {
    const ptLat = parseFloat(point.lat ?? point.latitude ?? (Array.isArray(point) ? point[0] : NaN));
    const ptLng = parseFloat(point.lng ?? point.longitude ?? (Array.isArray(point) ? point[1] : NaN));

    if (!this.isValidCoord(ptLat, ptLng)) return false;

    const polygon = this.normalizePolygonCoordinates(polygonInput);
    if (polygon.length < 4) return false; // Closed polygon has at least 4 points (3 vertices + 1 closing point)

    // Quick bounding box pre-check for performance
    const bbox = this.getPolygonBoundingBox(polygon);
    if (bbox) {
      if (ptLat < bbox.minLat || ptLat > bbox.maxLat || ptLng < bbox.minLng || ptLng > bbox.maxLng) {
        return false;
      }
    }

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0], yi = polygon[i][1];
      const xj = polygon[j][0], yj = polygon[j][1];

      // Exact vertex check
      if (ptLat === xi && ptLng === yi) return true;

      // Exact edge check (collinear & within segment bounds)
      const onEdge = (
        (ptLat - xi) * (yj - yi) === (ptLng - yi) * (xj - xi) &&
        ptLat >= Math.min(xi, xj) && ptLat <= Math.max(xi, xj) &&
        ptLng >= Math.min(yi, yj) && ptLng <= Math.max(yi, yj)
      );
      if (onEdge) return true;

      // Ray-casting intersection formula
      const intersect = ((yi > ptLng) !== (yj > ptLng)) &&
        (ptLat < ((xj - xi) * (ptLng - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Shortest Distance from Point P to Line Segment AB (in meters)
   */
  static distanceToSegment(pLat, pLng, aLat, aLng, bLat, bLng) {
    // Convert to planar projection centered at P for local metric distance
    const dAB2 = (bLat - aLat) * (bLat - aLat) + (bLng - aLng) * (bLng - aLng);
    if (dAB2 === 0) {
      return this.calculateDistanceMeters(pLat, pLng, aLat, aLng);
    }

    // Projection parameter t
    let t = ((pLat - aLat) * (bLat - aLat) + (pLng - aLng) * (bLng - aLng)) / dAB2;
    t = Math.max(0, Math.min(1, t));

    const projLat = aLat + t * (bLat - aLat);
    const projLng = aLng + t * (bLng - aLng);

    return this.calculateDistanceMeters(pLat, pLng, projLat, projLng);
  }

  /**
   * Shortest Distance in Meters from Point P to the Nearest Polygon Boundary Edge
   */
  static distanceToPolygonBoundary(point, polygonInput) {
    const ptLat = parseFloat(point.lat ?? point.latitude ?? (Array.isArray(point) ? point[0] : NaN));
    const ptLng = parseFloat(point.lng ?? point.longitude ?? (Array.isArray(point) ? point[1] : NaN));

    if (!this.isValidCoord(ptLat, ptLng)) return Infinity;

    const polygon = this.normalizePolygonCoordinates(polygonInput);
    if (polygon.length < 4) return Infinity;

    let minDistance = Infinity;
    for (let i = 0; i < polygon.length - 1; i++) {
      const aLat = polygon[i][0], aLng = polygon[i][1];
      const bLat = polygon[i + 1][0], bLng = polygon[i + 1][1];

      const dist = this.distanceToSegment(ptLat, ptLng, aLat, aLng, bLat, bLng);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    return minDistance;
  }

  /**
   * Check if line segment AB intersects line segment CD
   */
  static doSegmentsIntersect(aLat, aLng, bLat, bLng, cLat, cLng, dLat, dLng) {
    const ccw = (p1Lat, p1Lng, p2Lat, p2Lng, p3Lat, p3Lng) => {
      return (p3Lng - p1Lng) * (p2Lat - p1Lat) > (p2Lng - p1Lng) * (p3Lat - p1Lat);
    };

    return (
      ccw(aLat, aLng, cLat, cLng, dLat, dLng) !== ccw(bLat, bLng, cLat, cLng, dLat, dLng) &&
      ccw(aLat, aLng, bLat, bLng, cLat, cLng) !== ccw(aLat, aLng, bLat, bLng, dLat, dLng)
    );
  }

  /**
   * Check if a route line segment intersects a polygon boundary or passes inside it
   */
  static doesRouteSegmentIntersectPolygon(segStart, segEnd, polygonInput) {
    const sLat = parseFloat(segStart.lat ?? segStart[0]);
    const sLng = parseFloat(segStart.lng ?? segStart[1]);
    const eLat = parseFloat(segEnd.lat ?? segEnd[0]);
    const eLng = parseFloat(segEnd.lng ?? segEnd[1]);

    const polygon = this.normalizePolygonCoordinates(polygonInput);
    if (polygon.length < 4) return false;

    // 1. Check if either endpoint is inside
    if (this.isPointInPolygon([sLat, sLng], polygon) || this.isPointInPolygon([eLat, eLng], polygon)) {
      return true;
    }

    // 2. Check if segment crosses any polygon edge
    for (let i = 0; i < polygon.length - 1; i++) {
      const aLat = polygon[i][0], aLng = polygon[i][1];
      const bLat = polygon[i + 1][0], bLng = polygon[i + 1][1];

      if (this.doSegmentsIntersect(sLat, sLng, eLat, eLng, aLat, aLng, bLat, bLng)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluate Zone State for a Tourist GPS Point against any Safety Zone (Circle or Polygon)
   * Supports signatures: getZoneState(lat, lng, zone) AND getZoneState(point, zone)
   * Returns: { state: 'INSIDE' | 'APPROACHING' | 'OUTSIDE', distanceMeters, distanceInside }
   */
  static getZoneState(arg1, arg2, arg3) {
    let ptLat, ptLng, zone;
    if (arg3 !== undefined) {
      ptLat = parseFloat(arg1);
      ptLng = parseFloat(arg2);
      zone = arg3;
    } else if (Array.isArray(arg1)) {
      ptLat = parseFloat(arg1[0]);
      ptLng = parseFloat(arg1[1]);
      zone = arg2;
    } else if (typeof arg1 === 'object' && arg1 !== null) {
      ptLat = parseFloat(arg1.lat ?? arg1.latitude);
      ptLng = parseFloat(arg1.lng ?? arg1.longitude);
      zone = arg2;
    } else {
      ptLat = parseFloat(arg1);
      ptLng = parseFloat(arg2);
      zone = arg3 || {};
    }

    if (!this.isValidCoord(ptLat, ptLng) || !zone) {
      return { state: 'OUTSIDE', distanceMeters: Infinity, distanceInside: 0 };
    }

    const warningDist = parseInt(zone.warning_distance_meters || zone.warningDistance || 200, 10);
    const geomType = (zone.geometry_type || zone.geometryType || 'circle').toLowerCase();

    // 1. POLYGON ZONE EVALUATION
    if (geomType === 'polygon' && zone.polygon_coordinates) {
      const polygon = this.normalizePolygonCoordinates(zone.polygon_coordinates);
      if (polygon.length >= 4) {
        const isInside = this.isPointInPolygon([ptLat, ptLng], polygon);
        const distToBoundary = this.distanceToPolygonBoundary([ptLat, ptLng], polygon);

        if (isInside) {
          return {
            state: 'INSIDE',
            distanceMeters: 0,
            distanceInside: Math.max(10, Math.round(distToBoundary))
          };
        } else if (distToBoundary <= warningDist) {
          return {
            state: 'APPROACHING',
            distanceMeters: Math.round(distToBoundary),
            distanceInside: 0
          };
        } else {
          return {
            state: 'OUTSIDE',
            distanceMeters: Math.round(distToBoundary),
            distanceInside: 0
          };
        }
      }
    }

    // 2. CIRCLE ZONE EVALUATION
    const zLat = parseFloat(zone.latitude);
    const zLng = parseFloat(zone.longitude);
    const distToCenter = this.calculateDistanceMeters(ptLat, ptLng, zLat, zLng);
    const rawRadius = parseInt(zone.radius_meters || zone.radius || 500, 10);
    const radius = isNaN(rawRadius) || rawRadius <= 0 ? 500 : rawRadius;

    if (distToCenter <= radius) {
      return {
        state: 'INSIDE',
        distanceMeters: Math.round(distToCenter),
        distanceInside: Math.max(10, Math.round(radius - distToCenter))
      };
    } else if (distToCenter <= radius + warningDist) {
      return {
        state: 'APPROACHING',
        distanceMeters: Math.round(distToCenter),
        distanceInside: 0
      };
    }

    return {
      state: 'OUTSIDE',
      distanceMeters: Math.round(distToCenter),
      distanceInside: 0
    };
  }
}

module.exports = GeofenceEngine;
