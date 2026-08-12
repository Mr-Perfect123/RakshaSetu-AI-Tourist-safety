-- ============================================================================
-- Migration: 006_tourist_identity_and_location_permissions.sql
-- Description: Schema extensions for Tourist Identity, Health, Documents, Dual OTP Verification, Location Consent & Admin Monitoring
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. EXTEND USERS TABLE FOR VERIFICATION & IDENTITY
ALTER TABLE users ADD COLUMN dob DATE DEFAULT NULL;
ALTER TABLE users ADD COLUMN profile_image_path VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN id_type VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN id_number VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN id_proof_url VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN id_verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending';
ALTER TABLE users ADD COLUMN id_rejection_reason TEXT DEFAULT NULL;

-- 2. EXTEND EMERGENCY_CONTACTS TABLE FOR OPTIONAL CONTACT EMAIL (NON-UNIQUE, ALLOWS DUPLICATES)
ALTER TABLE emergency_contacts ADD COLUMN email VARCHAR(120) DEFAULT NULL AFTER contact_phone;

-- 3. CREATE TOURIST_DOCUMENTS TABLE FOR SECURE GOVERNMENT ID STORAGE
CREATE TABLE IF NOT EXISTS tourist_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  id_type VARCHAR(50) NOT NULL,
  id_number VARCHAR(100) NOT NULL,
  document_path VARCHAR(255) NOT NULL,
  verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejection_reason TEXT DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_doc_user (user_id),
  INDEX idx_doc_status (verification_status)
) ENGINE=InnoDB;

-- 4. CREATE TOURIST_HEALTH TABLE FOR MEDICAL EMERGENCY PROFILE
CREATE TABLE IF NOT EXISTS tourist_health (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  blood_group VARCHAR(30) DEFAULT 'Prefer not to disclose',
  medical_conditions TEXT DEFAULT NULL,
  allergies TEXT DEFAULT NULL,
  medical_requirements TEXT DEFAULT NULL,
  emergency_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. CREATE LOCATION_PERMISSIONS TABLE FOR CONSENT TRACKING
CREATE TABLE IF NOT EXISTS location_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  location_sharing_active BOOLEAN DEFAULT FALSE,
  live_tracking_enabled BOOLEAN DEFAULT TRUE,
  permission_granted_at TIMESTAMP NULL DEFAULT NULL,
  last_prompted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. CREATE LOCATION_REQUESTS TABLE FOR ADMIN-INITIATED LOCATION REQUESTS
CREATE TABLE IF NOT EXISTS location_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  requested_by INT NOT NULL,
  message VARCHAR(255) DEFAULT 'RakshaSetu Admin is requesting your live location for safety monitoring.',
  status ENUM('pending', 'approved', 'declined') DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_loc_req_user (user_id, status)
) ENGINE=InnoDB;

-- 7. CREATE ADMIN_OTP_VERIFICATIONS TABLE FOR ADMIN 2FA LOGIN
CREATE TABLE IF NOT EXISTS admin_otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  email VARCHAR(120) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'admin_login_2fa',
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_otp (admin_id, otp_code)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
