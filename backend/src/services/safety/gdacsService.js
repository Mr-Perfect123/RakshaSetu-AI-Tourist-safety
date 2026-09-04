/**
 * GDACS Dynamic Disaster Feed Ingestion Service
 * Ingests live natural disaster alerts (Floods, Cyclones, Earthquakes, Volcanoes) from GDACS.
 */

const SafetyValidationService = require('./safetyValidationService');

class GdacsService {
  static FEED_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/geojson';

  /**
   * Fetch and normalize active disaster events from GDACS
   */
  static async fetchDisasterEvents() {
    console.log('[GDACS Service] Requesting live natural hazard feeds from GDACS...');
    try {
      const response = await fetch(this.FEED_URL, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        throw new Error(`GDACS HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.features || !Array.isArray(data.features)) {
        return [];
      }

      const normalizedZones = [];

      for (const feat of data.features) {
        const props = feat.properties || {};
        const eventType = (props.eventtype || '').toUpperCase();
        
        let category = 'NATURAL_DISASTER';
        let namePrefix = 'Disaster Alert';
        let safetyAdvice = 'Avoid entering affected regions or low-lying flood stretches. Secure travel credentials.';

        if (eventType === 'FL') {
          category = 'FLOOD_RISK';
          namePrefix = 'Flood Alert';
          safetyAdvice = 'Avoid river banks and flooded underpasses. Seek elevated terrain immediately.';
        } else if (eventType === 'TC') {
          category = 'CYCLONE_RISK';
          namePrefix = 'Tropical Cyclone Alert';
          safetyAdvice = 'Remain indoors. Keep away from glass windows and loose roof sheets. Charge emergency power banks.';
        } else if (eventType === 'EQ') {
          category = 'EARTHQUAKE';
          namePrefix = 'Seismic Disaster Alert';
          safetyAdvice = 'Drop, cover, and hold on. Avoid unreinforced masonry structures.';
        } else if (eventType === 'VO') {
          category = 'OTHER';
          namePrefix = 'Volcanic Hazard Alert';
          safetyAdvice = 'Wear N95/protective masks against volcanic ash. Follow exclusion zone evacuation mandates.';
        } else if (eventType === 'WF') {
          category = 'FIRE_RISK';
          namePrefix = 'Wildfire Warning';
          safetyAdvice = 'Stay clear of active fire fronts and smoke corridors. Follow designated evacuation paths.';
        } else {
          continue; // Skip minor/unsupported types
        }

        const coords = feat.geometry?.coordinates || [];
        const lng = parseFloat(coords[0]);
        const lat = parseFloat(coords[1]);

        if (!SafetyValidationService.isValidCoord(lat, lng)) continue;

        const eventName = props.eventname || `${namePrefix} Event`;
        const eventId = props.eventid || `${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const zoneCode = `GDACS-${eventId}`;
        const alertLevel = (props.alertlevel || 'Green').toLowerCase();

        const severity = alertLevel === 'red' ? 'critical' : alertLevel === 'orange' ? 'high' : 'moderate';
        const radiusMeters = alertLevel === 'red' ? 20000 : alertLevel === 'orange' ? 10000 : 5000;
        const warningDistanceMeters = alertLevel === 'red' ? 4000 : 2000;

        const zone = {
          zone_code: zoneCode,
          name: `${namePrefix}: ${eventName}`,
          description: `GDACS Active Hazard: ${eventName}. Alert Level: ${props.alertlevel || 'Alert'}. Severity Score: ${props.severitydata?.severity || 'Active'}.`,
          category,
          danger_type: category,
          severity,
          geometry_type: 'circle',
          latitude: lat,
          longitude: lng,
          radius_meters: radiusMeters,
          warning_distance_meters: warningDistanceMeters,
          safety_instructions: safetyAdvice,
          recommended_action: 'Monitor local authority announcements and government emergency broadcasts.',
          network_status: 'available',
          source: 'Global Disaster Alert & Coordination System (GDACS)',
          source_url: props.url?.report || 'https://www.gdacs.org',
          confidence: 'HIGH',
          status: 'active',
          is_verified: true,
          country: props.country || 'Global Region',
          state: '',
          city: props.eventname?.split('in')?.pop()?.trim() || '',
          reported_at: props.fromdate ? new Date(props.fromdate).toISOString() : new Date().toISOString(),
          verified_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 72 * 3600 * 1000).toISOString(), // 72-hour disaster alert window
          is_active: true
        };

        normalizedZones.push(zone);
      }

      console.log(`[GDACS Service] Parsed ${normalizedZones.length} valid disaster hazard zones.`);
      return normalizedZones;
    } catch (err) {
      console.warn(`[GDACS Service] Warning: Ingestion failed - ${err.message}`);
      return [];
    }
  }
}

module.exports = GdacsService;
