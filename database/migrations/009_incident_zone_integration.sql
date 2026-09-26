-- ============================================================================
-- Migration: 009_incident_zone_integration.sql
-- Description: Incident-to-Danger Zone Integration (Clustering, Merging, Expiration & Metadata)
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE danger_zones ADD COLUMN incident_count INT DEFAULT 1;
ALTER TABLE danger_zones ADD COLUMN related_incident_ids TEXT DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN last_incident_at TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE danger_zones ADD INDEX idx_danger_zone_inc_count (incident_count);

SET FOREIGN_KEY_CHECKS = 1;
