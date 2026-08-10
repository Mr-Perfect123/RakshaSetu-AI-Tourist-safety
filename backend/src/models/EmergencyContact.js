const { executeQuery } = require('../config/database');

class EmergencyContact {
  static async findByUserId(userId) {
    const sql = `SELECT * FROM emergency_contacts WHERE user_id = ? ORDER BY priority_order ASC`;
    return await executeQuery(sql, [userId]);
  }

  static async create({ userId, contactName, contactPhone, relationship = 'Family', isPrimary = false }) {
    const sql = `
      INSERT INTO emergency_contacts (user_id, contact_name, contact_phone, relationship, is_primary)
      VALUES (?, ?, ?, ?, ?)
    `;
    const result = await executeQuery(sql, [userId, contactName, contactPhone, relationship, isPrimary]);
    return { id: result.insertId, userId, contactName, contactPhone, relationship, isPrimary };
  }

  static async delete(id, userId) {
    const sql = `DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?`;
    return await executeQuery(sql, [id, userId]);
  }
}

module.exports = EmergencyContact;
