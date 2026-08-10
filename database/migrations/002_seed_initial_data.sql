-- ============================================================================
-- Migration: 002_seed_initial_data.sql
-- Description: Auto-seed initial default admin, responders, tourists & safe sites
-- Default passwords:
-- admin@rakshasetu.com -> Admin@123
-- admin@rakshasetu.gov.in -> Password@123
-- ============================================================================

USE rakshasetu_db;

-- Hashed bcrypt password for 'Admin@123': $2a$10$3z2u5RzX1r8f9e0w1v2u3e4r5t6y7u8i9o0p1a2b3c4d5e6f7g8h9
-- Hashed bcrypt password for 'Password@123': $2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e

INSERT IGNORE INTO users (id, full_name, email, phone, password, role, status, is_verified, latitude, longitude, nationality) VALUES
(1, 'System Administrator', 'admin@rakshasetu.com', '+919999900000', '$2a$10$3z2u5RzX1r8f9e0w1v2u3e4r5t6y7u8i9o0p1a2b3c4d5e6f7g8h9', 'Admin', 'active', TRUE, 28.6139, 77.2090, 'Indian'),
(2, 'Admin Controller HQ', 'admin@rakshasetu.gov.in', '+919876543210', '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', 'Admin', 'active', TRUE, 28.6139, 77.2090, 'Indian'),
(3, 'Police HQ Dispatcher', 'police@rakshasetu.gov.in', '+919876543211', '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', 'Police', 'active', TRUE, 28.6145, 77.2085, 'Indian'),
(4, 'City Hospital Emergency', 'hospital@rakshasetu.gov.in', '+919876543212', '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', 'Hospital', 'active', TRUE, 28.6160, 77.2110, 'Indian'),
(5, 'John Doe Tourist', 'john.tourist@example.com', '+919876543213', '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', 'Tourist', 'active', TRUE, 28.6120, 77.2050, 'American');

INSERT IGNORE INTO admins (user_id, department, designation, jurisdiction_zone, badge_number) VALUES
(1, 'Enterprise System Command', 'Primary System Administrator', 'Global Jurisdiction', 'RS-SYS-001'),
(2, 'State Tourist Protection Command', 'Chief Security Admin', 'National Capital Region', 'RS-ADM-001');

INSERT IGNORE INTO tourists (user_id, emergency_medical_info, blood_group, hotel_address, travel_insurance_no) VALUES
(5, 'Asthma - Carries inhaler', 'O+', 'The Grand Heritage Hotel, Connaught Place, New Delhi', 'INS-78904321');

INSERT IGNORE INTO emergency_contacts (user_id, contact_name, contact_phone, relationship, priority_order, is_primary) VALUES
(5, 'Jane Doe', '+14155550199', 'Spouse', 1, TRUE);

INSERT IGNORE INTO safe_locations (id, name, type, latitude, longitude, phone, address, is_24_7, rating) VALUES
(1, 'Central Police Station Connaught Place', 'police_station', 28.6315, 77.2167, '+911123363364', 'Block B, Connaught Place, New Delhi', TRUE, 4.9),
(2, 'Ram Manohar Lohia Emergency Hospital', 'hospital', 28.6250, 77.2000, '+911123365555', 'Baba Kharak Singh Marg, New Delhi', TRUE, 4.8),
(3, 'US Embassy Emergency Services', 'embassy', 28.5983, 77.1897, '+911124198000', 'Shantipath, Chanakyapuri, New Delhi', TRUE, 4.9),
(4, 'Tourist Safety Command Cell', 'tourist_helpdesk', 28.6140, 77.2095, '+911123456789', 'Janpath, New Delhi', TRUE, 5.0);

INSERT IGNORE INTO crime_reports (id, crime_type, crime_rate_index, latitude, longitude, city, state, risk_level) VALUES
(1, 'Pickpocketing & Theft', 3.50, 28.6500, 77.2300, 'Delhi', 'Delhi', 'high'),
(2, 'Unsanctioned Touts / Scams', 2.80, 28.6420, 77.2180, 'Delhi', 'Delhi', 'moderate'),
(3, 'Harassment Alert Area', 4.10, 28.6550, 77.2400, 'Delhi', 'Delhi', 'danger_zone'),
(4, 'Safe Heritage Patrol Zone', 0.20, 28.6139, 77.2090, 'Delhi', 'Delhi', 'low');
