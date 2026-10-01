import { query, getClient } from '../db.js';
import crypto from 'crypto';

export const documentRepository = {
  /**
   * Save a document, its binary file, line items, and validation issues in a transaction
   */
  async createDocumentWithDetails(userId, fileMeta, fileBuffer, extracted, validation) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const docInsertSql = `
        INSERT INTO documents (
          user_id, original_filename, type, direction, status, error_message,
          confidence_score, extracted_data, file_hash, vendor_name, vendor_gstin,
          customer_name, customer_gstin, invoice_number, invoice_date, due_date,
          place_of_supply, subtotal, cgst, sgst, igst, cess, round_off, grand_total,
          currency, category, payment_status, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28
        ) RETURNING *;
      `;

      const docValues = [
        userId,
        fileMeta.filename,
        extracted.type || 'invoice',
        extracted.direction || 'purchase',
        validation?.status || 'done',
        null, // error_message
        extracted.confidenceScore || 85,
        JSON.stringify(extracted),
        fileHash,
        extracted.vendorName || null,
        extracted.vendorGstin || null,
        extracted.customerName || null,
        extracted.customerGstin || null,
        extracted.invoiceNumber || null,
        extracted.invoiceDate || null,
        extracted.dueDate || null,
        extracted.placeOfSupply || null,
        extracted.subtotal || 0,
        extracted.cgst || 0,
        extracted.sgst || 0,
        extracted.igst || 0,
        extracted.cess || 0,
        extracted.roundOff || 0,
        extracted.grandTotal || 0,
        extracted.currency || 'INR',
        extracted.category || 'other',
        extracted.paymentStatus || 'unpaid',
        extracted.notes || null
      ];

      const docRes = await client.query(docInsertSql, docValues);
      const document = docRes.rows[0];
      const docId = document.id;

      // Save file binary in document_files
      await client.query(
        `INSERT INTO document_files (document_id, file_data, mime_type, file_size)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (document_id) DO UPDATE 
         SET file_data = EXCLUDED.file_data, mime_type = EXCLUDED.mime_type, file_size = EXCLUDED.file_size`,
        [docId, fileBuffer, fileMeta.mimeType, fileBuffer.length]
      );

      // Save Line Items
      if (extracted.lineItems && Array.isArray(extracted.lineItems)) {
        for (let i = 0; i < extracted.lineItems.length; i++) {
          const item = extracted.lineItems[i];
          await client.query(
            `INSERT INTO line_items (
              document_id, position, description, hsn_sac, quantity, unit,
              unit_price, discount, taxable_amount, tax_rate, tax_amount, total
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              docId,
              item.position ?? i,
              item.description || `Item ${i + 1}`,
              item.hsnSac || null,
              item.quantity || 1,
              item.unit || 'pcs',
              item.unitPrice || 0,
              item.discount || 0,
              item.taxableAmount || 0,
              item.taxRate || 0,
              item.taxAmount || 0,
              item.total || 0
            ]
          );
        }
      }

      // Save Validation Issues
      if (validation?.issues && Array.isArray(validation.issues)) {
        for (const issue of validation.issues) {
          await client.query(
            `INSERT INTO validation_issues (document_id, severity, code, field, message, params)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [docId, issue.severity, issue.code, issue.field, issue.message, JSON.stringify(issue.params || {})]
          );
        }
      }

      await client.query('COMMIT');
      return document;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Record a failed extraction attempt
   */
  async createFailedDocument(userId, fileMeta, fileBuffer, errorMessage) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const docRes = await client.query(
        `INSERT INTO documents (
          user_id, original_filename, type, direction, status, error_message,
          confidence_score, file_hash, subtotal, grand_total
        ) VALUES ($1, $2, 'other', 'purchase', 'failed', $3, 0, $4, 0, 0)
        RETURNING *`,
        [userId, fileMeta.filename, errorMessage, fileHash]
      );
      const document = docRes.rows[0];

      await client.query(
        `INSERT INTO document_files (document_id, file_data, mime_type, file_size)
         VALUES ($1, $2, $3, $4)`,
        [document.id, fileBuffer, fileMeta.mimeType, fileBuffer.length]
      );

      await client.query('COMMIT');
      return document;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Get document by ID with line items and validation issues
   */
  async getDocumentById(userId, docId) {
    const docRes = await query(
      `SELECT d.* FROM documents d WHERE d.id = $1 AND d.user_id = $2`,
      [docId, userId]
    );
    if (!docRes.rows[0]) return null;

    const doc = docRes.rows[0];

    const [itemsRes, issuesRes] = await Promise.all([
      query(`SELECT * FROM line_items WHERE document_id = $1 ORDER BY position ASC`, [docId]),
      query(`SELECT * FROM validation_issues WHERE document_id = $1 ORDER BY id ASC`, [docId])
    ]);

    return {
      ...doc,
      line_items: itemsRes.rows,
      validation_issues: issuesRes.rows
    };
  },

  /**
   * Get file data for preview
   */
  async getDocumentFile(userId, docId) {
    const res = await query(
      `SELECT f.file_data, f.mime_type, f.file_size, d.original_filename
       FROM document_files f
       JOIN documents d ON d.id = f.document_id
       WHERE f.document_id = $1 AND d.user_id = $2`,
      [docId, userId]
    );
    return res.rows[0];
  },

  /**
   * Update editable fields on a document
   */
  async updateDocument(userId, docId, updates) {
    const fields = [
      'type', 'direction', 'vendor_name', 'vendor_gstin', 'customer_name',
      'customer_gstin', 'invoice_number', 'invoice_date', 'due_date',
      'place_of_supply', 'subtotal', 'cgst', 'sgst', 'igst', 'cess',
      'round_off', 'grand_total', 'category', 'payment_status', 'notes', 'status'
    ];

    const setClauses = [];
    const values = [docId, userId];
    let idx = 3;

    for (const key of fields) {
      if (updates[key] !== undefined) {
        setClauses.push(`${key} = $${idx++}`);
        values.push(updates[key]);
      }
    }

    if (setClauses.length === 0) return this.getDocumentById(userId, docId);

    await query(
      `UPDATE documents SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      values
    );

    return this.getDocumentById(userId, docId);
  },

  /**
   * Replace line items and validation issues for a document
   */
  async updateLineItemsAndIssues(docId, lineItems, issues, status) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Update document status
      if (status) {
        await client.query(`UPDATE documents SET status = $1, updated_at = NOW() WHERE id = $2`, [status, docId]);
      }

      // Replace Line Items
      if (lineItems) {
        await client.query(`DELETE FROM line_items WHERE document_id = $1`, [docId]);
        for (let i = 0; i < lineItems.length; i++) {
          const item = lineItems[i];
          await client.query(
            `INSERT INTO line_items (
              document_id, position, description, hsn_sac, quantity, unit,
              unit_price, discount, taxable_amount, tax_rate, tax_amount, total
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              docId,
              item.position ?? i,
              item.description || `Item ${i + 1}`,
              item.hsn_sac || item.hsnSac || null,
              item.quantity || 1,
              item.unit || 'pcs',
              item.unit_price || item.unitPrice || 0,
              item.discount || 0,
              item.taxable_amount || item.taxableAmount || 0,
              item.tax_rate || item.taxRate || 0,
              item.tax_amount || item.taxAmount || 0,
              item.total || 0
            ]
          );
        }
      }

      // Replace Validation Issues
      if (issues) {
        await client.query(`DELETE FROM validation_issues WHERE document_id = $1`, [docId]);
        for (const issue of issues) {
          await client.query(
            `INSERT INTO validation_issues (document_id, severity, code, field, message, params)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [docId, issue.severity, issue.code, issue.field, issue.message, JSON.stringify(issue.params || {})]
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Delete a document and its cascaded details
   */
  async deleteDocument(userId, docId) {
    const res = await query(
      `DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id`,
      [docId, userId]
    );
    return res.rowCount > 0;
  },

  /**
   * List documents with search, filters (type, direction, status), and pagination
   */
  async listUserDocuments(userId, { search, type, direction, status, limit = 20, offset = 0 }) {
    const where = ['d.user_id = $1'];
    const values = [userId];
    let idx = 2;

    if (search && search.trim()) {
      where.push(`(d.vendor_name ILIKE $${idx} OR d.customer_name ILIKE $${idx} OR d.invoice_number ILIKE $${idx} OR d.original_filename ILIKE $${idx})`);
      values.push(`%${search.trim()}%`);
      idx++;
    }

    if (type && type !== 'all') {
      where.push(`d.type = $${idx++}`);
      values.push(type);
    }

    if (direction && direction !== 'all') {
      where.push(`d.direction = $${idx++}`);
      values.push(direction);
    }

    if (status && status !== 'all') {
      where.push(`d.status = $${idx++}`);
      values.push(status);
    }

    const whereClause = where.join(' AND ');

    const countRes = await query(
      `SELECT COUNT(*)::int as total FROM documents d WHERE ${whereClause}`,
      values
    );
    const total = countRes.rows[0]?.total || 0;

    const dataValues = [...values, limit, offset];
    const docsRes = await query(
      `SELECT d.id, d.original_filename, d.type, d.direction, d.status, d.error_message,
              d.confidence_score, d.vendor_name, d.customer_name, d.invoice_number,
              d.invoice_date, d.due_date, d.subtotal, d.cgst, d.sgst, d.igst,
              d.grand_total, d.currency, d.category, d.payment_status, d.created_at,
              (SELECT COUNT(*)::int FROM validation_issues vi WHERE vi.document_id = d.id AND vi.severity = 'error') as error_issues_count,
              (SELECT COUNT(*)::int FROM validation_issues vi WHERE vi.document_id = d.id AND vi.severity = 'warning') as warning_issues_count
       FROM documents d
       WHERE ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      dataValues
    );

    return {
      documents: docsRes.rows,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  },

  /**
   * Compute Real Dashboard KPIs and Analytics from Database
   * Excludes failed and processing documents. Credit notes subtract.
   */
  async getDashboardMetrics(userId) {
    // 1. Overall Totals
    const kpiSql = `
      SELECT 
        -- Income (Sales documents, minus sales credit notes)
        COALESCE(SUM(CASE 
          WHEN direction = 'sales' AND type != 'credit_note' THEN grand_total 
          WHEN direction = 'sales' AND type = 'credit_note' THEN -grand_total 
          ELSE 0 
        END), 0) as total_income,

        -- Expenses (Purchase documents, minus purchase credit notes)
        COALESCE(SUM(CASE 
          WHEN direction = 'purchase' AND type != 'credit_note' THEN grand_total 
          WHEN direction = 'purchase' AND type = 'credit_note' THEN -grand_total 
          ELSE 0 
        END), 0) as total_expenses,

        -- GST Collected (Sales CGST + SGST + IGST)
        COALESCE(SUM(CASE 
          WHEN direction = 'sales' AND type != 'credit_note' THEN (cgst + sgst + igst)
          WHEN direction = 'sales' AND type = 'credit_note' THEN -(cgst + sgst + igst)
          ELSE 0 
        END), 0) as gst_collected,

        -- GST Paid (Purchase CGST + SGST + IGST)
        COALESCE(SUM(CASE 
          WHEN direction = 'purchase' AND type != 'credit_note' THEN (cgst + sgst + igst)
          WHEN direction = 'purchase' AND type = 'credit_note' THEN -(cgst + sgst + igst)
          ELSE 0 
        END), 0) as gst_paid,

        -- Receivables (Unpaid sales)
        COALESCE(SUM(CASE 
          WHEN direction = 'sales' AND payment_status = 'unpaid' AND type != 'credit_note' THEN grand_total 
          ELSE 0 
        END), 0) as receivables,

        -- Payables (Unpaid purchases)
        COALESCE(SUM(CASE 
          WHEN direction = 'purchase' AND payment_status = 'unpaid' AND type != 'credit_note' THEN grand_total 
          ELSE 0 
        END), 0) as payables,

        -- Overdue count (Unpaid with due_date < today)
        COUNT(CASE 
          WHEN payment_status = 'unpaid' AND due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 1 
          ELSE NULL 
        END) as overdue_count,

        -- Document count summary
        COUNT(*) as total_documents,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as done_count,
        COUNT(CASE WHEN status = 'needs_review' THEN 1 END) as needs_review_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count

      FROM documents
      WHERE user_id = $1 AND status NOT IN ('processing', 'failed');
    `;

    const kpiRes = await query(kpiSql, [userId]);
    const row = kpiRes.rows[0] || {};

    const income = Number(row.total_income) || 0;
    const expenses = Number(row.total_expenses) || 0;
    const netProfit = income - expenses;
    const gstCollected = Number(row.gst_collected) || 0;
    const gstPaid = Number(row.gst_paid) || 0;
    const netGstPayable = Math.max(0, gstCollected - gstPaid);
    const receivables = Number(row.receivables) || 0;
    const payables = Number(row.payables) || 0;
    const overdueCount = Number(row.overdue_count) || 0;

    // 2. Monthly Income vs Expenses (Last 6 Months)
    const monthlySql = `
      SELECT 
        TO_CHAR(COALESCE(invoice_date, created_at), 'Mon YYYY') as month_label,
        DATE_TRUNC('month', COALESCE(invoice_date, created_at)) as month_date,
        COALESCE(SUM(CASE WHEN direction = 'sales' AND type != 'credit_note' THEN grand_total ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN direction = 'purchase' AND type != 'credit_note' THEN grand_total ELSE 0 END), 0) as expense
      FROM documents
      WHERE user_id = $1 AND status NOT IN ('processing', 'failed')
        AND COALESCE(invoice_date, created_at) >= (CURRENT_DATE - INTERVAL '6 months')
      GROUP BY month_date, month_label
      ORDER BY month_date ASC;
    `;
    const monthlyRes = await query(monthlySql, [userId]);

    // 3. Expenses by Category
    const categorySql = `
      SELECT 
        COALESCE(category, 'other') as category,
        COALESCE(SUM(grand_total), 0) as total
      FROM documents
      WHERE user_id = $1 AND direction = 'purchase' AND status NOT IN ('processing', 'failed')
      GROUP BY category
      ORDER BY total DESC;
    `;
    const categoryRes = await query(categorySql, [userId]);

    return {
      kpis: {
        income,
        expenses,
        netProfit,
        gstCollected,
        gstPaid,
        netGstPayable,
        receivables,
        payables,
        overdueCount,
        totalDocuments: Number(row.total_documents) || 0,
        doneCount: Number(row.done_count) || 0,
        needsReviewCount: Number(row.needs_review_count) || 0,
        failedCount: Number(row.failed_count) || 0
      },
      monthlyTrends: monthlyRes.rows.map(r => ({
        month: r.month_label,
        income: Number(r.income) || 0,
        expense: Number(r.expense) || 0
      })),
      categoryBreakdown: categoryRes.rows.map(r => ({
        name: r.category.charAt(0).toUpperCase() + r.category.slice(1),
        value: Number(r.total) || 0
      }))
    };
  }
};
