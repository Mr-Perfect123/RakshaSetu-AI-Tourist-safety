-- ============================================================================
-- Migration: 010_strict_location_permissions.sql
-- Description: Strict Location Sharing Consent & Admin Location Request Authorization
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

-- Ensure location_permissions table exists with all consent flags
CREATE TABLE IF NOT EXISTS location_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  location_sharing_active BOOLEAN DEFAULT FALSE,
  live_tracking_enabled BOOLEAN DEFAULT TRUE,
  permission_granted_at TIMESTAMP NULL DEFAULT NULL,
  last_prompted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_loc_perm_user (user_id, location_sharing_active)
) ENGINE=InnoDB;

-- Ensure location_requests table exists with extended status ENUM
CREATE TABLE IF NOT EXISTS location_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  requested_by INT NOT NULL,
  message VARCHAR(255) DEFAULT 'RakshaSetu Admin is requesting your live location for safety monitoring.',
  status ENUM('pending', 'approved', 'declined', 'revoked', 'expired') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_loc_req_pair (user_id, requested_by, status)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
