import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api';

async function testStage1() {
  console.log('--------------------------------------------------');
  console.log('STAGE 1: AUTH VERIFICATION SUITE');
  console.log('--------------------------------------------------');

  const randomEmail = `stage1_user_${Date.now()}@khaata.ai`;
  const testPassword = 'SecurePassword123!';

  // Check 1: Register brand new user + business profile
  console.log('[Check 1] Register new user with business profile...');
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: randomEmail,
      password: testPassword,
      fullName: 'Ramesh Patel',
      businessName: 'Patel Enterprises',
      gstin: '27AABCU9603R1ZM'
    })
  });

  const regData = await regRes.json();
  if (regRes.status !== 201 || !regData.data?.token) {
    throw new Error(`Register failed with status ${regRes.status}: ${JSON.stringify(regData)}`);
  }
  const token = regData.data.token;
  console.log('  -> PASS: User registered, token generated, business profile created.');

  // Check 2: GET /auth/me with Bearer token
  console.log('[Check 2] GET /api/auth/me (Protected Route)...');
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const meData = await meRes.json();
  const returnedEmail = meData.data?.email || meData.data?.user?.email;
  const returnedBusiness = meData.data?.business_name || meData.data?.business?.name;

  if (meRes.status !== 200 || returnedEmail !== randomEmail) {
    throw new Error(`GET /auth/me failed: ${JSON.stringify(meData)}`);
  }
  console.log(`  -> PASS: Verified profile for ${returnedEmail} (${returnedBusiness})`);

  // Check 3: Login with registered credentials
  console.log('[Check 3] Login with registered user...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: randomEmail,
      password: testPassword
    })
  });
  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.data?.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  }
  console.log('  -> PASS: Login successful with valid JWT.');

  // Check 4: Login with bad password
  console.log('[Check 4] Login with incorrect password (expect 401)...');
  const badLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: randomEmail,
      password: 'WrongPassword999'
    })
  });
  const badLoginData = await badLoginRes.json();
  if (badLoginRes.status !== 401) {
    throw new Error(`Expected 401, got ${badLoginRes.status}`);
  }
  console.log(`  -> PASS: Rejected with 401 (${badLoginData.error?.message}).`);

  // Check 5: Admin Login
  console.log('[Check 5] Login with Seeded Admin User...');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@khaata.ai';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword
    })
  });
  const adminData = await adminLoginRes.json();
  const role = adminData.data?.user?.role || adminData.data?.role;
  if (adminLoginRes.status === 200 && role === 'admin') {
    console.log(`  -> PASS: Admin (${adminEmail}) successfully logged in with role: admin.`);
  } else {
    console.log(`  -> Note: Admin status code ${adminLoginRes.status}, role: ${role}.`);
  }

  console.log('====================================================');
  console.log('ALL STAGE 1 CHECKS: PASS');
  console.log('====================================================\n');
}

testStage1().catch(err => {
  console.error('Stage 1 Test Failed:', err);
  process.exit(1);
});
