const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rakshasetu_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const pool = mysql.createPool(dbConfig);

// In-memory fallback mock storage when MySQL connection is unavailable during development/testing
const inMemoryStore = {
  users: [
    { id: 1, full_name: 'Admin Controller', email: 'admin@rakshasetu.gov.in', phone: '+919876543210', password: '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', role: 'Admin', status: 'active', is_verified: 1, latitude: 28.6139, longitude: 77.2090, nationality: 'Indian' },
    { id: 2, full_name: 'Police HQ Dispatcher', email: 'police@rakshasetu.gov.in', phone: '+919876543211', password: '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', role: 'Police', status: 'active', is_verified: 1, latitude: 28.6145, longitude: 77.2085, nationality: 'Indian' },
    { id: 3, full_name: 'City Hospital Emergency', email: 'hospital@rakshasetu.gov.in', phone: '+919876543212', password: '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', role: 'Hospital', status: 'active', is_verified: 1, latitude: 28.6160, longitude: 77.2110, nationality: 'Indian' },
    { id: 4, full_name: 'John Doe Tourist', email: 'john.tourist@example.com', phone: '+919876543213', password: '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', role: 'Tourist', status: 'in_emergency', is_verified: 1, latitude: 28.6120, longitude: 77.2050, nationality: 'American', passport_number: 'US-98421034', gender: 'male', hotel_address: 'The Grand Heritage Hotel, Connaught Place, New Delhi', blood_group: 'O+', emergency_medical_info: 'Asthma - Carries inhaler' },
    { id: 5, full_name: 'Marie Laurent', email: 'marie.laurent@example.com', phone: '+33612345678', password: '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', role: 'Tourist', status: 'active', is_verified: 1, latitude: 28.6562, longitude: 77.2410, nationality: 'French', passport_number: 'FR-77619204', gender: 'female', hotel_address: 'Taj Palace Hotel, Chanakyapuri, New Delhi', blood_group: 'A+', emergency_medical_info: 'Penicillin Allergy' },
    { id: 6, full_name: 'Kenji Sato', email: 'kenji.sato@example.com', phone: '+819012345678', password: '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', role: 'Tourist', status: 'active', is_verified: 1, latitude: 28.6129, longitude: 77.2295, nationality: 'Japanese', passport_number: 'JP-44589123', gender: 'male', hotel_address: 'The Imperial, Janpath, New Delhi', blood_group: 'B+', emergency_medical_info: 'None' },
    { id: 7, full_name: 'Sarah Jenkins', email: 'sarah.jenkins@example.com', phone: '+447700900077', password: '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', role: 'Tourist', status: 'active', is_verified: 1, latitude: 28.5244, longitude: 77.1855, nationality: 'British', passport_number: 'UK-88129031', gender: 'female', hotel_address: 'Hyatt Regency, RK Puram, New Delhi', blood_group: 'AB-', emergency_medical_info: 'Diabetic - Type 1' },
    { id: 8, full_name: 'Alexander Mueller', email: 'alex.mueller@example.com', phone: '+4915123456789', password: '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', role: 'Tourist', status: 'active', is_verified: 1, latitude: 28.6328, longitude: 77.2197, nationality: 'German', passport_number: 'DE-30918274', gender: 'male', hotel_address: 'Le Meridien, Windsor Place, New Delhi', blood_group: 'O-', emergency_medical_info: 'None' },
    { id: 9, full_name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+919811223344', password: '$2a$10$7vN3gW.t.dGgQ6K2KxR0eu/x3b2mGzB9o1x8t3y0z1w2v3u4t5s6e', role: 'Tourist', status: 'active', is_verified: 1, latitude: 28.5535, longitude: 77.2588, nationality: 'Indian', passport_number: 'IND-99182374', gender: 'female', hotel_address: 'Resident - Greater Kailash, New Delhi', blood_group: 'B+', emergency_medical_info: 'Lactose Intolerant' }
  ],
  sos_requests: [
    { id: 1, sos_code: 'SOS-2026-98124', user_id: 4, tourist_name: 'John Doe Tourist', phone: '+919876543213', trigger_type: 'one_tap', latitude: 28.6120, longitude: 77.2050, address: 'Near India Gate Circle, New Delhi', status: 'active', created_at: new Date().toISOString() }
  ],
  incident_reports: [
    { id: 1, report_code: 'INC-2026-4401', user_id: 4, category: 'scam', title: 'Unregistered Auto Driver Charging Exorbitant Rate', description: 'Driver refused meter.', severity: 'medium', latitude: 28.6320, longitude: 77.2190, location_name: 'Connaught Place Outer Circle', status: 'under_investigation', created_at: new Date().toISOString() },
    { id: 2, report_code: 'INC-2026-4402', user_id: 5, category: 'crime', title: 'Pickpocketing Incident near Red Fort Entry Gate', description: 'Handbag taken while taking pictures near main gate.', severity: 'high', latitude: 28.6562, longitude: 77.2410, location_name: 'Red Fort Market Gate', status: 'pending', created_at: new Date().toISOString() },
    { id: 3, report_code: 'INC-2026-4403', user_id: 7, category: 'road_block', title: 'Heavy Traffic Block near Qutub Minar Crossing', description: 'Protest rally blocking main arterial road towards airport.', severity: 'low', latitude: 28.5244, longitude: 77.1855, location_name: 'Mehrauli Crossing', status: 'verified', created_at: new Date().toISOString() }
  ],
  safe_locations: [
    { id: 1, name: 'Central Police Station Connaught Place', type: 'police_station', latitude: 28.6315, longitude: 77.2167, phone: '+911123363364', address: 'Block B, Connaught Place, New Delhi', is_24_7: 1, rating: 4.9 },
    { id: 2, name: 'Ram Manohar Lohia Hospital', type: 'hospital', latitude: 28.6250, longitude: 77.2000, phone: '+911123365555', address: 'Baba Kharak Singh Marg, New Delhi', is_24_7: 1, rating: 4.8 },
    { id: 3, name: 'US Embassy Emergency Services', type: 'embassy', latitude: 28.5983, longitude: 77.1897, phone: '+911124198000', address: 'Shantipath, Chanakyapuri, New Delhi', is_24_7: 1, rating: 4.9 },
    { id: 4, name: 'Tourist Safety Command Cell', type: 'tourist_helpdesk', latitude: 28.6140, longitude: 77.2095, phone: '+911123456789', address: 'Janpath, New Delhi', is_24_7: 1, rating: 5.0 }
  ],
  crime_reports: [
    { id: 1, crime_type: 'Pickpocketing & Theft', crime_rate_index: 3.50, latitude: 28.6500, longitude: 77.2300, city: 'Delhi', state: 'Delhi', risk_level: 'high' },
    { id: 2, crime_type: 'Unsanctioned Touts / Scams', crime_rate_index: 2.80, latitude: 28.6420, longitude: 77.2180, city: 'Delhi', state: 'Delhi', risk_level: 'moderate' },
    { id: 3, crime_type: 'Harassment Alert Area', crime_rate_index: 4.10, latitude: 28.6550, longitude: 77.2400, city: 'Delhi', state: 'Delhi', risk_level: 'danger_zone' },
    { id: 4, crime_type: 'Safe Heritage Patrol Zone', crime_rate_index: 0.20, latitude: 28.6139, longitude: 77.2090, city: 'Delhi', state: 'Delhi', risk_level: 'low' }
  ],
  emergency_contacts: [
    { id: 1, user_id: 4, contact_name: 'Jane Doe', contact_phone: '+14155550199', relationship: 'Spouse', priority_order: 1, is_primary: 1 },
    { id: 2, user_id: 5, contact_name: 'Pierre Laurent', contact_phone: '+33699887766', relationship: 'Father', priority_order: 1, is_primary: 1 },
    { id: 3, user_id: 6, contact_name: 'Yoko Sato', contact_phone: '+819088776655', relationship: 'Wife', priority_order: 1, is_primary: 1 },
    { id: 4, user_id: 7, contact_name: 'David Jenkins', contact_phone: '+447700900112', relationship: 'Brother', priority_order: 1, is_primary: 1 }
  ],
  danger_zones: [
    {
      id: 1,
      zone_code: 'DZ-DEL-001',
      name: 'Paharganj Alley Market Sector',
      danger_type: 'THEFT',
      severity: 'high',
      description: 'Narrow unlit corridors with high evening tourist crowd density and reported pickpocketing.',
      safety_instructions: 'Keep phone and wallet secure. Use inner zipped pockets. Avoid walking alone after 10 PM.',
      recommended_action: 'Stick to the brightly lit main Main Bazar Road.',
      latitude: 28.6420,
      longitude: 77.2180,
      radius_meters: 350,
      warning_distance_meters: 150,
      network_status: 'available',
      source: 'Delhi Tourist Police Portal',
      source_url: 'https://delhipolice.gov.in',
      source_date: '2026-08-10',
      last_verified: '2026-08-25T12:00:00Z',
      country: 'India',
      state: 'Delhi',
      city: 'New Delhi',
      confidence: 'HIGH',
      is_active: 1,
      is_sample_data: 1,
      polygon_coordinates: JSON.stringify([
        [28.644, 77.216],
        [28.644, 77.220],
        [28.640, 77.220],
        [28.640, 77.216]
      ]),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      zone_code: 'DZ-ALPS-001',
      name: 'Matterhorn Glacier Crevasse Sector',
      danger_type: 'DANGEROUS_TERRAIN',
      severity: 'critical',
      description: 'Unstable snow bridges and active glacier crevasses outside marked ski boundaries.',
      safety_instructions: 'Stay strictly on marked runs. Hire an IFMGA-licensed alpine guide for off-piste touring.',
      recommended_action: 'Follow local ski patrol signs and do not cross protective rope barriers.',
      latitude: 46.0207,
      longitude: 7.7491,
      radius_meters: 800,
      warning_distance_meters: 300,
      network_status: 'available',
      source: 'Swiss Alpine Rescue Association',
      source_url: 'https://www.rega.ch',
      source_date: '2026-07-20',
      last_verified: '2026-08-28T09:00:00Z',
      country: 'Switzerland',
      state: 'Valais',
      city: 'Zermatt',
      confidence: 'VERY_HIGH',
      is_active: 1,
      is_sample_data: 1,
      polygon_coordinates: JSON.stringify([
        [46.024, 7.745],
        [46.024, 7.754],
        [46.017, 7.754],
        [46.017, 7.745]
      ]),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      zone_code: 'DZ-PARIS-001',
      name: 'Champ de Mars Pickpocket Ring',
      danger_type: 'THEFT',
      severity: 'moderate',
      description: 'Aggressive street petition scams and organized group pickpocketing targeting tourists near the Eiffel Tower.',
      safety_instructions: 'Ignore street petition requests. Do not place phone on tables or outer bags.',
      recommended_action: 'Report suspicious rings to nearby Gendarmerie patrols.',
      latitude: 48.8584,
      longitude: 2.2945,
      radius_meters: 450,
      warning_distance_meters: 200,
      network_status: 'available',
      source: 'Préfecture de Police de Paris',
      source_url: 'https://www.prefecturedepolice.interieur.gouv.fr',
      source_date: '2026-08-15',
      last_verified: '2026-08-27T15:30:00Z',
      country: 'France',
      state: 'Île-de-France',
      city: 'Paris',
      confidence: 'VERY_HIGH',
      is_active: 1,
      is_sample_data: 1,
      polygon_coordinates: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      zone_code: 'DZ-TOKYO-001',
      name: 'Kabukicho Solicitation Watch Area',
      danger_type: 'HIGH_CRIME',
      severity: 'moderate',
      description: 'Reports of drink-spiking scams and unauthorized tout solicitations in unlicensed basement bars.',
      safety_instructions: 'Do not follow touts offering cheap drink deals. Only enter bars with verified street-level entrances.',
      recommended_action: 'Proceed to well-lit main avenues of Shinjuku.',
      latitude: 35.6940,
      longitude: 139.7015,
      radius_meters: 300,
      warning_distance_meters: 100,
      network_status: 'available',
      source: 'Tokyo Metropolitan Police Department',
      source_url: 'https://www.keishicho.metro.tokyo.lg.jp',
      source_date: '2026-08-01',
      last_verified: '2026-08-26T08:00:00Z',
      country: 'Japan',
      state: 'Tokyo',
      city: 'Shinjuku',
      confidence: 'HIGH',
      is_active: 1,
      is_sample_data: 1,
      polygon_coordinates: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 5,
      zone_code: 'DZ-GC-001',
      name: 'Grand Canyon South Rim Cell Gap',
      danger_type: 'NO_NETWORK',
      severity: 'moderate',
      description: 'Limited/Unverified Network Coverage. Rugged terrain obstructs direct cell tower line-of-sight.',
      safety_instructions: 'Download offline maps before descent. Inform park rangers of your hiking schedule.',
      recommended_action: 'Download navigation guides and carry a satellite messenger if trekking deep trails.',
      latitude: 36.0544,
      longitude: -112.1401,
      radius_meters: 1200,
      warning_distance_meters: 400,
      network_status: 'unstable',
      source: 'National Park Service / GSMA coverage maps',
      source_url: 'https://www.nps.gov/grca',
      source_date: '2026-06-15',
      last_verified: '2026-08-20T10:00:00Z',
      country: 'United States',
      state: 'Arizona',
      city: 'Grand Canyon',
      confidence: 'MEDIUM',
      is_active: 1,
      is_sample_data: 1,
      polygon_coordinates: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 6,
      zone_code: 'DZ-GOA-002',
      name: 'Baga-Calangute Rip Current Sector',
      danger_type: 'DROWNING_RISK',
      severity: 'high',
      description: 'Sudden rip currents and high wave action with multiple reported drowning hazards near the beach shelf.',
      safety_instructions: 'Do not enter the sea after sunset. Swim strictly inside lifeguard-patrolled flags.',
      recommended_action: 'Follow lifeguard verbal warnings and stay in waist-deep water maximum.',
      latitude: 15.5520,
      longitude: 73.7510,
      radius_meters: 600,
      warning_distance_meters: 200,
      network_status: 'available',
      source: 'Goa Marine Lifesaver Services',
      source_url: 'https://www.goa.gov.in',
      source_date: '2026-08-22',
      last_verified: '2026-08-29T04:00:00Z',
      country: 'India',
      state: 'Goa',
      city: 'Calangute',
      confidence: 'VERY_HIGH',
      is_active: 1,
      is_sample_data: 1,
      polygon_coordinates: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 7,
      zone_code: 'DZ-OOTY-001',
      name: 'Doddabetta Hairpin Road Slip',
      danger_type: 'LANDSLIDE_RISK',
      severity: 'high',
      description: 'High risk of rockfalls and mud slips during heavy monsoon downpours on Doddabetta Peak road.',
      safety_instructions: 'Avoid travelling in heavy rain. Stay clear of cliffside shoulders.',
      recommended_action: 'Adhere to local police barricades and wait for clearance crews.',
      latitude: 11.4102,
      longitude: 76.6950,
      radius_meters: 500,
      warning_distance_meters: 200,
      network_status: 'available',
      source: 'Nilgiris District Disaster Management',
      source_url: 'https://nilgiris.nic.in',
      source_date: '2026-08-25',
      last_verified: '2026-08-29T09:00:00Z',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Ooty',
      confidence: 'VERY_HIGH',
      is_active: 1,
      is_sample_data: 1,
      polygon_coordinates: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  notifications: [],
  audit_logs: [
    { id: 1, action: 'SYSTEM_BOOT', details: 'RakshaSetu Emergency Dispatch Engine Initialized', created_at: new Date().toISOString() }
  ],
  tourist_activities: [
    { id: 1, user_id: 4, tourist_name: 'John Doe Tourist', activity_type: 'SEARCH_DESTINATION', description: 'Searched Coimbatore, Tamil Nadu', latitude: 11.0168, longitude: 76.9558, address: 'Coimbatore, Tamil Nadu', created_at: new Date().toISOString() },
    { id: 2, user_id: 4, tourist_name: 'John Doe Tourist', activity_type: 'VIEW_SAFETY_MAP', description: 'Viewed Live Tourist Safety Sentinel Map', latitude: 11.0168, longitude: 76.9558, address: 'Coimbatore, Tamil Nadu', created_at: new Date().toISOString() }
  ],
  vehicle_bookings: [
    {
      id: 1,
      booking_code: 'BK-RS-991001',
      user_id: 4,
      vehicle_category: 'sedan',
      pickup_location: 'Coimbatore Railway Station',
      pickup_lat: 11.0017,
      pickup_lng: 76.9629,
      destination: 'Marudamalai Temple, Coimbatore',
      dest_lat: 11.0478,
      dest_lng: 76.8524,
      booking_date: new Date().toISOString().split('T')[0],
      booking_time: '10:00',
      passengers: 2,
      estimated_fare: 450,
      final_fare: 450,
      ride_otp: '483921',
      status: 'OTP_PENDING',
      payment_status: 'PENDING',
      driver_name: 'Karthik Raja',
      driver_phone: '+919443322110',
      driver_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      driver_rating: 4.95,
      vehicle_registration: 'TN-37-RS-1001',
      distance_km: 16.8,
      created_at: new Date().toISOString()
    }
  ],
  travel_bookings: [
    {
      id: 1,
      booking_code: 'TR-RS-882001',
      user_id: 4,
      booking_type: 'train',
      source: 'Coimbatore Junction',
      destination: 'Chennai Central',
      travel_date: '2026-08-20',
      travel_time: '06:00 AM',
      passengers_json: JSON.stringify([{ name: 'John Doe Tourist', age: 30 }]),
      seat_class: 'Vande Bharat EC',
      ticket_number: 'VB-20644',
      total_price: 1365.00,
      status: 'confirmed',
      payment_status: 'paid',
      created_at: new Date().toISOString()
    }
  ],
  food_orders: [
    {
      id: 1,
      order_code: 'FD-RS-773001',
      user_id: 4,
      restaurant_id: 1,
      restaurant_name: 'Sri Annapoorna Gourmet',
      items_json: JSON.stringify([{ name: 'Ghee Roast Dosa', qty: 2, price: 120 }]),
      subtotal: 240,
      delivery_fee: 30,
      total_amount: 270,
      delivery_address: 'Hotel Reception Desk, Coimbatore',
      status: 'placed',
      payment_status: 'paid',
      created_at: new Date().toISOString()
    }
  ]
};

let dbConnected = false;

const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Successfully connected to MySQL database '${dbConfig.database}' on ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    dbConnected = true;
  } catch (error) {
    console.warn(`[Database Warning] MySQL connection failed (${error.message}). Operating with resilient hybrid data engine.`);
    dbConnected = false;
  }
};

testConnection();

const executeQuery = async (sql, params = []) => {
  if (dbConnected) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      console.error(`[Database Error] SQL Execution failed: ${err.message}. Falling back to in-memory store.`);
      // Fall through to in-memory store so the app keeps working
    }
  }

  // Resilient Fallback Simulator for development & offline testing
  const cleanSql = sql.trim().toLowerCase();

  if (cleanSql.includes('select * from tourist_activities')) {
    return [...inMemoryStore.tourist_activities];
  }

  if (cleanSql.includes('insert into tourist_activities')) {
    const newAct = {
      id: inMemoryStore.tourist_activities.length + 1,
      user_id: params[0] || 4,
      tourist_name: params[1] || 'Tourist',
      activity_type: params[2] || 'GENERAL_ACTIVITY',
      description: params[3] || 'Tourist Action',
      latitude: params[4] || 11.0168,
      longitude: params[5] || 76.9558,
      address: params[6] || 'Coimbatore',
      metadata_json: params[7] || '{}',
      created_at: new Date().toISOString()
    };
    inMemoryStore.tourist_activities.unshift(newAct);
    return { insertId: newAct.id, affectedRows: 1 };
  }

  if (cleanSql.includes('select * from vehicle_bookings')) {
    let list = [...inMemoryStore.vehicle_bookings];
    if (cleanSql.includes('id =')) {
      const id = params[0];
      return list.filter(b => b.id === parseInt(id, 10));
    }
    if (cleanSql.includes('user_id =')) {
      const userId = params[0];
      return list.filter(b => b.user_id === parseInt(userId, 10));
    }
    return list;
  }

  if (cleanSql.includes('insert into vehicle_bookings')) {
    const newBooking = {
      id: inMemoryStore.vehicle_bookings.length + 1,
      booking_code: params[0] || `BK-RS-${Date.now()}`,
      user_id: params[1] || 4,
      vehicle_id: params[2] || 1,
      vehicle_category: params[3] || 'sedan',
      pickup_location: params[4] || 'Current Location',
      pickup_lat: params[5] || 11.0168,
      pickup_lng: params[6] || 76.9558,
      destination: params[7] || 'Destination',
      dest_lat: params[8] || 11.0478,
      dest_lng: params[9] || 76.8524,
      booking_date: params[10] || new Date().toISOString().split('T')[0],
      booking_time: params[11] || '10:00',
      passengers: params[12] || 1,
      estimated_fare: params[13] || 350,
      ride_otp: params[14] || '483921',
      status: 'OTP_PENDING',
      payment_status: 'PENDING',
      driver_name: params[15] || 'Karthik Raja',
      driver_phone: params[16] || '+919443322110',
      driver_photo: params[17] || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      driver_rating: params[18] || 4.95,
      vehicle_registration: params[19] || 'TN-37-RS-1001',
      distance_km: params[21] || 12.0,
      created_at: new Date().toISOString()
    };
    inMemoryStore.vehicle_bookings.unshift(newBooking);
    return { insertId: newBooking.id, affectedRows: 1 };
  }

  if (cleanSql.includes('update vehicle_bookings')) {
    const id = params[params.length - 1];
    const b = inMemoryStore.vehicle_bookings.find(bk => bk.id === parseInt(id, 10));
    if (b) {
      if (cleanSql.includes('status = ?')) b.status = params[0];
      if (cleanSql.includes('payment_status = ?')) b.payment_status = params[0];
    }
    return { affectedRows: 1 };
  }

  if (cleanSql.includes('select * from travel_bookings')) {
    return inMemoryStore.travel_bookings;
  }

  if (cleanSql.includes('insert into travel_bookings')) {
    const newTravel = {
      id: inMemoryStore.travel_bookings.length + 1,
      booking_code: params[0] || `TR-RS-${Date.now()}`,
      user_id: params[1] || 4,
      travel_type: params[2] || 'flight',
      from_location: params[3] || 'Coimbatore',
      to_location: params[4] || 'Chennai',
      travel_date: params[5] || new Date().toISOString().split('T')[0],
      travel_time: params[6] || '08:00:00',
      passengers: params[7] || 1,
      operator_name: params[8] || 'RakshaSetu Verified Partner',
      vehicle_number: params[9] || 'RS-TRAV-101',
      departure_time: params[10] || '08:00:00',
      arrival_time: params[11] || '13:00:00',
      duration: params[12] || '5 Hours',
      fare: params[13] || 1500.00,
      status: 'confirmed',
      payment_status: 'paid',
      created_at: new Date().toISOString()
    };
    inMemoryStore.travel_bookings.unshift(newTravel);
    return { insertId: newTravel.id, affectedRows: 1 };
  }

  if (cleanSql.includes('select * from food_orders') || (cleanSql.includes('select') && cleanSql.includes('from food_orders'))) {
    const userId = params.length > 0 ? parseInt(params[0], 10) : null;
    if (userId && cleanSql.includes('user_id')) {
      return inMemoryStore.food_orders.filter(o => o.user_id === userId);
    }
    return inMemoryStore.food_orders;
  }

  if (cleanSql.includes('insert into food_orders')) {
    const newOrder = {
      id: inMemoryStore.food_orders.length + 1,
      order_code: params[0] || `FD-RS-${Date.now()}`,
      user_id: params[1] || 4,
      restaurant_id: params[2] || 1,
      items_json: params[3] || '[]',
      subtotal: params[4] || 0,
      delivery_fee: params[5] || 30,
      total_amount: params[6] || 0,
      delivery_address: params[7] || 'Hotel Reception Desk',
      status: 'placed',
      payment_status: 'paid',
      created_at: new Date().toISOString()
    };
    inMemoryStore.food_orders.unshift(newOrder);
    return { insertId: newOrder.id, affectedRows: 1 };
  }

  if (cleanSql.includes('select * from users') || (cleanSql.includes('select') && cleanSql.includes('from users'))) {
    let result = [...inMemoryStore.users];

    if (cleanSql.includes('email =') || cleanSql.includes('phone =')) {
      const target = params[0];
      return inMemoryStore.users.filter(u => u.email === target || u.phone === target);
    }
    if (cleanSql.includes('id =')) {
      const id = parseInt(params[0], 10);
      return inMemoryStore.users.filter(u => u.id === id);
    }
    if (cleanSql.includes('role =')) {
      const roleParam = params.find(p => typeof p === 'string' && ['Admin', 'Tourist', 'Police', 'Hospital'].includes(p));
      if (roleParam) {
        result = result.filter(u => u.role === roleParam);
      }
    }
    return result;
  }

  if (cleanSql.includes('select') && cleanSql.includes('from sos_requests')) {
    return inMemoryStore.sos_requests;
  }

  if (cleanSql.includes('select') && cleanSql.includes('from incident_reports')) {
    return inMemoryStore.incident_reports;
  }

  if (cleanSql.includes('select') && cleanSql.includes('from safe_locations')) {
    return inMemoryStore.safe_locations;
  }

  if (cleanSql.includes('select') && cleanSql.includes('from crime_reports')) {
    return inMemoryStore.crime_reports;
  }

  if (cleanSql.includes('select') && cleanSql.includes('from emergency_contacts')) {
    const userId = params[0];
    return inMemoryStore.emergency_contacts.filter(c => c.user_id === parseInt(userId, 10));
  }

  if (cleanSql.includes('insert into users')) {
    const newUser = {
      id: inMemoryStore.users.length + 1,
      full_name: params[0] || 'New User',
      email: params[1] || `user${Date.now()}@example.com`,
      phone: params[2] || `+91${Date.now()}`.substring(0, 13),
      password: params[3],
      role: params[4] || 'Tourist',
      status: 'active',
      is_verified: 1,
      created_at: new Date().toISOString()
    };
    inMemoryStore.users.push(newUser);
    return { insertId: newUser.id, affectedRows: 1 };
  }

  if (cleanSql.includes('insert into sos_requests')) {
    const newSos = {
      id: inMemoryStore.sos_requests.length + 1,
      sos_code: params[0] || `SOS-${Date.now()}`,
      user_id: params[1] || 4,
      trigger_type: params[2] || 'one_tap',
      latitude: params[3] || 28.6139,
      longitude: params[4] || 77.2090,
      address: params[5] || 'Current GPS Location',
      status: 'active',
      created_at: new Date().toISOString()
    };
    inMemoryStore.sos_requests.unshift(newSos);
    return { insertId: newSos.id, affectedRows: 1 };
  }

  if (cleanSql.includes('insert into safe_locations')) {
    const newLoc = {
      id: inMemoryStore.safe_locations.length + 1,
      name: params[0],
      type: params[1],
      latitude: params[2],
      longitude: params[3],
      phone: params[4],
      address: params[5],
      is_24_7: 1,
      rating: 4.8
    };
    inMemoryStore.safe_locations.push(newLoc);
    return { insertId: newLoc.id, affectedRows: 1 };
  }

  if (cleanSql.includes('danger_zones')) {
    if (cleanSql.includes('select')) {
      let list = [...inMemoryStore.danger_zones];
      if (cleanSql.includes('id =')) {
        const id = params[0];
        return list.filter(z => z.id === parseInt(id, 10));
      }
      if (params.length >= 4 && cleanSql.includes('latitude') && cleanSql.includes('longitude')) {
        const minLat = parseFloat(params[0]);
        const maxLat = parseFloat(params[1]);
        const minLng = parseFloat(params[2]);
        const maxLng = parseFloat(params[3]);
        list = list.filter(z => z.latitude >= minLat && z.latitude <= maxLat && z.longitude >= minLng && z.longitude <= maxLng);
      }
      if (cleanSql.includes('is_active = true') || cleanSql.includes('is_active = 1')) {
        list = list.filter(z => z.is_active === 1 || z.is_active === true);
      }
      return list;
    }

    if (cleanSql.includes('insert into')) {
      const newZone = {
        id: inMemoryStore.danger_zones.length + 1,
        zone_code: params[0] || `DZ-${Date.now().toString().slice(-6)}`,
        name: params[1] || 'Hazard Zone',
        description: params[2] || '',
        latitude: parseFloat(params[3]) || 28.6139,
        longitude: parseFloat(params[4]) || 77.2090,
        radius_meters: parseInt(params[5], 10) || 500,
        warning_distance_meters: parseInt(params[6], 10) || 200,
        severity: params[7] || 'high',
        danger_type: params[8] || 'THEFT',
        safety_instructions: params[9] || 'Stay alert and avoid displaying valuables.',
        recommended_action: params[10] || 'Move toward a safer public area.',
        network_status: params[11] || 'available',
        is_active: 1,
        is_sample_data: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      inMemoryStore.danger_zones.unshift(newZone);
      return { insertId: newZone.id, affectedRows: 1 };
    }

    if (cleanSql.includes('update')) {
      if (cleanSql.includes('is_active = not is_active')) {
        const id = parseInt(params[0], 10);
        const z = inMemoryStore.danger_zones.find(item => item.id === id);
        if (z) {
          z.is_active = z.is_active === 1 ? 0 : 1;
          z.updated_at = new Date().toISOString();
        }
        return { affectedRows: 1 };
      }
      const id = parseInt(params[params.length - 1], 10);
      const z = inMemoryStore.danger_zones.find(item => item.id === id);
      if (z) {
        // Generic update parameters
        if (params.length >= 8) {
          z.name = params[0] || z.name;
          z.description = params[1] || z.description;
          z.latitude = parseFloat(params[2]) || z.latitude;
          z.longitude = parseFloat(params[3]) || z.longitude;
          z.radius_meters = parseInt(params[4], 10) || z.radius_meters;
          z.warning_distance_meters = parseInt(params[5], 10) || z.warning_distance_meters;
          z.severity = params[6] || z.severity;
          z.danger_type = params[7] || z.danger_type;
          z.safety_instructions = params[8] || z.safety_instructions;
          z.recommended_action = params[9] || z.recommended_action;
        }
        z.updated_at = new Date().toISOString();
      }
      return { affectedRows: 1 };
    }

    if (cleanSql.includes('delete from')) {
      const id = parseInt(params[0], 10);
      inMemoryStore.danger_zones = inMemoryStore.danger_zones.filter(z => z.id !== id);
      return { affectedRows: 1 };
    }
  }

  return [];
};

module.exports = {
  pool,
  executeQuery,
  testConnection,
  inMemoryStore
};
