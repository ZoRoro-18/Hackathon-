import { query, getClient } from '../db.js';
import crypto from 'crypto';

export const documentRepository = {
  async createDocument(userId, docData, extractedData) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      
      const fileHash = crypto.createHash('sha256').update(docData.filename + Date.now()).digest('hex');

      const docRes = await client.query(
        `INSERT INTO documents (
          user_id, original_filename, type, direction, status, 
          extracted_data, file_hash, vendor_name, invoice_date, grand_total, currency, category
         )
         VALUES ($1, $2, $3, $4, 'done', $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          userId, 
          docData.filename, 
          extractedData.documentType === 'INVOICE' ? 'invoice' : (extractedData.documentType === 'RECEIPT' ? 'receipt' : 'other'), 
          'purchase',
          JSON.stringify(extractedData),
          fileHash,
          extractedData.partyName || null,
          extractedData.date || null,
          extractedData.amount || 0,
          extractedData.currency || 'INR',
          extractedData.category || 'other'
        ]
      );
      const docId = docRes.rows[0].id;

      await client.query('COMMIT');
      return docId;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getUserDocuments(userId, limit = 50, offset = 0) {
    const res = await query(
      `SELECT d.*
       FROM documents d
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return res.rows;
  },
  
  async getDocumentById(userId, documentId) {
    const res = await query(
      `SELECT d.*
       FROM documents d
       WHERE d.id = $1 AND d.user_id = $2`,
      [documentId, userId]
    );
    return res.rows[0];
  }
};
