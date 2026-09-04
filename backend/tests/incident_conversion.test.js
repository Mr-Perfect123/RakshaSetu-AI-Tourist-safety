const IncidentZoneService = require('../src/services/incidentZoneService');
const { inMemoryStore } = require('../src/config/database');

describe('Incident-to-Danger Zone Automatic Conversion Engine', () => {
  beforeEach(() => {
    // Reset inMemoryStore.danger_zones and incident_reports for clean test environment
    inMemoryStore.danger_zones = [
      {
        id: 100,
        zone_code: 'FEED-IND-DEL-THEFT',
        name: 'Paharganj Pickpocket Belt',
        category: 'THEFT',
        danger_type: 'THEFT',
        severity: 'moderate',
        latitude: 28.6420,
        longitude: 77.2180,
        radius_meters: 500,
        source: 'Delhi Police',
        is_active: 1
      }
    ];

    inMemoryStore.incident_reports = [
      {
        id: 501,
        report_code: 'INC-2026-9001',
        user_id: 10,
        category: 'THEFT',
        title: 'Phone Snatching at Red Fort Outer Ring',
        description: 'Snatched phone while boarding taxi.',
        severity: 'high',
        latitude: 28.6562,
        longitude: 77.2410,
        location_name: 'Red Fort Gate 2',
        status: 'pending',
        created_at: new Date().toISOString()
      },
      {
        id: 502,
        report_code: 'INC-2026-9002',
        user_id: 11,
        category: 'THEFT',
        title: 'Pickpocketing at Red Fort Outer Gate',
        description: 'Wallet taken in crowd line.',
        severity: 'high',
        latitude: 28.6565, // ~35 meters from 501
        longitude: 77.2412,
        location_name: 'Red Fort Gate 2 Entrance',
        status: 'verified',
        created_at: new Date().toISOString()
      },
      {
        id: 503,
        report_code: 'INC-2026-9003',
        user_id: 12,
        category: 'FLOOD_RISK',
        title: 'Flash Flood Overflow at Red Fort Gate',
        description: 'Water accumulation 3 feet deep.',
        severity: 'critical',
        latitude: 28.6564, // Same area (~30m), but distinct category
        longitude: 77.2411,
        location_name: 'Red Fort Low Lying Area',
        status: 'verified',
        created_at: new Date().toISOString()
      }
    ];
  });

  describe('Eligibility Verification (shouldCreateZone)', () => {
    test('rejects pending incident reports', () => {
      const pendingIncident = inMemoryStore.incident_reports.find(i => i.id === 501);
      const res = IncidentZoneService.shouldCreateZone(pendingIncident);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('Only VERIFIED reports trigger automatic geofencing');
    });

    test('accepts verified incident reports with valid GPS coordinates', () => {
      const verifiedIncident = inMemoryStore.incident_reports.find(i => i.id === 502);
      const res = IncidentZoneService.shouldCreateZone(verifiedIncident);
      expect(res.eligible).toBe(true);
      expect(res.category).toBe('THEFT');
    });

    test('rejects incidents with invalid GPS coordinates', () => {
      const invalidInc = { id: 999, status: 'verified', category: 'THEFT', latitude: 'abc', longitude: 77.2410 };
      const res = IncidentZoneService.shouldCreateZone(invalidInc);
      expect(res.eligible).toBe(false);
      expect(res.reason).toContain('invalid numeric GPS');
    });
  });

  describe('Automatic Idempotent Zone Conversion & Merging', () => {
    test('automatically creates a new danger zone when verified incident has no nearby compatible zone', async () => {
      const incident = inMemoryStore.incident_reports.find(i => i.id === 502);
      const result = await IncidentZoneService.processVerifiedIncident(incident, 1);

      expect(result.zoneCreated).toBe(true);
      expect(result.zoneUpdated).toBe(false);
      expect(result.zone).toBeDefined();
      expect(result.zone.source).toBe('Verified Community Report');
      expect(result.zone.source_url).toBeNull();
      expect(result.zone.is_active).toBe(1);
      expect(result.zone.expires_at).toBeDefined();
      expect(new Date(result.zone.expires_at).getTime()).toBeGreaterThan(Date.now());
    });

    test('merges subsequent nearby compatible verified incidents into the existing safety zone', async () => {
      // First verified report creates zone
      const inc1 = inMemoryStore.incident_reports.find(i => i.id === 502);
      const res1 = await IncidentZoneService.processVerifiedIncident(inc1, 1);
      const createdZoneId = res1.zone.id;

      // Create a second verified report at nearby location (same category)
      const inc2 = {
        id: 504,
        category: 'THEFT',
        severity: 'high',
        latitude: 28.6568, // ~60m away
        longitude: 77.2415,
        status: 'verified',
        created_at: new Date().toISOString()
      };
      inMemoryStore.incident_reports.push(inc2);

      const res2 = await IncidentZoneService.processVerifiedIncident(inc2, 1);

      expect(res2.zoneCreated).toBe(false);
      expect(res2.zoneUpdated).toBe(true);
      expect(res2.zone.id).toBe(createdZoneId);
      expect(res2.zone.incident_count).toBe(2);
    });

    test('does not merge nearby incidents with distinct categories (e.g. THEFT vs FLOOD_RISK)', async () => {
      // THEFT incident
      const theftInc = inMemoryStore.incident_reports.find(i => i.id === 502);
      const theftRes = await IncidentZoneService.processVerifiedIncident(theftInc, 1);

      // FLOOD_RISK incident at almost identical location
      const floodInc = inMemoryStore.incident_reports.find(i => i.id === 503);
      const floodRes = await IncidentZoneService.processVerifiedIncident(floodInc, 1);

      expect(theftRes.zoneCreated).toBe(true);
      expect(floodRes.zoneCreated).toBe(true);
      expect(floodRes.zone.id).not.toEqual(theftRes.zone.id);
      expect(floodRes.zone.category).toBe('FLOOD_RISK');
    });

    test('deactivates zone when linked incident is rejected or revoked', async () => {
      const incident = inMemoryStore.incident_reports.find(i => i.id === 502);
      const result = await IncidentZoneService.processVerifiedIncident(incident, 1);
      const createdZoneId = result.zone.id;

      // Reject the incident
      await IncidentZoneService.deactivateZoneForIncident(incident.id);

      const zoneInStore = inMemoryStore.danger_zones.find(z => z.id === createdZoneId);
      expect(zoneInStore.is_active).toBe(0);
      expect(zoneInStore.status).toBe('rejected');
    });
  });
});
