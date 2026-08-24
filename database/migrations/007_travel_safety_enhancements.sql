-- ============================================================================
-- Migration: 007_travel_safety_enhancements.sql
-- Description: Add Travel Bookings table, extend Vehicle Bookings & Danger Zones with dynamic attributes
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. CREATE TRAVEL_BOOKINGS TABLE (Flights, Trains, Buses, Cabs, Rental Vehicles)
CREATE TABLE IF NOT EXISTS travel_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  travel_type ENUM('flight', 'train', 'bus', 'cab', 'rental') NOT NULL,
  from_location VARCHAR(200) NOT NULL,
  to_location VARCHAR(200) NOT NULL,
  travel_date DATE NOT NULL,
  travel_time TIME NOT NULL,
  passengers INT DEFAULT 1,
  operator_name VARCHAR(100) NOT NULL,
  vehicle_number VARCHAR(50) DEFAULT NULL,
  departure_time VARCHAR(20) DEFAULT NULL,
  arrival_time VARCHAR(20) DEFAULT NULL,
  duration VARCHAR(50) DEFAULT NULL,
  available_seats INT DEFAULT 4,
  fare DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'in_transit', 'completed', 'cancelled') DEFAULT 'confirmed',
  payment_status ENUM('unpaid', 'paid', 'test_mode') DEFAULT 'test_mode',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_travel_user (user_id),
  INDEX idx_travel_type (travel_type),
  INDEX idx_travel_status (status)
) ENGINE=InnoDB;

-- 2. EXTEND VEHICLE_BOOKINGS TABLE SCHEMA (Combined ALTER TABLE for MySQL safety)
ALTER TABLE vehicle_bookings 
  ADD COLUMN driver_id INT DEFAULT NULL,
  ADD COLUMN driver_name VARCHAR(100) DEFAULT NULL,
  ADD COLUMN driver_phone VARCHAR(20) DEFAULT NULL,
  ADD COLUMN driver_photo VARCHAR(255) DEFAULT NULL,
  ADD COLUMN driver_rating DECIMAL(3, 2) DEFAULT 4.90,
  ADD COLUMN vehicle_registration VARCHAR(40) DEFAULT NULL,
  ADD COLUMN base_fare DECIMAL(8, 2) DEFAULT 50.00,
  ADD COLUMN distance_km DECIMAL(6, 2) DEFAULT 5.00,
  ADD COLUMN distance_charge DECIMAL(10, 2) DEFAULT 70.00,
  ADD COLUMN taxes_fees DECIMAL(8, 2) DEFAULT 20.00;

-- 3. EXTEND DANGER_ZONES TABLE SCHEMA
ALTER TABLE danger_zones 
  ADD COLUMN crime_categories JSON DEFAULT NULL,
  ADD COLUMN recent_incidents JSON DEFAULT NULL,
  ADD COLUMN time_risk_description VARCHAR(255) DEFAULT 'High risk between 09:00 PM and 04:00 AM',
  ADD COLUMN precautions TEXT DEFAULT NULL,
  ADD COLUMN risk_score INT DEFAULT 85,
  ADD COLUMN safe_alternatives TEXT DEFAULT NULL,
  ADD COLUMN polygon_coordinates JSON DEFAULT NULL;

-- 4. SEED DESTINATION-SPECIFIC SAFETY ZONES (Coimbatore, Delhi, Goa, Agra, Madurai, Mumbai, Bangalore)
INSERT IGNORE INTO danger_zones (id, zone_code, name, description, latitude, longitude, radius_meters, severity, risk_score, crime_type, advisory_message, precautions, safe_alternatives) VALUES
(10, 'DZ-CBE-001', 'Town Hall Commercial Sector', 'High evening crowd density with reported luggage theft and tout solicitation.', 10.9980, 76.9650, 450, 'high', 78, 'Pickpocketing & Overselling Scams', 'Secure personal belongings in inner pouches. Avoid isolated alleys after 10 PM.', 'Use well-lit DB Road or Oppanakara Street main arterial road.', 'Use DB Road or Oppanakara Street safe corridor.'),
(11, 'DZ-CBE-002', 'Ukkadam Bus Stand Outer Circle', 'Congested transport node with unauthorized auto solicitations.', 10.9900, 76.9600, 500, 'critical', 88, 'Unauthorized Auto Solicitations & Theft', 'Book pre-paid taxis or RakshaSetu verified cabs. Keep phone stored securely.', 'Pre-paid taxi counter at Railway Station entrance.', 'Use verified pre-paid counter inside railway station.'),
(12, 'DZ-GOA-001', 'Calangute Night Corridor', 'Late night unlit beach stretches with water current hazards.', 15.5440, 73.7550, 600, 'high', 82, 'Night Current Hazards & Unauthorized Party Touts', 'Do not enter sea after 6:30 PM. Stay near Lifeguard Desk.', 'Baga Main Road Police Desk sector.', 'Utilize Baga Main Road well-lit paths.'),
(13, 'DZ-AGR-001', 'Taj West Gate Parking Alley', 'Aggressive unauthorized guide touts and souvenir scams.', 27.1730, 78.0380, 350, 'moderate', 62, 'Unauthorized Guide Solicitations', 'Buy entrance tickets exclusively via official ASI desk or online.', 'Taj East Gate Official Information Booth.', 'Proceed to official Information Booth at Taj East Gate.');

-- 5. SEED DYNAMIC VERIFIED DRIVERS / VEHICLES
INSERT IGNORE INTO vehicles (id, vehicle_type_id, vehicle_name, registration_number, driver_name, driver_phone, rating, image_url, status, current_latitude, current_longitude) VALUES
(10, 3, 'Toyota Etios Comfort', 'TN-37-RS-1001', 'Karthik Raja', '+919443322110', 4.95, 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80', 'available', 10.9980, 76.9650),
(11, 4, 'Mahindra XUV700 Safety SUV', 'TN-37-RS-2002', 'Murugan Swamy', '+919443322111', 4.92, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', 'available', 10.9920, 76.9610),
(12, 3, 'Honda City Executive Sedan', 'DL-01-RS-4488', 'Rajesh Kumar', '+919876543210', 4.88, 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&w=800&q=80', 'available', 28.6139, 77.2090),
(13, 2, 'Maruti Swift Dzire', 'GA-03-RS-8899', 'Anthony D\'Souza', '+919822114455', 4.90, 'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=800&q=80', 'available', 15.5553, 73.7517);

SET FOREIGN_KEY_CHECKS = 1;
