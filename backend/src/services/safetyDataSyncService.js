/**
 * Dynamic Safety Data Synchronization Service
 * Orchestrates external data pipelines (USGS, GDACS) and Curated Seed Migration.
 * Removes all hardcoded runtime arrays and persists directly into MySQL.
 */

const { executeQuery, inMemoryStore } = require('../config/database');
const UsgsService = require('./safety/usgsService');
const GdacsService = require('./safety/gdacsService');
const SeedCuratedSafetyZones = require('./safety/seedCuratedSafetyZones');
const SafetyValidationService = require('./safety/safetyValidationService');

class SafetyDataSyncService {
  static isSyncRunning = false;
  static cronScheduled = false;

  /**
   * Synchronize all dynamic safety data sources (Curated Seed, USGS, GDACS)
   */
  static async syncAllSources() {
    if (this.isSyncRunning) {
      console.log('[Sync Service] Safety data sync is already running in background. Skipping overlapping request.');
      return { status: 'already_running', ingestedCount: 0 };
    }

    this.isSyncRunning = true;
    console.log('[Sync Service] ========================================');
    console.log('[Sync Service] 🌐 Starting Dynamic Safety Ingestion Pipeline...');
    console.log('[Sync Service] Time:', new Date().toISOString());

    let totalIngested = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const syncErrors = [];

    try {
      // 1. One-time check / Seed Curated Official Advisories into MySQL
      try {
        const seedRes = await SeedCuratedSafetyZones.seedCuratedZones();
        totalIngested += seedRes.seeded || 0;
      } catch (seedErr) {
        console.warn('[Sync Service] Curated seed check warning:', seedErr.message);
        syncErrors.push(`Curated Seed: ${seedErr.message}`);
      }

      // 2. Fetch Active USGS Earthquakes Feed
      try {
        const earthquakes = await UsgsService.fetchEarthquakeEvents();
        console.log(`[Sync Service] USGS: Processing ${earthquakes.length} seismic alerts...`);
        for (const eq of earthquakes) {
          const res = await this.saveOrUpdateZone(eq);
          if (res.action === 'inserted') totalIngested++;
          else if (res.action === 'updated') totalUpdated++;
          else totalSkipped++;
        }
      } catch (usgsErr) {
        console.warn('[Sync Service] USGS ingestion error:', usgsErr.message);
        syncErrors.push(`USGS: ${usgsErr.message}`);
      }

      // 3. Fetch Active GDACS Disaster Alerts Feed
      try {
        const disasters = await GdacsService.fetchDisasterEvents();
        console.log(`[Sync Service] GDACS: Processing ${disasters.length} disaster alerts...`);
        for (const dis of disasters) {
          const res = await this.saveOrUpdateZone(dis);
          if (res.action === 'inserted') totalIngested++;
          else if (res.action === 'updated') totalUpdated++;
          else totalSkipped++;
        }
      } catch (gdacsErr) {
        console.warn('[Sync Service] GDACS ingestion error:', gdacsErr.message);
        syncErrors.push(`GDACS: ${gdacsErr.message}`);
      }

      // 4. Prune Expired Hazards
      await this.pruneExpiredHazards();

      console.log(`[Sync Service] Ingestion Completed: ${totalIngested} inserted, ${totalUpdated} updated, ${totalSkipped} skipped.`);
      console.log('[Sync Service] ========================================');

      return {
        status: 'completed',
        ingestedCount: totalIngested + totalUpdated,
        inserted: totalIngested,
        updated: totalUpdated,
        skipped: totalSkipped,
        errors: syncErrors
      };
    } finally {
      this.isSyncRunning = false;
    }
  }

