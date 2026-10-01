import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';
import { config } from '../src/config.js';

async function seedAdmin() {
  const { adminEmail, adminPassword } = config;

  if (!adminEmail || !adminPassword) {
    console.error('✗ ADMIN_EMAIL or ADMIN_PASSWORD is not set in .env');
    process.exit(1);
  }

  try {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    
    // Insert or update the admin user
    await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, 'System Admin', 'admin')
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, role = 'admin', is_active = true`,
      [adminEmail.toLowerCase(), passwordHash]
    );

    console.log(`✓ Admin user seeded/updated: ${adminEmail}`);
  } catch (err) {
    console.error('✗ Failed to seed admin:', err.message);
  } finally {
    await pool.end();
  }
}

seedAdmin();
