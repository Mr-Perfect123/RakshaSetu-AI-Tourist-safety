const { executeQuery } = require('../config/database');

class SafeLocation {
  static async findNearby(latitude, longitude, radiusKm = 10, type = null) {
    let sql = `
      SELECT *,
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance_km
      FROM safe_locations
      WHERE 1=1
    `;
    const params = [latitude, longitude, latitude];

    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    sql += ` HAVING distance_km <= ? ORDER BY distance_km ASC LIMIT 20`;
    params.push(radiusKm);

    return await executeQuery(sql, params);
  }

  static async findAll() {
    const sql = `SELECT * FROM safe_locations ORDER BY rating DESC`;
    return await executeQuery(sql, []);
  }

  static async create({ name, type, latitude, longitude, phone, address, is_24_7 = true }) {
    const sql = `
      INSERT INTO safe_locations (name, type, latitude, longitude, phone, address, is_24_7)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await executeQuery(sql, [name, type, latitude, longitude, phone, address, is_24_7]);
    return { id: result.insertId, name, type, latitude, longitude, phone, address, is_24_7 };
  }
}

module.exports = SafeLocation;
