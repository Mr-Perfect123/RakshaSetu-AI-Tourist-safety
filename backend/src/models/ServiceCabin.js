const { executeQuery } = require('../config/database');

class ServiceCabin {
  static async create({ name, location_name, latitude, longitude, contact_phone, services_offered, manager_user_id = null }) {
    const cabin_code = `CABIN-${Date.now()}-${Math.floor(10 + Math.random() * 90)}`;
    const servicesJson = typeof services_offered === 'string' ? services_offered : JSON.stringify(services_offered || ['First Aid', 'SOS Dispatch', 'Language Guide']);
    const sql = `
      INSERT INTO service_cabins (cabin_code, name, location_name, latitude, longitude, contact_phone, services_offered, manager_user_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `;
    const result = await executeQuery(sql, [cabin_code, name, location_name, latitude, longitude, contact_phone, servicesJson, manager_user_id]);
    return this.findById(result.insertId || Date.now());
  }

  static async findById(id) {
    const sql = `SELECT * FROM service_cabins WHERE id = ? LIMIT 1`;
    const rows = await executeQuery(sql, [id]);
    return rows[0] || null;
  }

  static async findAll({ status, limit = 50 }) {
    let sql = `SELECT * FROM service_cabins WHERE 1=1`;
    const params = [];
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY id DESC LIMIT ?`;
    params.push(limit);
    return await executeQuery(sql, params);
  }

  static async findNearby(latitude, longitude, radiusKm = 10) {
    // Haversine formula query for nearby service cabins
    const sql = `
      SELECT *,
        ( 6371 * acos( cos( radians(?) ) * cos( radians( latitude ) )
        * cos( radians( longitude ) - radians(?) ) + sin( radians(?) )
        * sin( radians( latitude ) ) ) ) AS distance_km
      FROM service_cabins
      HAVING distance_km <= ?
      ORDER BY distance_km ASC
    `;
    return await executeQuery(sql, [latitude, longitude, latitude, radiusKm]);
  }
}

module.exports = ServiceCabin;
