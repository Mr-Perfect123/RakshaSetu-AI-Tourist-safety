const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    const sql = `
      SELECT u.*, t.preferred_language 
      FROM users u 
      LEFT JOIN tourists t ON u.id = t.user_id 
      WHERE u.email = ? LIMIT 1
    `;
    const rows = await executeQuery(sql, [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const sql = `
      SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status, u.is_verified, u.gender, u.nationality, u.passport_number, u.latitude, u.longitude, u.profile_image, u.created_at, t.preferred_language 
      FROM users u 
      LEFT JOIN tourists t ON u.id = t.user_id 
      WHERE u.id = ? LIMIT 1
    `;
    const rows = await executeQuery(sql, [id]);
    return rows[0] || null;
  }

  static async create({ full_name, email, phone, password, role = 'Tourist', nationality = 'Indian', gender = 'prefer_not_to_say' }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const sql = `
      INSERT INTO users (full_name, email, phone, password, role, nationality, gender, is_verified, email_verified, phone_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, FALSE, FALSE, FALSE)
    `;
    const result = await executeQuery(sql, [full_name, email, phone, hashedPassword, role, nationality, gender]);
    const userId = result?.insertId || result?.[0]?.id || Date.now();
    const createdUser = await this.findById(userId);
    if (!createdUser) {
      return {
        id: userId,
        full_name,
        email,
        phone,
        role,
        nationality,
        gender,
        is_verified: false,
        email_verified: false,
        phone_verified: false,
        status: 'active'
      };
    }
    return createdUser;
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    // Validate inputs before bcrypt comparison to avoid unexpected behavior
    if (
      !candidatePassword ||
      typeof candidatePassword !== 'string' ||
      !hashedPassword ||
      typeof hashedPassword !== 'string' ||
      hashedPassword.trim() === ''
    ) {
      return false;
    }

    try {
      return await bcrypt.compare(candidatePassword, hashedPassword);
    } catch {
      // bcrypt throws on malformed hashes — treat as authentication failure, not a crash
      return false;
    }
  }

  static async updateLocation(userId, latitude, longitude) {
    const sql = `UPDATE users SET latitude = ?, longitude = ?, last_active_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await executeQuery(sql, [latitude, longitude, userId]);
    return { userId, latitude, longitude };
  }

  static async updateProfile(userId, updateFields) {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updateFields)) {
      if (['full_name', 'phone', 'gender', 'nationality', 'passport_number', 'profile_image'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) return this.findById(userId);

    values.push(userId);
    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, values);
    return this.findById(userId);
  }

  static async findAll({ role, search, limit = 50, offset = 0 }) {
    let sql = `SELECT id, full_name, email, phone, role, status, is_verified, nationality, latitude, longitude, created_at FROM users WHERE 1=1`;
    const params = [];

    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }

    if (search) {
      sql += ` AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    return await executeQuery(sql, params);
  }
}

module.exports = User;
