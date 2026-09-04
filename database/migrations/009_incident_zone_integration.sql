-- ============================================================================
-- Migration: 009_incident_zone_integration.sql
-- Description: Incident-to-Danger Zone Integration (Clustering, Merging, Expiration & Metadata)
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE danger_zones 
  ADD COLUMN IF NOT EXISTS incident_count INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS related_incident_ids TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_incident_at TIMESTAMP NULL DEFAULT NULL;

ALTER TABLE danger_zones ADD INDEX idx_danger_zone_inc_count (incident_count);

SET FOREIGN_KEY_CHECKS = 1;
