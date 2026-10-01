import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../src/db.js';

async function seedDemo() {
  console.log('Seeding demo data for demo@khaata.ai...');

  const email = 'demo@khaata.ai';
  const password = 'demo123';
  const passwordHash = await bcrypt.hash(password, 12);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create or update Demo User
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, full_name, role, language, theme)
       VALUES ($1, $2, 'Vikram Malhotra', 'merchant', 'en', 'system')
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name
       RETURNING id;`,
      [email, passwordHash]
    );
    const userId = userRes.rows[0].id;

    // 2. Create or update Business Profile
    await client.query(
      `INSERT INTO business_profiles (user_id, business_name, gstin, state, address, currency)
       VALUES ($1, 'Malhotra Retail & Wholesale Traders', '27AABCM1234A1Z5', 'Maharashtra', '45 MG Road, Fort, Mumbai 400001', 'INR')
       ON CONFLICT (user_id) DO UPDATE 
       SET business_name = EXCLUDED.business_name, gstin = EXCLUDED.gstin, state = EXCLUDED.state;`,
      [userId]
    );

    // 3. Clear existing demo documents to make seed idempotent
    await client.query(`DELETE FROM documents WHERE user_id = $1`, [userId]);
    await client.query(`DELETE FROM bank_accounts WHERE user_id = $1`, [userId]);

    // 4. Create Bank Account
    const bankRes = await client.query(
      `INSERT INTO bank_accounts (user_id, account_name, opening_balance)
       VALUES ($1, 'HDFC Current A/c - 50200012345678', 150000.00)
       RETURNING id;`,
      [userId]
    );
    const bankId = bankRes.rows[0].id;

    // Helper to insert document with line items & fake PDF binary
    async function insertDoc(d, items = [], issues = []) {
      const dummyBuffer = Buffer.from(`%PDF-1.4 Mock Demo PDF for ${d.invoice_number}`);
      const fileHash = crypto.createHash('sha256').update(dummyBuffer).digest('hex');

      const docRes = await client.query(
        `INSERT INTO documents (
          user_id, original_filename, type, direction, status, error_message,
          confidence_score, extracted_data, file_hash, vendor_name, vendor_gstin,
          customer_name, customer_gstin, invoice_number, invoice_date, due_date,
          place_of_supply, subtotal, cgst, sgst, igst, cess, round_off, grand_total,
          currency, category, payment_status, notes, is_sample
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28, true
        ) RETURNING id;`,
        [
          userId,
          d.original_filename,
          d.type || 'invoice',
          d.direction || 'purchase',
          d.status || 'done',
          d.error_message || null,
          d.confidence_score || 95,
          JSON.stringify(d),
          fileHash,
          d.vendor_name || null,
          d.vendor_gstin || null,
          d.customer_name || null,
          d.customer_gstin || null,
          d.invoice_number || null,
          d.invoice_date || null,
          d.due_date || null,
          d.place_of_supply || 'Maharashtra',
          d.subtotal || 0,
          d.cgst || 0,
          d.sgst || 0,
          d.igst || 0,
          d.cess || 0,
          d.round_off || 0,
          d.grand_total || 0,
          'INR',
          d.category || 'other',
          d.payment_status || 'unpaid',
          d.notes || null
        ]
      );
      const docId = docRes.rows[0].id;

      // Save document file binary
      await client.query(
        `INSERT INTO document_files (document_id, file_data, mime_type, file_size)
         VALUES ($1, $2, 'application/pdf', $3)`,
        [docId, dummyBuffer, dummyBuffer.length]
      );

      // Line items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await client.query(
          `INSERT INTO line_items (
            document_id, position, description, hsn_sac, quantity, unit,
            unit_price, discount, taxable_amount, tax_rate, tax_amount, total
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            docId,
            i + 1,
            item.description,
            item.hsn_sac || '8471',
            item.quantity || 1,
            item.unit || 'pcs',
            item.unit_price || 0,
            item.discount || 0,
            item.taxable_amount || 0,
            item.tax_rate || 18,
            item.tax_amount || 0,
            item.total || 0
          ]
        );
      }

      // Validation issues
      for (const issue of issues) {
        await client.query(
          `INSERT INTO validation_issues (document_id, severity, code, field, message, params)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [docId, issue.severity, issue.code, issue.field, issue.message, JSON.stringify(issue.params || {})]
        );
      }

      // If paid, create bank transaction
      if (d.payment_status === 'paid' && d.status === 'done') {
        const txType = d.direction === 'sales' ? 'credit' : 'debit';
        await client.query(
          `INSERT INTO transactions (user_id, bank_account_id, document_id, type, amount, transaction_date, note)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, bankId, docId, txType, d.grand_total, d.invoice_date || '2026-09-01', `${d.type.toUpperCase()} payment for ${d.invoice_number}`]
        );
      }

      return docId;
    }

    // Document 1: Sales Invoice (Paid)
    await insertDoc({
      original_filename: 'Reliance_Retail_Aug2026.pdf',
      type: 'invoice',
      direction: 'sales',
      status: 'done',
      confidence_score: 98,
      customer_name: 'Reliance Retail Ltd',
      customer_gstin: '27AABCR9999R1Z1',
      invoice_number: 'INV-2026-081',
      invoice_date: '2026-08-10',
      due_date: '2026-09-10',
      subtotal: 50000,
      cgst: 4500,
      sgst: 4500,
      igst: 0,
      grand_total: 59000,
      category: 'inventory',
      payment_status: 'paid'
    }, [
      { description: 'Premium Basmati Rice 25kg Bags', quantity: 20, unit: 'bags', unit_price: 2500, taxable_amount: 50000, tax_rate: 18, tax_amount: 9000, total: 59000 }
    ]);

    // Document 2: Sales Invoice (Unpaid - Receivable)
    await insertDoc({
      original_filename: 'Future_Enterprises_Sep2026.pdf',
      type: 'invoice',
      direction: 'sales',
      status: 'done',
      confidence_score: 96,
      customer_name: 'Future Enterprises Pvt Ltd',
      customer_gstin: '27AACCF8888F1Z2',
      invoice_number: 'INV-2026-092',
      invoice_date: '2026-09-05',
      due_date: '2026-10-05',
      subtotal: 80000,
      cgst: 7200,
      sgst: 7200,
      igst: 0,
      grand_total: 94400,
      category: 'inventory',
      payment_status: 'unpaid'
    }, [
      { description: 'Refined Sunflower Oil Cans 15L', quantity: 50, unit: 'cans', unit_price: 1600, taxable_amount: 80000, tax_rate: 18, tax_amount: 14400, total: 94400 }
    ]);

    // Document 3: Sales Credit Note (Reduces Sales Income & GST)
    await insertDoc({
      original_filename: 'CN_Reliance_DamagedGoods.pdf',
      type: 'credit_note',
      direction: 'sales',
      status: 'done',
      confidence_score: 94,
      customer_name: 'Reliance Retail Ltd',
      customer_gstin: '27AABCR9999R1Z1',
      invoice_number: 'CN-2026-01',
      invoice_date: '2026-08-25',
      due_date: '2026-08-25',
      subtotal: 5000,
      cgst: 450,
      sgst: 450,
      igst: 0,
      grand_total: 5900,
      category: 'inventory',
      payment_status: 'paid',
      notes: 'Credit note for 2 bags damaged in transit'
    }, [
      { description: 'Damaged Goods Return - Basmati Rice', quantity: 2, unit: 'bags', unit_price: 2500, taxable_amount: 5000, tax_rate: 18, tax_amount: 900, total: 5900 }
    ]);

    // Document 4: Purchase Bill - Inventory (Paid)
    await insertDoc({
      original_filename: 'Godrej_Supplies_Aug.pdf',
      type: 'invoice',
      direction: 'purchase',
      status: 'done',
      confidence_score: 95,
      vendor_name: 'Godrej Agrovet Supplies Ltd',
      vendor_gstin: '27AAACG1111G1Z3',
      invoice_number: 'BILL-8901',
      invoice_date: '2026-08-12',
      due_date: '2026-08-12',
      subtotal: 30000,
      cgst: 2700,
      sgst: 2700,
      igst: 0,
      grand_total: 35400,
      category: 'inventory',
      payment_status: 'paid'
    }, [
      { description: 'Wholesale Mustard Oil Cases', quantity: 30, unit: 'cases', unit_price: 1000, taxable_amount: 30000, tax_rate: 18, tax_amount: 5400, total: 35400 }
    ]);

    // Document 5: Purchase Bill - Rent (Paid)
    await insertDoc({
      original_filename: 'Fort_Office_Rent_Sep.pdf',
      type: 'receipt',
      direction: 'purchase',
      status: 'done',
      confidence_score: 97,
      vendor_name: 'Nariman Commercial Realties',
      vendor_gstin: '27AAACN3333N1Z5',
      invoice_number: 'RENT-2026-09',
      invoice_date: '2026-09-01',
      due_date: '2026-09-01',
      subtotal: 25000,
      cgst: 2250,
      sgst: 2250,
      igst: 0,
      grand_total: 29500,
      category: 'rent',
      payment_status: 'paid'
    }, [
      { description: 'Commercial Warehouse Monthly Rent - Sep 2026', quantity: 1, unit: 'month', unit_price: 25000, taxable_amount: 25000, tax_rate: 18, tax_amount: 4500, total: 29500 }
    ]);

    // Document 6: Purchase Bill - Utilities (Unpaid & Overdue!)
    await insertDoc({
      original_filename: 'Tata_Power_Bill_Sep.pdf',
      type: 'invoice',
      direction: 'purchase',
      status: 'done',
      confidence_score: 93,
      vendor_name: 'Tata Power Company Ltd',
      vendor_gstin: '27AAACT2222T1Z4',
      invoice_number: 'UTIL-9205',
      invoice_date: '2026-09-18',
      due_date: '2026-09-28', // Past due date relative to Oct 01 -> Overdue!
      subtotal: 12000,
      cgst: 1080,
      sgst: 1080,
      igst: 0,
      grand_total: 14160,
      category: 'utilities',
      payment_status: 'unpaid'
    }, [
      { description: 'High Tension Commercial Power Consumption', quantity: 1, unit: 'bill', unit_price: 12000, taxable_amount: 12000, tax_rate: 18, tax_amount: 2160, total: 14160 }
    ]);

    // Document 7: Purchase Credit Note (Subtracts 2360 from expenses)
    await insertDoc({
      original_filename: 'PCN_Godrej_Discount.pdf',
      type: 'credit_note',
      direction: 'purchase',
      status: 'done',
      confidence_score: 90,
      vendor_name: 'Godrej Agrovet Supplies Ltd',
      vendor_gstin: '27AAACG1111G1Z3',
      invoice_number: 'PCN-05',
      invoice_date: '2026-08-30',
      due_date: '2026-08-30',
      subtotal: 2000,
      cgst: 180,
      sgst: 180,
      igst: 0,
      grand_total: 2360,
      category: 'inventory',
      payment_status: 'paid',
      notes: 'Vendor volume rebate credit note'
    }, [
      { description: 'Volume Rebate Credit', quantity: 1, unit: 'rebate', unit_price: 2000, taxable_amount: 2000, tax_rate: 18, tax_amount: 360, total: 2360 }
    ]);

    // Document 8: Needs Review Document with Validation Issues
    await insertDoc({
      original_filename: 'Apex_Suppliers_Disputed.pdf',
      type: 'invoice',
      direction: 'purchase',
      status: 'needs_review',
      confidence_score: 75,
      vendor_name: 'Apex Hardware Supplies',
      vendor_gstin: '27INVALIDGSTINX',
      customer_name: 'Malhotra Retail & Wholesale Traders',
      invoice_number: 'APEX-771',
      invoice_date: '2026-09-22',
      due_date: '2026-10-22',
      subtotal: 10000,
      cgst: 900,
      sgst: 900,
      igst: 0,
      grand_total: 13000, // Error: 10000 + 900 + 900 = 11800 != 13000!
      category: 'office',
      payment_status: 'unpaid'
    }, [
      { description: 'Heavy Duty Barcode Scanners', quantity: 2, unit: 'pcs', unit_price: 5000, taxable_amount: 10000, tax_rate: 18, tax_amount: 1800, total: 11800 }
    ], [
      { severity: 'error', code: 'TOTAL_MISMATCH', field: 'grand_total', message: 'Grand total (₹13,000.00) does not match subtotal + taxes (₹11,800.00, diff: ₹1,200.00)', params: { calculatedTotal: 11800, grandTotal: 13000 } },
      { severity: 'warning', code: 'INVALID_GSTIN', field: 'vendor_gstin', message: 'Vendor GSTIN format is invalid: 27INVALIDGSTINX', params: {} }
    ]);

    await client.query('COMMIT');
    console.log('✓ Demo data successfully seeded for demo@khaata.ai (Password: demo123).');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Failed to seed demo data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDemo();
