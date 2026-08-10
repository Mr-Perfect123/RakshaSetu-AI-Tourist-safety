const { executeQuery } = require('../config/database');

class Payment {
  static async create({ user_id, amount, purpose = 'tourist_insurance', payment_gateway = 'upi', payment_method = 'UPI' }) {
    const transaction_id = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice_url = `/uploads/invoices/inv_${transaction_id}.pdf`;
    const sql = `
      INSERT INTO payments (transaction_id, user_id, amount, purpose, payment_gateway, payment_method, status, invoice_url)
      VALUES (?, ?, ?, ?, ?, ?, 'completed', ?)
    `;
    const result = await executeQuery(sql, [transaction_id, user_id, amount, purpose, payment_gateway, payment_method, invoice_url]);
    return this.findById(result.insertId || Date.now());
  }

  static async findById(id) {
    const sql = `SELECT * FROM payments WHERE id = ? LIMIT 1`;
    const rows = await executeQuery(sql, [id]);
    return rows[0] || null;
  }

  static async findByUserId(userId) {
    const sql = `SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC`;
    return await executeQuery(sql, [userId]);
  }

  static async processRefund(transactionId, reason = 'Customer request') {
    const refundId = `RFD-${Date.now()}`;
    const sql = `
      UPDATE payments
      SET status = 'refunded', refund_id = ?, failure_reason = ?
      WHERE transaction_id = ? OR id = ?
    `;
    await executeQuery(sql, [refundId, reason, transactionId, transactionId]);
    return { transactionId, refundId, status: 'refunded' };
  }
}

module.exports = Payment;
