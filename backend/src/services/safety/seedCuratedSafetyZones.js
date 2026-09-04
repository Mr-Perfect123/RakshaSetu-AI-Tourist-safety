/**
 * One-Time Seed & Migration Script for Curated Safety Records
 * Inserts valid curated official advisories into MySQL danger_zones table.
 */

const path = require('path');
const fs = require('fs');
const { executeQuery, inMemoryStore } = require('../../config/database');
const SafetyValidationService = require('./safetyValidationService');

class SeedCuratedSafetyZones {
  /**
   * Migrate and seed curated official feed records into MySQL
   */
  static async seedCuratedZones() {
    console.log('[Seed Service] Checking curated safety feed data migration into MySQL...');
    const feedPath = path.join(__dirname, 'curatedSafetyFeed.json');
    if (!fs.existsSync(feedPath)) {
      console.log('[Seed Service] No curated safety feed file found. Skipping.');
      return { seeded: 0, skipped: 0 };
    }

    const raw = fs.readFileSync(feedPath, 'utf8');
    let items = [];
    try {
      items = JSON.parse(raw);
    } catch (err) {
      console.error('[Seed Service] Failed to parse curatedSafetyFeed.json:', err.message);
      return { seeded: 0, skipped: 0 };
    }

    let seededCount = 0;
    let skippedCount = 0;

    for (const item of items) {
      const lat = parseFloat(item.latitude);
      const lng = parseFloat(item.longitude);

      if (!SafetyValidationService.isValidCoord(lat, lng)) {
        skippedCount++;
        continue;
      }

      const category = SafetyValidationService.normalizeCategory(item.danger_type || item.category);
      const severity = SafetyValidationService.normalizeSeverity(item.severity);
      const source = item.source || 'Admin Curated';
      const confidence = item.confidence || SafetyValidationService.assignConfidence(source, true);
      const radiusMeters = parseInt(item.radius_meters || 500, 10);
      const warningDist = parseInt(item.warning_distance_meters || 200, 10);

      // Check if zone already exists by zone_code
      let existing = null;
      try {
        const rows = await executeQuery('SELECT id FROM danger_zones WHERE zone_code = ?', [item.zone_code]);
        if (rows && rows.length > 0) existing = rows[0];
      } catch {
        existing = inMemoryStore.danger_zones.find(z => z.zone_code === item.zone_code);
      }

      if (existing) {
        skippedCount++;
        continue;
      }

      const sql = `
        INSERT INTO danger_zones (
          zone_code, name, description, category, danger_type, severity, geometry_type,
          latitude, longitude, radius_meters, warning_distance_meters, safety_instructions,
          recommended_action, network_status, source, source_url, confidence, status,
          is_verified, country, state, city, is_active, is_sample_data, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'circle', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 1, ?, ?, ?, 1, 0, NOW(), NOW())
      `;

      const params = [
        item.zone_code,
        item.name,
        item.description || '',
        category,
        category,
        severity,
        lat,
        lng,
        radiusMeters,
        warningDist,
        item.safety_instructions || item.advisory_message || 'Exercise high vigilance.',
        item.recommended_action || 'Proceed via safe public corridors.',
        item.network_status || 'available',
        source,
        item.source_url || null,
        confidence,
        item.country || 'Global Region',
        item.state || '',
        item.city || ''
      ];

      try {
        await executeQuery(sql, params);
        seededCount++;
      } catch (err) {
        // In-memory fallback
        inMemoryStore.danger_zones.push({
          id: inMemoryStore.danger_zones.length + 1,
          zone_code: item.zone_code,
          name: item.name,
          description: item.description,
          category,
          danger_type: category,
          severity,
          geometry_type: 'circle',
          latitude: lat,
          longitude: lng,
          radius_meters: radiusMeters,
          warning_distance_meters: warningDist,
          safety_instructions: item.safety_instructions || item.advisory_message,
          recommended_action: item.recommended_action,
          network_status: item.network_status || 'available',
          source,
          source_url: item.source_url,
          confidence,
          status: 'active',
          is_verified: 1,
          country: item.country,
          state: item.state,
          city: item.city,
          is_active: 1,
          is_sample_data: 0
        });
        seededCount++;
      }
    }

    console.log(`[Seed Service] Migration finished: ${seededCount} zones seeded, ${skippedCount} skipped.`);
    return { seeded: seededCount, skipped: skippedCount };
  }
}

module.exports = SeedCuratedSafetyZones;
