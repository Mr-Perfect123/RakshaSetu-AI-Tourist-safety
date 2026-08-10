-- ============================================================================
-- Migration: 005_red_alerts_system.sql
-- Description: Add Red Alerts System schema and initial seed data
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. RED_ALERTS TABLE
CREATE TABLE IF NOT EXISTS red_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  alert_code VARCHAR(30) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INT DEFAULT 1000,
  severity ENUM('medium', 'high', 'critical') DEFAULT 'critical',
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP NULL DEFAULT NULL,
  status ENUM('active', 'expired', 'deactivated') DEFAULT 'active',
  created_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_alert_coords (latitude, longitude),
  INDEX idx_alert_status (status)
) ENGINE=InnoDB;

-- SEED ACTIVE DEMO RED ALERTS
INSERT IGNORE INTO red_alerts (id, alert_code, title, description, latitude, longitude, radius_meters, severity, start_time, status) VALUES
(1, 'RA-DEL-001', 'High Severity Crowd Surge Advisory', 'Heavy unauthorized gathering reported near Chandni Chowk main corridor. Avoid arterial roads.', 28.6500, 77.2300, 800, 'critical', CURRENT_TIMESTAMP, 'active'),
(2, 'RA-AGR-001', 'Weather Warning - Dense Fog Hazard', 'Reduced visibility below 50m around Taj East Gate highway corridor.', 27.1751, 78.0421, 1500, 'high', CURRENT_TIMESTAMP, 'active');

SET FOREIGN_KEY_CHECKS = 1;