  /**
   * Save or Update a Normalized Zone in MySQL with deduplication
   */
  static async saveOrUpdateZone(zone) {
    if (!SafetyValidationService.isValidCoord(zone.latitude, zone.longitude)) {
      return { action: 'skipped', reason: 'invalid_coordinates' };
    }

    // Check if zone already exists by zone_code
    let existing = null;
    try {
      const rows = await executeQuery('SELECT * FROM danger_zones WHERE zone_code = ?', [zone.zone_code]);
      if (rows && rows.length > 0) existing = rows[0];
    } catch {
      existing = inMemoryStore.danger_zones.find(z => z.zone_code === zone.zone_code);
    }

    const category = SafetyValidationService.normalizeCategory(zone.category || zone.danger_type);
    const severity = SafetyValidationService.normalizeSeverity(zone.severity);
    const confidence = zone.confidence || SafetyValidationService.assignConfidence(zone.source, true);

    if (existing) {
      // Update existing record
      const sql = `
        UPDATE danger_zones SET
          name = ?, description = ?, category = ?, danger_type = ?, severity = ?,
          latitude = ?, longitude = ?, radius_meters = ?, warning_distance_meters = ?,
          safety_instructions = ?, recommended_action = ?, source = ?, source_url = ?,
          confidence = ?, expires_at = ?, status = 'active', is_active = 1, updated_at = NOW()
        WHERE zone_code = ?
      `;
      const params = [
        zone.name, zone.description, category, category, severity,
        zone.latitude, zone.longitude, zone.radius_meters, zone.warning_distance_meters || 200,
        zone.safety_instructions, zone.recommended_action, zone.source, zone.source_url,
        confidence, zone.expires_at || null, zone.zone_code
      ];

      try {
        await executeQuery(sql, params);
      } catch {
        const idx = inMemoryStore.danger_zones.findIndex(z => z.zone_code === zone.zone_code);
        if (idx !== -1) {
          inMemoryStore.danger_zones[idx] = { ...inMemoryStore.danger_zones[idx], ...zone, category, severity };
        }
      }
      return { action: 'updated' };
    } else {
      // Insert new hazard zone
      const sql = `
        INSERT INTO danger_zones (
          zone_code, name, description, category, danger_type, severity, geometry_type,
          latitude, longitude, radius_meters, warning_distance_meters, safety_instructions,
          recommended_action, network_status, source, source_url, confidence, status,
          is_verified, country, state, city, expires_at, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'circle', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?, ?, 1, NOW(), NOW())
      `;
      const params = [
        zone.zone_code, zone.name, zone.description, category, category, severity,
        zone.latitude, zone.longitude, zone.radius_meters, zone.warning_distance_meters || 200,
        zone.safety_instructions, zone.recommended_action, zone.network_status || 'available',
        zone.source, zone.source_url, confidence, zone.country || 'Global Region',
        zone.state || '', zone.city || '', zone.expires_at || null
      ];

      try {
        await executeQuery(sql, params);
      } catch {
        inMemoryStore.danger_zones.unshift({
          id: inMemoryStore.danger_zones.length + 1,
          ...zone,
          category,
          danger_type: category,
          severity,
          is_active: 1
        });
      }
      return { action: 'inserted' };
    }
  }

  /**
   * Automatically deactivate or expire outdated hazards
   */
  static async pruneExpiredHazards() {
    try {
      await executeQuery(`
        UPDATE danger_zones 
        SET is_active = 0, status = 'expired', updated_at = NOW() 
        WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active = 1
      `);
    } catch {
      const now = new Date();
      inMemoryStore.danger_zones.forEach(z => {
        if (z.expires_at && new Date(z.expires_at) < now) {
          z.is_active = 0;
          z.status = 'expired';
        }
      });
    }
  }

  /**
   * Start recurring background cron synchronization (every 30 minutes)
   */
  static startPeriodicSync() {
    if (this.cronScheduled) return;
    try {
      const cron = require('node-cron');
      // Run every 30 minutes
      cron.schedule('*/30 * * * *', async () => {
        console.log('[Sync Service Cron] Running scheduled periodic safety feed sync...');
        await this.syncAllSources();
      });
      this.cronScheduled = true;
      console.log('[Sync Service] Periodic 30-minute safety sync schedule registered.');
    } catch (err) {
      console.warn('[Sync Service] node-cron setup skipped:', err.message);
    }
  }
}

module.exports = SafetyDataSyncService;
