-- ============================================================================
-- Migration: 008_dynamic_safety_zones.sql
-- Description: Dynamic Safety Zones Schema Enhancement (Polygon, Provenance, Verification, Indexes)
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. EXTEND DANGER_ZONES TABLE SCHEMA
ALTER TABLE danger_zones ADD COLUMN geometry_type ENUM('circle', 'polygon') DEFAULT 'circle';
ALTER TABLE danger_zones ADD COLUMN category VARCHAR(100) DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN danger_type VARCHAR(100) DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN source VARCHAR(150) NOT NULL DEFAULT 'Admin Curated';
ALTER TABLE danger_zones ADD COLUMN source_url VARCHAR(255) DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN confidence ENUM('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'VERIFIED', 'UNVERIFIED') DEFAULT 'HIGH';
ALTER TABLE danger_zones ADD COLUMN status ENUM('active', 'inactive', 'pending_review', 'expired', 'rejected') DEFAULT 'active';
ALTER TABLE danger_zones ADD COLUMN is_verified BOOLEAN DEFAULT TRUE;
ALTER TABLE danger_zones ADD COLUMN reported_by INT DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN incident_id INT DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN reported_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN verified_by INT DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN verified_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN expires_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN country VARCHAR(100) DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN state VARCHAR(100) DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN city VARCHAR(100) DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN region VARCHAR(100) DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN coverage_provider VARCHAR(100) DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN coverage_type VARCHAR(50) DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN warning_distance_meters INT DEFAULT 200;
ALTER TABLE danger_zones ADD COLUMN safety_instructions TEXT DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN recommended_action TEXT DEFAULT NULL;
ALTER TABLE danger_zones ADD COLUMN network_status VARCHAR(50) DEFAULT 'available';
ALTER TABLE danger_zones ADD COLUMN is_sample_data BOOLEAN DEFAULT FALSE;

-- 2. CREATE PERFORMANCE INDEXES IF SUPPORTED
-- Note: Errors on existing indexes will be safely bypassed by migration runner
ALTER TABLE danger_zones ADD INDEX idx_danger_zone_status (is_active, status, is_verified);
ALTER TABLE danger_zones ADD INDEX idx_danger_zone_source (source);
ALTER TABLE danger_zones ADD INDEX idx_danger_zone_expires (expires_at);
ALTER TABLE danger_zones ADD INDEX idx_danger_zone_incident (incident_id);

SET FOREIGN_KEY_CHECKS = 1;
