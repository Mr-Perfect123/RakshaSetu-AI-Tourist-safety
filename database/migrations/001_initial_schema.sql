-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Create all 18 tables, indexes, and foreign keys for RakshaSetu
-- ============================================================================

CREATE DATABASE IF NOT EXISTS rakshasetu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profile_image VARCHAR(255) DEFAULT NULL,
  gender ENUM('male', 'female', 'other', 'prefer_not_to_say') DEFAULT 'prefer_not_to_say',
  nationality VARCHAR(60) DEFAULT 'Indian',
  passport_number VARCHAR(50) DEFAULT NULL,
  role ENUM('Admin', 'Tourist', 'Police', 'Hospital') NOT NULL DEFAULT 'Tourist',
  status ENUM('active', 'inactive', 'suspended', 'in_emergency') DEFAULT 'active',
  is_verified BOOLEAN DEFAULT FALSE,
  latitude DECIMAL(10, 8) DEFAULT NULL,
  longitude DECIMAL(11, 8) DEFAULT NULL,
  last_active_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_phone (phone),
  INDEX idx_role (role),
  INDEX idx_coords (latitude, longitude)
) ENGINE=InnoDB;

-- 2. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL DEFAULT 'State Tourist Protection Command',
  designation VARCHAR(80) NOT NULL DEFAULT 'Chief Dispatcher',
  jurisdiction_zone VARCHAR(100) DEFAULT 'National Capital Region',
  badge_number VARCHAR(50) DEFAULT 'RS-ADM-001',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. TOURISTS TABLE
CREATE TABLE IF NOT EXISTS tourists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  emergency_medical_info TEXT DEFAULT NULL,
  blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown') DEFAULT 'Unknown',
  hotel_address TEXT DEFAULT NULL,
  travel_insurance_no VARCHAR(100) DEFAULT NULL,
  preferred_language VARCHAR(30) DEFAULT 'en',
  dark_mode_enabled BOOLEAN DEFAULT FALSE,
  shake_sos_enabled BOOLEAN DEFAULT TRUE,
  crash_detection_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. EMERGENCY_CONTACTS TABLE
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(255) NOT NULL,
  relationship VARCHAR(50) DEFAULT 'Family',
  priority_order INT DEFAULT 1,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_contact (user_id)
) ENGINE=InnoDB;

-- 5. SOS_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS sos_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sos_code VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  trigger_type ENUM('one_tap', 'voice', 'shake', 'auto_crash', 'offline_sms') NOT NULL DEFAULT 'one_tap',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy_meters DECIMAL(6, 2) DEFAULT 10.00,
  address TEXT DEFAULT NULL,
  audio_recording_url VARCHAR(255) DEFAULT NULL,
  status ENUM('active', 'dispatched', 'resolved', 'cancelled', 'false_alarm') DEFAULT 'active',
  assigned_police_id INT DEFAULT NULL,
  assigned_hospital_id INT DEFAULT NULL,
  resolution_notes TEXT DEFAULT NULL,
  resolved_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_police_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_hospital_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sos_status (status),
  INDEX idx_sos_user (user_id),
  INDEX idx_sos_location (latitude, longitude)
) ENGINE=InnoDB;

-- 6. TOURIST_LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS tourist_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  speed DECIMAL(5, 2) DEFAULT 0.00,
  heading DECIMAL(5, 2) DEFAULT 0.00,
  battery_level INT DEFAULT 100,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tourist_history (user_id, recorded_at)
) ENGINE=InnoDB;

-- 7. INCIDENT_REPORTS TABLE
CREATE TABLE IF NOT EXISTS incident_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_code VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  category ENUM('crime', 'scam', 'accident', 'road_block', 'missing_person', 'natural_disaster', 'other') NOT NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_name VARCHAR(200) DEFAULT NULL,
  image_urls JSON DEFAULT NULL,
  video_urls JSON DEFAULT NULL,
  status ENUM('pending', 'under_investigation', 'verified', 'rejected', 'resolved') DEFAULT 'pending',
  verified_by INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_incident_category (category),
  INDEX idx_incident_status (status)
) ENGINE=InnoDB;

-- 8. CRIME_REPORTS TABLE
CREATE TABLE IF NOT EXISTS crime_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crime_type VARCHAR(100) NOT NULL,
  crime_rate_index DECIMAL(4, 2) DEFAULT 0.00,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city VARCHAR(80) DEFAULT 'Delhi',
  state VARCHAR(80) DEFAULT 'Delhi',
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  risk_level ENUM('low', 'moderate', 'high', 'danger_zone') DEFAULT 'moderate',
  INDEX idx_crime_location (latitude, longitude)
) ENGINE=InnoDB;

-- 9. SAFE_LOCATIONS TABLE
CREATE TABLE IF NOT EXISTS safe_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('police_station', 'hospital', 'embassy', 'tourist_helpdesk', 'shelter', 'safe_hotel') NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  address TEXT NOT NULL,
  is_24_7 BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3, 2) DEFAULT 4.9,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_safe_loc_type (type)
) ENGINE=InnoDB;

-- 10. POLICE_STATIONS TABLE
CREATE TABLE IF NOT EXISTS police_stations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  station_name VARCHAR(150) NOT NULL,
  jurisdiction VARCHAR(100) DEFAULT 'Central Zone',
  incharge_name VARCHAR(100) DEFAULT 'Inspector In-Charge',
  phone VARCHAR(20) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 11. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS hospitals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hospital_name VARCHAR(150) NOT NULL,
  emergency_helpline VARCHAR(20) NOT NULL,
  trauma_center_available BOOLEAN DEFAULT TRUE,
  ambulance_count INT DEFAULT 5,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('sos_alert', 'danger_warning', 'incident_update', 'system', 'broadcast') DEFAULT 'system',
  channel ENUM('push', 'sms', 'email', 'in_app') DEFAULT 'in_app',
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message_text TEXT NOT NULL,
  location_payload JSON DEFAULT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 14. CHAT_HISTORY TABLE
CREATE TABLE IF NOT EXISTS chat_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id VARCHAR(60) NOT NULL,
  sender ENUM('user', 'ai') NOT NULL,
  message TEXT NOT NULL,
  language VARCHAR(20) DEFAULT 'en',
  intent_classified VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT DEFAULT NULL,
  category ENUM('sos_experience', 'app_usability', 'ai_assistant', 'police_response', 'general') DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 16. DEVICE_TOKENS TABLE
CREATE TABLE IF NOT EXISTS device_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  fcm_token VARCHAR(255) NOT NULL UNIQUE,
  device_type ENUM('android', 'ios', 'web') DEFAULT 'web',
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 17. OTP_VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_identifier VARCHAR(120) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose ENUM('registration', 'login', 'password_reset', 'phone_verify', 'registration_email', 'registration_sms') NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 18. PASSWORD_RESETS TABLE
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reset_token VARCHAR(255) NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 19. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  details JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 20. SCHEMA_MIGRATIONS META TABLE
CREATE TABLE IF NOT EXISTS schema_migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(150) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
