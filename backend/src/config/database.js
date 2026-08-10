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
  notifications: [],
  audit_logs: [
    { id: 1, action: 'SYSTEM_BOOT', details: 'RakshaSetu Emergency Dispatch Engine Initialized', created_at: new Date().toISOString() }
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
  try {
    if (dbConnected) {
      const [rows] = await pool.execute(sql, params);
      return rows;
    }
  } catch (err) {
    console.error(`[Database Error] SQL Execution failed: ${err.message}. Falling back to state engine.`);
  }

  // Resilient Fallback Simulator for development & offline testing
  const cleanSql = sql.trim().toLowerCase();

  if (cleanSql.includes('select * from users') || (cleanSql.includes('select') && cleanSql.includes('from users'))) {
    let result = [...inMemoryStore.users];

    if (cleanSql.includes('where email =') || cleanSql.includes('where phone =')) {
      const target = params[0];
      return inMemoryStore.users.filter(u => u.email === target || u.phone === target);
    }
    if (cleanSql.includes('where id =')) {
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

  return [];
};

module.exports = {
  pool,
  executeQuery,
  testConnection,
  inMemoryStore
};
