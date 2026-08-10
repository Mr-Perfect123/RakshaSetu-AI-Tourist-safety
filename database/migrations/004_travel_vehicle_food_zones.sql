-- ============================================================================
-- Migration: 004_travel_vehicle_food_zones.sql
-- Description: Add Danger Zones, Vehicle Booking, and Food Delivery modules
-- ============================================================================

USE rakshasetu_db;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. DANGER_ZONES TABLE
CREATE TABLE IF NOT EXISTS danger_zones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  zone_code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  description TEXT DEFAULT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INT DEFAULT 500,
  severity ENUM('low', 'moderate', 'high', 'critical') DEFAULT 'high',
  crime_type VARCHAR(100) DEFAULT 'High Theft / Scams Reported',
  advisory_message TEXT DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_danger_zone_coords (latitude, longitude),
  INDEX idx_danger_zone_active (is_active)
) ENGINE=InnoDB;

-- 2. VEHICLE_TYPES TABLE
CREATE TABLE IF NOT EXISTS vehicle_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type_key VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  icon VARCHAR(50) DEFAULT 'car',
  capacity INT DEFAULT 4,
  base_fare DECIMAL(8, 2) DEFAULT 50.00,
  per_km_rate DECIMAL(6, 2) DEFAULT 15.00,
  description VARCHAR(200) DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_type_id INT NOT NULL,
  vehicle_name VARCHAR(100) NOT NULL,
  registration_number VARCHAR(30) NOT NULL UNIQUE,
  driver_name VARCHAR(100) NOT NULL,
  driver_phone VARCHAR(20) NOT NULL,
  rating DECIMAL(3, 2) DEFAULT 4.90,
  image_url VARCHAR(255) DEFAULT NULL,
  status ENUM('available', 'on_trip', 'maintenance') DEFAULT 'available',
  current_latitude DECIMAL(10, 8) DEFAULT 28.6139,
  current_longitude DECIMAL(11, 8) DEFAULT 77.2090,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_type_id) REFERENCES vehicle_types(id) ON DELETE CASCADE,
  INDEX idx_vehicle_status (status)
) ENGINE=InnoDB;

-- 4. VEHICLE_BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS vehicle_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  vehicle_id INT DEFAULT NULL,
  vehicle_category VARCHAR(40) NOT NULL,
  pickup_location VARCHAR(200) NOT NULL,
  pickup_lat DECIMAL(10, 8) DEFAULT NULL,
  pickup_lng DECIMAL(11, 8) DEFAULT NULL,
  destination VARCHAR(200) NOT NULL,
  dest_lat DECIMAL(10, 8) DEFAULT NULL,
  dest_lng DECIMAL(11, 8) DEFAULT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  passengers INT DEFAULT 1,
  estimated_fare DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'in_transit', 'completed', 'cancelled') DEFAULT 'confirmed',
  payment_status ENUM('unpaid', 'paid', 'test_mode') DEFAULT 'test_mode',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  INDEX idx_booking_user (user_id),
  INDEX idx_booking_status (status)
) ENGINE=InnoDB;

-- 5. RESTAURANTS TABLE
CREATE TABLE IF NOT EXISTS restaurants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  cuisine_type VARCHAR(100) NOT NULL,
  rating DECIMAL(3, 2) DEFAULT 4.5,
  delivery_time_min INT DEFAULT 30,
  price_range VARCHAR(10) DEFAULT '₹₹',
  address VARCHAR(200) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  is_verified_hygiene BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 6. FOOD_ITEMS TABLE
CREATE TABLE IF NOT EXISTS food_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT NOT NULL,
  item_name VARCHAR(120) NOT NULL,
  description TEXT DEFAULT NULL,
  price DECIMAL(8, 2) NOT NULL,
  category ENUM('starter', 'main_course', 'dessert', 'beverage', 'snack') DEFAULT 'main_course',
  is_veg BOOLEAN DEFAULT TRUE,
  image_url VARCHAR(255) DEFAULT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_food_restaurant (restaurant_id)
) ENGINE=InnoDB;

-- 7. FOOD_ORDERS TABLE
CREATE TABLE IF NOT EXISTS food_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_code VARCHAR(30) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  restaurant_id INT NOT NULL,
  items_json JSON NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(8, 2) DEFAULT 0.00,
  delivery_fee DECIMAL(8, 2) DEFAULT 30.00,
  total_amount DECIMAL(10, 2) NOT NULL,
  delivery_address TEXT NOT NULL,
  delivery_lat DECIMAL(10, 8) DEFAULT NULL,
  delivery_lng DECIMAL(11, 8) DEFAULT NULL,
  status ENUM('placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled') DEFAULT 'placed',
  payment_status ENUM('pending', 'paid', 'cash_on_delivery') DEFAULT 'paid',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
  INDEX idx_order_user (user_id),
  INDEX idx_order_status (status)
) ENGINE=InnoDB;

