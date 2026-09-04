-- ============================================================================
-- Migration: 008_dynamic_safety_zones.sql
-- Description: Dynamic Safety Zones Schema Enhancement (Polygon, Provenance, Verification, Indexes)
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. EXTEND DANGER_ZONES TABLE SCHEMA
ALTER TABLE danger_zones 
  ADD COLUMN IF NOT EXISTS geometry_type ENUM('circle', 'polygon') DEFAULT 'circle',
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source VARCHAR(150) NOT NULL DEFAULT 'Admin Curated',
  ADD COLUMN IF NOT EXISTS source_url VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS confidence ENUM('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'VERIFIED', 'UNVERIFIED') DEFAULT 'HIGH',
  ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'pending_review', 'expired', 'rejected') DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS reported_by INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS incident_id INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reported_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verified_by INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS state VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS region VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coverage_provider VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coverage_type VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS warning_distance_meters INT DEFAULT 200,
  ADD COLUMN IF NOT EXISTS safety_instructions TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recommended_action TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS network_status VARCHAR(50) DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS is_sample_data BOOLEAN DEFAULT FALSE;

-- 2. CREATE PERFORMANCE INDEXES IF SUPPORTED
-- Note: Errors on existing indexes will be safely bypassed by migration runner
ALTER TABLE danger_zones ADD INDEX idx_danger_zone_status (is_active, status, is_verified);
ALTER TABLE danger_zones ADD INDEX idx_danger_zone_source (source);
ALTER TABLE danger_zones ADD INDEX idx_danger_zone_expires (expires_at);
ALTER TABLE danger_zones ADD INDEX idx_danger_zone_incident (incident_id);

SET FOREIGN_KEY_CHECKS = 1;
