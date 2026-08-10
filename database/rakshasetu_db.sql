-- ============================================================================
-- RakshaSetu: AI Powered Tourist Protection & Emergency Response System
-- Database Schema DDL & Initial Seed Data
-- Database Name: rakshasetu_db
-- ============================================================================

CREATE DATABASE IF NOT EXISTS rakshasetu_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rakshasetu_db;

-- Disable foreign key checks for table creation
SET FOREIGN_KEY_CHECKS = 0;

-- 1. USERS TABLE
DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL UNIQUE,
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
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  department VARCHAR(100) NOT NULL DEFAULT 'General Safety Control Room',
  designation VARCHAR(80) NOT NULL DEFAULT 'Dispatcher',
  jurisdiction_zone VARCHAR(100) DEFAULT 'All-State',
  badge_number VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. TOURISTS TABLE
DROP TABLE IF EXISTS tourists;
CREATE TABLE tourists (
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
DROP TABLE IF EXISTS emergency_contacts;
CREATE TABLE emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  contact_name VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  relationship VARCHAR(50) DEFAULT 'Family',
  priority_order INT DEFAULT 1,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_contact (user_id)
) ENGINE=InnoDB;

-- 5. SOS_REQUESTS TABLE
DROP TABLE IF EXISTS sos_requests;
CREATE TABLE sos_requests (
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

-- 6. INCIDENT_REPORTS TABLE
DROP TABLE IF EXISTS incident_reports;
CREATE TABLE incident_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_code VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  category ENUM('crime', 'accident', 'missing_person', 'road_block', 'natural_disaster', 'scam', 'other') NOT NULL,
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

-- 7. CRIME_REPORTS TABLE
DROP TABLE IF EXISTS crime_reports;
CREATE TABLE crime_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crime_type VARCHAR(100) NOT NULL,
  crime_rate_index DECIMAL(4, 2) DEFAULT 0.00,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city VARCHAR(80) DEFAULT 'Delhi',
  state VARCHAR(80) DEFAULT 'Delhi',
  reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  risk_level ENUM('low', 'moderate', 'high', 'danger_zone') DEFAULT 'moderate',
  INDEX idx_crime_location (latitude, longitude),
  INDEX idx_crime_risk (risk_level)
) ENGINE=InnoDB;

-- 8. SAFE_LOCATIONS TABLE
DROP TABLE IF EXISTS safe_locations;
CREATE TABLE safe_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  type ENUM('police_station', 'hospital', 'embassy', 'tourist_helpdesk', 'shelter', 'safe_hotel') NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  address TEXT NOT NULL,
  is_24_7 BOOLEAN DEFAULT TRUE,
  rating DECIMAL(3, 2) DEFAULT 4.8,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_safe_loc_type (type),
  INDEX idx_safe_loc_coords (latitude, longitude)
) ENGINE=InnoDB;

-- 9. TOURIST_LOCATIONS TABLE
DROP TABLE IF EXISTS tourist_locations;
CREATE TABLE tourist_locations (
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

-- 10. NOTIFICATIONS TABLE
DROP TABLE IF EXISTS notifications;
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('sos_alert', 'danger_warning', 'incident_update', 'system', 'broadcast') DEFAULT 'system',
  channel ENUM('push', 'sms', 'email', 'in_app') DEFAULT 'in_app',
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_notif (user_id, is_read)
) ENGINE=InnoDB;

-- 11. FEEDBACK TABLE
DROP TABLE IF EXISTS feedback;
CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT DEFAULT NULL,
  category ENUM('sos_experience', 'app_usability', 'ai_assistant', 'police_response', 'general') DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. CHAT_HISTORY TABLE
DROP TABLE IF EXISTS chat_history;
CREATE TABLE chat_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id VARCHAR(60) NOT NULL,
  sender ENUM('user', 'ai') NOT NULL,
  message TEXT NOT NULL,
  language VARCHAR(20) DEFAULT 'en',
  intent_classified VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_session (user_id, session_id)
) ENGINE=InnoDB;

-- 13. AI_LOGS TABLE
DROP TABLE IF EXISTS ai_logs;
CREATE TABLE ai_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  action_type ENUM('crime_prediction', 'danger_zone_eval', 'safe_route', 'translation', 'chatbot_query') NOT NULL,
  input_payload JSON NOT NULL,
  ai_response JSON NOT NULL,
  execution_time_ms INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 14. DEVICE_TOKENS TABLE
DROP TABLE IF EXISTS device_tokens;
CREATE TABLE device_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  fcm_token VARCHAR(255) NOT NULL UNIQUE,
  device_type ENUM('android', 'ios', 'web') DEFAULT 'android',
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 15. OTP_VERIFICATION TABLE
DROP TABLE IF EXISTS otp_verification;
CREATE TABLE otp_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_identifier VARCHAR(120) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose ENUM('registration', 'login', 'password_reset', 'phone_verify') NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target_otp (target_identifier, otp_code)
) ENGINE=InnoDB;

