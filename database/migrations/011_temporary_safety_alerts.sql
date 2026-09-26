-- ============================================================================
-- Migration: 011_temporary_safety_alerts.sql
-- Description: Dynamic Temporary Safety Alert Zones (Circle, Polygon, Verification, Expiry Lifecycle)
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS temporary_safety_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alert_code VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  alert_type VARCHAR(80) NOT NULL DEFAULT 'Other',
  severity ENUM('low', 'moderate', 'high', 'critical') DEFAULT 'high',
  status ENUM('DRAFT', 'ACTIVE', 'RESOLVED', 'EXPIRED', 'DISABLED') DEFAULT 'ACTIVE',
  location_name VARCHAR(200) NOT NULL,
  country VARCHAR(100) DEFAULT NULL,
  state VARCHAR(100) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  geometry_type ENUM('circle', 'polygon') DEFAULT 'circle',
  radius_meters INT DEFAULT 500,
  warning_distance_meters INT DEFAULT 200,
  polygon_coordinates JSON DEFAULT NULL,
  safety_instruction TEXT DEFAULT NULL,
  source_type ENUM('Official Authority', 'Verified News', 'Verified Internal Report', 'Other') DEFAULT 'Official Authority',
  source_name VARCHAR(150) DEFAULT 'District Administration',
  source_url VARCHAR(255) DEFAULT NULL,
  is_verified BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_temp_alert_status (status),
  INDEX idx_temp_alert_starts (starts_at),
  INDEX idx_temp_alert_expires (expires_at),
  INDEX idx_temp_alert_type (alert_type),
  INDEX idx_temp_alert_severity (severity),
  INDEX idx_temp_alert_coords (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO temporary_safety_alerts (
  id, alert_code, title, description, alert_type, severity, status, location_name,
  country, state, city, latitude, longitude, geometry_type, radius_meters,
  warning_distance_meters, polygon_coordinates, safety_instruction, source_type,
  source_name, source_url, is_verified, starts_at, expires_at, created_by
) VALUES (
  1,
  'TSA-CBE-ROAD-001',
  'Temporary Road Closure',
  'road construction and road maintenance',
  'Temporary Road Closure',
  'low',
  'ACTIVE',
  'coimbatore, tamilnadu',
  'India',
  'Tamil Nadu',
  'Coimbatore',
  11.0168000,
  76.9558000,
  'circle',
  1000,
  200,
  NULL,
  'Road construction active. Follow local diversion signs and drive with caution.',
  'Official Authority',
  'Coimbatore City Traffic Police',
  'https://coimbatorepolice.tn.gov.in',
  1,
  NOW(),
  DATE_ADD(NOW(), INTERVAL 7 DAY),
  1
);

SET FOREIGN_KEY_CHECKS = 1;
