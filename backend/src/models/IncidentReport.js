const { executeQuery } = require('../config/database');

class IncidentReport {
  static async create({ userId, category, title, description, severity = 'medium', latitude, longitude, locationName, imageUrls = [], videoUrls = [] }) {
    const reportCode = `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const sql = `
      INSERT INTO incident_reports (report_code, user_id, category, title, description, severity, latitude, longitude, location_name, image_urls, video_urls, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    const result = await executeQuery(sql, [
      reportCode,
      userId,
      category,
      title,
      description,
      severity,
      latitude,
      longitude,
      locationName,
      JSON.stringify(imageUrls),
      JSON.stringify(videoUrls)
    ]);
    const id = result.insertId || Date.now();
    return this.findById(id);
  }

  static async findById(id) {
    const sql = `
      SELECT i.*, u.full_name as reporter_name, u.phone as reporter_phone
      FROM incident_reports i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = ? LIMIT 1
    `;
    const rows = await executeQuery(sql, [id]);
    return rows[0] || null;
  }

  static async findAll({ category, status, limit = 50, offset = 0 }) {
    let sql = `
      SELECT i.*, u.full_name as reporter_name
      FROM incident_reports i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      sql += ` AND i.category = ?`;
      params.push(category);
    }
    if (status) {
      sql += ` AND i.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await executeQuery(sql, params);
  }

  static async updateStatus(id, status, verifiedBy = null) {
    const sql = `UPDATE incident_reports SET status = ?, verified_by = ? WHERE id = ?`;
    await executeQuery(sql, [status, verifiedBy, id]);
    return this.findById(id);
  }
}

module.exports = IncidentReport;
