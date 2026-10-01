import { aiService } from './ai.service.js';
import { runValidationEngine } from './validation.engine.js';
import { documentRepository } from '../repositories/document.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils.js';
import fs from 'fs/promises';

export const documentService = {
  /**
   * Process an uploaded file: call Gemini API, run validation engine, save to Postgres
   */
  async processUpload(userId, file) {
    if (!file) {
      throw new AppError('No file provided. Please upload a PDF or image.', 400, 'NO_FILE_PROVIDED');
    }

    const fileMeta = {
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size
    };

    let fileBuffer;
    try {
      fileBuffer = file.buffer || (file.path ? await fs.readFile(file.path) : null);
    } catch (readErr) {
      console.error('[File Read Error]', readErr);
      throw new AppError('Failed to read uploaded file buffer', 500, 'FILE_READ_ERROR');
    }

    if (!fileBuffer) {
      throw new AppError('Empty file provided', 400, 'EMPTY_FILE');
    }

    try {
      // 1. Call real Gemini Multimodal API with file buffer
      console.log(`[Document Service] Processing extraction for "${fileMeta.filename}" with Gemini...`);
      const extracted = await aiService.extractFinancialData(fileBuffer, fileMeta.mimeType);

      // 2. Run Deterministic Validation Engine
      const validation = runValidationEngine(extracted, extracted.lineItems);

      // 3. Save to database (documents, document_files, line_items, validation_issues)
      const document = await documentRepository.createDocumentWithDetails(
        userId,
        fileMeta,
        fileBuffer,
        extracted,
        validation
      );

      // 4. Audit Log
      await auditRepository.log(userId, 'DOCUMENT_PROCESSED', {
        docId: document.id,
        filename: fileMeta.filename,
        type: extracted.type,
        grandTotal: extracted.grandTotal,
        status: validation.status
      });

      // 5. Clean up local temp file if exists
      if (file.path) {
        fs.unlink(file.path).catch(() => {});
      }

      // Return full document with line items & validation issues
      return documentRepository.getDocumentById(userId, document.id);
    } catch (err) {
      console.error('[Document Extraction Error]', err);
      // Save failed record so the user can see error and click Retry
      const failedDoc = await documentRepository.createFailedDocument(
        userId,
        fileMeta,
        fileBuffer,
        err.message || 'AI extraction failed'
      );

      if (file.path) {
        fs.unlink(file.path).catch(() => {});
      }

      return documentRepository.getDocumentById(userId, failedDoc.id);
    }
  },

  /**
   * Retry AI extraction for a previously uploaded/failed document
   */
  async retryExtraction(userId, docId) {
    const fileRecord = await documentRepository.getDocumentFile(userId, docId);
    if (!fileRecord || !fileRecord.file_data) {
      throw new AppError('Document source file not found', 404, 'FILE_NOT_FOUND');
    }

    try {
      console.log(`[Document Service] Retrying extraction for document ID ${docId}...`);
      const extracted = await aiService.extractFinancialData(fileRecord.file_data, fileRecord.mime_type);
      const validation = runValidationEngine(extracted, extracted.lineItems);

      await documentRepository.updateDocument(userId, docId, {
        type: extracted.type,
        direction: extracted.direction,
        vendor_name: extracted.vendorName,
        vendor_gstin: extracted.vendorGstin,
        customer_name: extracted.customerName,
        customer_gstin: extracted.customerGstin,
        invoice_number: extracted.invoiceNumber,
        invoice_date: extracted.invoiceDate,
        due_date: extracted.dueDate,
        place_of_supply: extracted.placeOfSupply,
        subtotal: extracted.subtotal,
        cgst: extracted.cgst,
        sgst: extracted.sgst,
        igst: extracted.igst,
        cess: extracted.cess,
        round_off: extracted.roundOff,
        grand_total: extracted.grandTotal,
        category: extracted.category,
        payment_status: extracted.paymentStatus,
        notes: extracted.notes,
        status: validation.status,
        error_message: null
      });

      await documentRepository.updateLineItemsAndIssues(
        docId,
        extracted.lineItems,
        validation.issues,
        validation.status
      );

      await auditRepository.log(userId, 'DOCUMENT_RETRIED', { docId });

      return documentRepository.getDocumentById(userId, docId);
    } catch (err) {
      console.error('[Retry Extraction Failed]', err);
      await documentRepository.updateDocument(userId, docId, {
        status: 'failed',
        error_message: err.message || 'Retry extraction failed'
      });
      throw new AppError(`Retry failed: ${err.message}`, 500, 'EXTRACTION_RETRY_FAILED');
    }
  },

  /**
   * Save manual edits and re-run deterministic validation
   */
  async saveAndRevalidate(userId, docId, { updates, lineItems }) {
    // 1. Update basic fields
    const updatedDoc = await documentRepository.updateDocument(userId, docId, updates || {});
    if (!updatedDoc) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }

    // 2. Re-run validation on new values and line items
    const mergedDoc = { ...updatedDoc, ...(updates || {}) };
    const items = lineItems || updatedDoc.line_items || [];
    const validation = runValidationEngine(mergedDoc, items);

    // 3. Persist line items and updated issues
    await documentRepository.updateLineItemsAndIssues(docId, items, validation.issues, validation.status);

    await auditRepository.log(userId, 'DOCUMENT_UPDATED', { docId });

    return documentRepository.getDocumentById(userId, docId);
  },

  /**
   * Toggle payment status
   */
  async setPaymentStatus(userId, docId, paymentStatus) {
    if (!['paid', 'unpaid'].includes(paymentStatus)) {
      throw new AppError('Invalid payment status', 400, 'INVALID_STATUS');
    }
    return documentRepository.updateDocument(userId, docId, { payment_status: paymentStatus });
  },

  /**
   * Toggle direction (sales / purchase)
   */
  async setDirection(userId, docId, direction) {
    if (!['sales', 'purchase'].includes(direction)) {
      throw new AppError('Invalid direction', 400, 'INVALID_DIRECTION');
    }
    return documentRepository.updateDocument(userId, docId, { direction });
  },

  /**
   * List documents with filters and pagination
   */
  async listDocuments(userId, query) {
    return documentRepository.listUserDocuments(userId, {
      search: query.search,
      type: query.type,
      direction: query.direction,
      status: query.status,
      limit: parseInt(query.limit, 10) || 20,
      offset: (parseInt(query.page, 10) - 1 || 0) * (parseInt(query.limit, 10) || 20)
    });
  },

  /**
   * Get single document
   */
  async getDocument(userId, docId) {
    const doc = await documentRepository.getDocumentById(userId, docId);
    if (!doc) {
      throw new AppError('Document not found', 404, 'DOCUMENT_NOT_FOUND');
    }
    return doc;
  },

  /**
   * Get document file blob for preview
   */
  async getFile(userId, docId) {
    const file = await documentRepository.getDocumentFile(userId, docId);
    if (!file) {
      throw new AppError('Document file not found', 404, 'FILE_NOT_FOUND');
    }
    return file;
  },

  /**
   * Delete document
   */
  async deleteDocument(userId, docId) {
    const deleted = await documentRepository.deleteDocument(userId, docId);
    if (!deleted) {
      throw new AppError('Document not found or already deleted', 404, 'DOCUMENT_NOT_FOUND');
    }
    await auditRepository.log(userId, 'DOCUMENT_DELETED', { docId });
    return { success: true, message: 'Document deleted successfully' };
  },

  /**
   * Dashboard KPIs and aggregations
   */
  async getDashboard(userId) {
    return documentRepository.getDashboardMetrics(userId);
  }
};
