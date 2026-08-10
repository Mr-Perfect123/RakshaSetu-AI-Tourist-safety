const { executeQuery } = require('../config/database');

class SupportTicket {
  static async create({ user_id, category = 'general_query', subject, description, priority = 'medium' }) {
    const ticket_code = `TKT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const sql = `
      INSERT INTO customer_support_tickets (ticket_code, user_id, category, subject, description, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, 'open')
    `;
    const result = await executeQuery(sql, [ticket_code, user_id, category, subject, description, priority]);
    return this.findById(result.insertId || Date.now());
  }

  static async findById(id) {
    const sql = `SELECT * FROM customer_support_tickets WHERE id = ? LIMIT 1`;
    const rows = await executeQuery(sql, [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId) {
    const sql = `SELECT * FROM customer_support_tickets WHERE user_id = ? ORDER BY created_at DESC`;
    return await executeQuery(sql, [userId]);
  }

  static async findAll({ status, priority, limit = 50, offset = 0 }) {
    let sql = `SELECT * FROM customer_support_tickets WHERE 1=1`;
    const params = [];
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (priority) {
      sql += ` AND priority = ?`;
      params.push(priority);
    }
    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    return await executeQuery(sql, params);
  }

  static async updateStatus(id, status, resolution_notes = null, assigned_to = null) {
    const sql = `
      UPDATE customer_support_tickets
      SET status = ?, resolution_notes = COALESCE(?, resolution_notes), assigned_to = COALESCE(?, assigned_to)
      WHERE id = ?
    `;
    await executeQuery(sql, [status, resolution_notes, assigned_to, id]);
    return this.findById(id);
  }
}

module.exports = SupportTicket;