-- SEED DATA FOR VEHICLES, FOOD & DANGER ZONES
INSERT IGNORE INTO vehicle_types (id, type_key, name, icon, capacity, base_fare, per_km_rate, description) VALUES
(1, 'scooter', 'Electric Scooter / Bike', 'bike', 1, 30.00, 8.00, 'Eco-friendly, fast city navigation'),
(2, 'hatchback', 'Economy Hatchback', 'car', 4, 60.00, 14.00, 'Compact, ideal for 1-3 passengers'),
(3, 'sedan', 'Comfort Sedan', 'car', 4, 100.00, 18.00, 'Air-conditioned luxury sedan'),
(4, 'suv', 'Safety SUV / Crossover', 'truck', 6, 150.00, 24.00, 'Spacious SUV with RakshaSetu GPS Tracking'),
(5, 'van', 'Tourist Minivan', 'bus', 10, 300.00, 35.00, 'Group travel with dedicated verified guide driver');

INSERT IGNORE INTO danger_zones (id, zone_code, name, description, latitude, longitude, radius_meters, severity, crime_type, advisory_message) VALUES
(1, 'DZ-DEL-001', 'Paharganj Alley Market', 'Narrow unlit corridors with high tout density.', 28.6420, 77.2180, 400, 'high', 'Pickpocketing & Overselling Scams', 'Avoid carrying visible valuables after 9 PM. Stay on main arterial streets.'),
(2, 'DZ-DEL-002', 'Old Delhi Railway Station Rear Gate', 'Congested transport hub with unauthorized taxi touts.', 28.6550, 77.2400, 600, 'critical', 'Taxi Scams & Unauthorized Solicitations', 'Only book taxis through verified RakshaSetu app or official pre-paid counters.'),
(3, 'DZ-DEL-003', 'Chandni Chowk Market Crowd Sector', 'Extremely dense foot traffic with frequent handbag snatching.', 28.6500, 77.2300, 500, 'moderate', 'Handbag Snatching & Overcrowding', 'Keep backpack in front and store passport in inner anti-theft pouch.');

INSERT IGNORE INTO restaurants (id, name, cuisine_type, rating, delivery_time_min, price_range, address, latitude, longitude, phone) VALUES
(1, 'Karim\'s Historic Mughlai', 'Mughlai & North Indian', 4.7, 35, '₹₹₹', 'Gali Kababian, Jama Masjid, Old Delhi', 28.6515, 77.2335, '+911123269880'),
(2, 'Saravana Bhavan Authentic South Indian', 'South Indian Vegetarian', 4.8, 25, '₹₹', 'P-15, Connaught Circus, New Delhi', 28.6325, 77.2195, '+911123304400'),
(3, 'Indian Accent Contemporary Fine Dining', 'Modern Indian Cuisine', 4.9, 45, '₹₹₹₹', 'The Lodhi, Lodhi Road, New Delhi', 28.5910, 77.2380, '+911124361234'),
(4, 'Bukhara Heritage Grill', 'Tandoori & Kebabs', 4.8, 40, '₹₹₹₹', 'ITC Maurya, Diplomatic Enclave, New Delhi', 28.5975, 77.1735, '+911126112233');

INSERT IGNORE INTO food_items (id, restaurant_id, item_name, description, price, category, is_veg) VALUES
(1, 1, 'Mutton Raan Special', 'Slow cooked tender mutton shank in spiced gravy', 750.00, 'main_course', FALSE),
(2, 1, 'Khamiri Roti', 'Traditional clay oven leavened bread', 45.00, 'starter', TRUE),
(3, 2, 'Special Masala Dosa', 'Crispy rice crepe filled with spiced potato masala', 220.00, 'main_course', TRUE),
(4, 2, 'Filter Coffee', 'Traditional South Indian chicory brewed filter coffee', 75.00, 'beverage', TRUE),
(5, 3, 'Meetha Neem Soft Shell Crab', 'Crispy soft shell crab with curry leaf butter', 950.00, 'main_course', FALSE),
(6, 4, 'Dal Bukhara', 'Black lentils simmered overnight with butter and tomato puree', 650.00, 'main_course', TRUE);

SET FOREIGN_KEY_CHECKS = 1;
