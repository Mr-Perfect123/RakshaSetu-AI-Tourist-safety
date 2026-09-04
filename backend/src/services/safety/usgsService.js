/**
 * USGS Dynamic Earthquake Ingestion Service
 * Ingests real-time seismic data from the United States Geological Survey.
 */

const SafetyValidationService = require('./safetyValidationService');

class UsgsService {
  static FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';

  /**
   * Fetch and normalize active earthquake events from USGS
   */
  static async fetchEarthquakeEvents(minMagnitude = 3.5) {
    console.log('[USGS Service] Requesting live earthquake feed from USGS...');
    try {
      const response = await fetch(this.FEED_URL, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        throw new Error(`USGS HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.features || !Array.isArray(data.features)) {
        return [];
      }

      const normalizedZones = [];

      for (const feat of data.features) {
        const props = feat.properties || {};
        const mag = parseFloat(props.mag || 0);
        if (isNaN(mag) || mag < minMagnitude) continue;

        const coords = feat.geometry?.coordinates || [];
        const lng = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);

        if (!SafetyValidationService.isValidCoord(lat, lng)) continue;

        const place = props.place || 'Seismic Epicenter';
        const eventId = feat.id || `${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const zoneCode = `USGS-${eventId}`;
        const eventTime = props.time ? new Date(props.time) : new Date();

        // Calculate dynamic impact radius proportional to magnitude
        const radiusMeters = Math.min(100000, Math.max(3000, Math.round(mag * 4500)));
        const warningDistanceMeters = Math.min(5000, Math.max(1000, Math.round(radiusMeters * 0.25)));

        const severity = mag >= 6.0 ? 'critical' : mag >= 4.5 ? 'high' : 'moderate';

        const zone = {
          zone_code: zoneCode,
          name: `Seismic Alert: M${mag.toFixed(1)} - ${place.replace(/^.*?of\s+/i, '')}`,
          description: `USGS recorded magnitude ${mag.toFixed(1)} earthquake at ${place}. Recorded time: ${eventTime.toUTCString()}.`,
          category: 'EARTHQUAKE',
          danger_type: 'EARTHQUAKE',
          severity,
          geometry_type: 'circle',
          latitude: lat,
          longitude: lng,
          radius_meters: radiusMeters,
          warning_distance_meters: warningDistanceMeters,
          safety_instructions: 'Drop, Cover, and Hold On during active tremors. Move to open areas away from overhead structures and power lines.',
          recommended_action: 'Verify local structural integrity. Follow local emergency broadcast channels.',
          network_status: 'available',
          source: 'United States Geological Survey (USGS)',
          source_url: props.url || 'https://earthquake.usgs.gov',
          confidence: 'VERY_HIGH',
          status: 'active',
          is_verified: true,
          country: place.includes(',') ? place.split(',').pop().trim() : 'Global Region',
          state: '',
          city: place.replace(/^.*?of\s+/i, '').split(',')[0].trim(),
          reported_at: eventTime.toISOString(),
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(), // 48-hour active window
          is_active: true
        };

        normalizedZones.push(zone);
      }

      console.log(`[USGS Service] Parsed ${normalizedZones.length} valid earthquake hazard zones.`);
      return normalizedZones;
    } catch (err) {
      console.warn(`[USGS Service] Warning: Ingestion failed - ${err.message}`);
      return [];
    }
  }
}

module.exports = UsgsService;
