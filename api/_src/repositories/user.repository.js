import { query, getClient } from '../db.js';

export const userRepository = {
  async findByEmail(email) {
    const res = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return res.rows[0];
  },

  async findById(id) {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0];
  },

  async createUserWithProfile({ email, passwordHash, fullName, businessName, gstin, state }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const userRes = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, $3, 'merchant') RETURNING id`,
        [email.toLowerCase(), passwordHash, fullName]
      );
      const userId = userRes.rows[0].id;

      await client.query(
        `INSERT INTO business_profiles (user_id, business_name, gstin, state)
         VALUES ($1, $2, $3, $4)`,
        [userId, businessName, gstin, state]
      );

      await client.query('COMMIT');
      return userId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getProfile(userId) {
    const res = await query(
      `SELECT u.id, u.email, u.full_name, u.role, u.language, u.theme, u.text_size,
              p.business_name, p.gstin, p.state, p.address, p.currency
       FROM users u
       LEFT JOIN business_profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );
    return res.rows[0];
  },

  async updatePreferences(userId, { language, theme, text_size }) {
    await query(
      `UPDATE users SET language = COALESCE($2, language), theme = COALESCE($3, theme), text_size = COALESCE($4, text_size)
       WHERE id = $1`,
      [userId, language, theme, text_size]
    );
  },

  async updateProfile(userId, { fullName, businessName, gstin, state, address }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      if (fullName !== undefined) {
        await client.query(`UPDATE users SET full_name = $2 WHERE id = $1`, [userId, fullName]);
      }
      
      const updates = [];
      const values = [userId];
      let i = 2;
      
      if (businessName !== undefined) { updates.push(`business_name = $${i++}`); values.push(businessName); }
      if (gstin !== undefined) { updates.push(`gstin = $${i++}`); values.push(gstin); }
      if (state !== undefined) { updates.push(`state = $${i++}`); values.push(state); }
      if (address !== undefined) { updates.push(`address = $${i++}`); values.push(address); }
      
      if (updates.length > 0) {
        await client.query(
          `UPDATE business_profiles SET ${updates.join(', ')} WHERE user_id = $1`,
          values
        );
      }
      
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async updateLastLogin(userId) {
    await query(`UPDATE users SET last_login_at = NOW() WHERE id = $1`, [userId]);
  }
};
