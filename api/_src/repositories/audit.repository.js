import { query } from '../db.js';

export const auditRepository = {
  async log(userId, action, details = {}) {
    await query(
      `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
      [userId, action, JSON.stringify(details)]
    );
  }
};