-- 16. PASSWORD_RESET TABLE
DROP TABLE IF EXISTS password_reset;
CREATE TABLE password_reset (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  reset_token VARCHAR(255) NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 17. EMAIL_VERIFICATION TABLE
DROP TABLE IF EXISTS email_verification;
CREATE TABLE email_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  verification_token VARCHAR(255) NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 18. AUDIT_LOGS TABLE
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  details JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- INITIAL SEED DATA
-- Passwords below are hashed for 'Password@123'
-- ============================================================================

INSERT INTO users (id, full_name, email, phone, password, role, status, is_verified, latitude, longitude, nationality) VALUES
(1, 'Admin Controller', 'admin@rakshasetu.gov.in', '+919876543210', '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', 'Admin', 'active', TRUE, 28.6139, 77.2090, 'Indian'),
(2, 'Police HQ Dispatcher', 'police@rakshasetu.gov.in', '+919876543211', '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', 'Police', 'active', TRUE, 28.6145, 77.2085, 'Indian'),
(3, 'City Hospital Emergency', 'hospital@rakshasetu.gov.in', '+919876543212', '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', 'Hospital', 'active', TRUE, 28.6160, 77.2110, 'Indian'),
(4, 'John Doe Tourist', 'john.tourist@example.com', '+919876543213', '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', 'Tourist', 'active', TRUE, 28.6120, 77.2050, 'American');

INSERT INTO admins (user_id, department, designation, jurisdiction_zone, badge_number) VALUES
(1, 'State Tourist Protection Command', 'Chief Security Admin', 'National Capital Region', 'RS-ADM-001'),
(2, 'Central Police Emergency Response Unit', 'Senior Inspector Dispatcher', 'Central Sector', 'RS-POL-108');

INSERT INTO tourists (user_id, emergency_medical_info, blood_group, hotel_address, travel_insurance_no) VALUES
(4, 'Asthma - Carries inhaler', 'O+', 'The Grand Heritage Hotel, Connaught Place, New Delhi', 'INS-78904321');

INSERT INTO emergency_contacts (user_id, contact_name, contact_phone, relationship, priority_order, is_primary) VALUES
(4, 'Jane Doe', '+14155550199', 'Spouse', 1, TRUE),
(4, 'Robert Doe', '+14155550299', 'Brother', 2, FALSE);

INSERT INTO safe_locations (name, type, latitude, longitude, phone, address, is_24_7, rating) VALUES
('Central Police Station Connaught Place', 'police_station', 28.6315, 77.2167, '+911123363364', 'Block B, Connaught Place, New Delhi', TRUE, 4.9),
('Ram Manohar Lohia Hospital', 'hospital', 28.6250, 77.2000, '+911123365555', 'Baba Kharak Singh Marg, New Delhi', TRUE, 4.8),
('US Embassy Emergency Services', 'embassy', 28.5983, 77.1897, '+911124198000', 'Shantipath, Chanakyapuri, New Delhi', TRUE, 4.9),
('Tourist Safety Command Cell', 'tourist_helpdesk', 28.6140, 77.2095, '+911123456789', 'Janpath, New Delhi', TRUE, 5.0);

INSERT INTO crime_reports (crime_type, crime_rate_index, latitude, longitude, city, state, risk_level) VALUES
('Pickpocketing & Theft', 3.50, 28.6500, 77.2300, 'Delhi', 'Delhi', 'high'),
('Unsanctioned Touts / Scams', 2.80, 28.6420, 77.2180, 'Delhi', 'Delhi', 'moderate'),
('Harassment Alert Area', 4.10, 28.6550, 77.2400, 'Delhi', 'Delhi', 'danger_zone'),
('Safe Heritage Patrol Zone', 0.20, 28.6139, 77.2090, 'Delhi', 'Delhi', 'low');

INSERT INTO sos_requests (sos_code, user_id, trigger_type, latitude, longitude, address, status) VALUES
('SOS-2026-98124', 4, 'one_tap', 28.6120, 77.2050, 'Near India Gate Circle, New Delhi', 'active');

INSERT INTO incident_reports (report_code, user_id, category, title, description, severity, latitude, longitude, location_name, status) VALUES
('INC-2026-4401', 4, 'scam', 'Unregistered Auto Driver Charging Exorbitant Rate', 'Driver refused to use meter and locked vehicle doors until money was transferred.', 'medium', 28.6320, 77.2190, 'Connaught Place Outer Circle', 'under_investigation');
