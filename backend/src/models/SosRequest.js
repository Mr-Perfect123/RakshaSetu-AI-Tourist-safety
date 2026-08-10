const { executeQuery } = require('../config/database');

class SosRequest {
  static async create({ userId, triggerType = 'one_tap', latitude, longitude, address, audioRecordingUrl = null }) {
    const sosCode = `SOS-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const sql = `
      INSERT INTO sos_requests (sos_code, user_id, trigger_type, latitude, longitude, address, audio_recording_url, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `;
    const result = await executeQuery(sql, [sosCode, userId, triggerType, latitude, longitude, address, audioRecordingUrl]);
    const sosId = result.insertId || Date.now();
    return this.findById(sosId);
  }

  static async findById(id) {
    const sql = `
      SELECT s.*, u.full_name as tourist_name, u.phone as tourist_phone, u.nationality
      FROM sos_requests s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ? LIMIT 1
    `;
    const rows = await executeQuery(sql, [id]);
    return rows[0] || null;
  }

  static async findActive() {
    const sql = `
      SELECT s.*, u.full_name as tourist_name, u.phone as tourist_phone, u.nationality
      FROM sos_requests s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.status IN ('active', 'dispatched')
      ORDER BY s.created_at DESC
    `;
    return await executeQuery(sql, []);
  }

  static async findByUserId(userId) {
    const sql = `SELECT * FROM sos_requests WHERE user_id = ? ORDER BY created_at DESC`;
    return await executeQuery(sql, [userId]);
  }

  static async updateStatus(id, status, assignedPoliceId = null, assignedHospitalId = null, resolutionNotes = null) {
    const fields = ['status = ?'];
    const values = [status];

    if (assignedPoliceId) {
      fields.push('assigned_police_id = ?');
      values.push(assignedPoliceId);
    }
    if (assignedHospitalId) {
      fields.push('assigned_hospital_id = ?');
      values.push(assignedHospitalId);
    }
    if (resolutionNotes) {
      fields.push('resolution_notes = ?');
      values.push(resolutionNotes);
    }
    if (status === 'resolved') {
      fields.push('resolved_at = CURRENT_TIMESTAMP');
    }

    values.push(id);
    const sql = `UPDATE sos_requests SET ${fields.join(', ')} WHERE id = ?`;
    await executeQuery(sql, values);
    return this.findById(id);
  }
}

module.exports = SosRequest;
