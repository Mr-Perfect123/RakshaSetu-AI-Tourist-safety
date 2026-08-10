-- ============================================================================
-- Migration: 003_enterprise_modules.sql
-- Description: Add Customer Support, Service Cabins, Payments, and AI Safety Monitoring
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. CUSTOMER_SUPPORT_TICKETS TABLE
CREATE TABLE IF NOT EXISTS customer_support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_code VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  category ENUM('complaint', 'emergency_assistance', 'general_query', 'lost_and_found', 'billing') NOT NULL DEFAULT 'general_query',
  subject VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
  assigned_to INT DEFAULT NULL,
  resolution_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ticket_user (user_id),
  INDEX idx_ticket_status (status)
) ENGINE=InnoDB;

-- 2. SERVICE_CABINS TABLE (Tourist Assistance Points)
CREATE TABLE IF NOT EXISTS service_cabins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cabin_code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  location_name VARCHAR(200) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  manager_user_id INT DEFAULT NULL,
  services_offered JSON DEFAULT NULL,
  status ENUM('active', 'busy', 'maintenance', 'closed') DEFAULT 'active',
  operating_hours VARCHAR(100) DEFAULT '24/7',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_cabin_location (latitude, longitude)
) ENGINE=InnoDB;

-- 3. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_id VARCHAR(100) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  payment_gateway ENUM('razorpay', 'stripe', 'upi', 'netbanking', 'wallet') NOT NULL DEFAULT 'upi',
  payment_method VARCHAR(50) DEFAULT 'UPI',
  purpose ENUM('tourist_insurance', 'verified_guide', 'emergency_deposit', 'service_cabin_fee') NOT NULL,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  invoice_url VARCHAR(255) DEFAULT NULL,
  refund_id VARCHAR(100) DEFAULT NULL,
  failure_reason VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_payment_user (user_id),
  INDEX idx_payment_status (status)
) ENGINE=InnoDB;

-- 4. AI_SAFETY_LOGS TABLE
CREATE TABLE IF NOT EXISTS ai_safety_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  safety_score INT NOT NULL DEFAULT 85,
  risk_level ENUM('low', 'moderate', 'high', 'danger_zone') DEFAULT 'low',
  detected_anomalies JSON DEFAULT NULL,
  action_triggered ENUM('none', 'warning_sent', 'auto_sos_dispatched', 'patrol_notified') DEFAULT 'none',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ai_safety_user (user_id, created_at)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
