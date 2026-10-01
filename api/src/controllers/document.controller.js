import { documentService } from '../services/document.service.js';
import { success, asyncHandler, AppError } from '../utils.js';

export const documentController = {
  upload: asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('No file provided. Please attach a PDF or image with field name "file".', 400, 'NO_FILE_PROVIDED');
    }
    const document = await documentService.processUpload(req.user.id, req.file);
    return success(res, document, 201);
  }),

  list: asyncHandler(async (req, res) => {
    const data = await documentService.listDocuments(req.user.id, req.query);
    return success(res, data);
  }),

  getDashboard: asyncHandler(async (req, res) => {
    const data = await documentService.getDashboard(req.user.id);
    return success(res, data);
  }),

  getById: asyncHandler(async (req, res) => {
    const docId = parseInt(req.params.id, 10);
    if (!docId) throw new AppError('Invalid document ID', 400, 'INVALID_ID');
    const document = await documentService.getDocument(req.user.id, docId);
    return success(res, document);
  }),

  getFile: asyncHandler(async (req, res) => {
    const docId = parseInt(req.params.id, 10);
    if (!docId) throw new AppError('Invalid document ID', 400, 'INVALID_ID');
    const file = await documentService.getFile(req.user.id, docId);
    
    res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_filename || 'document')}"`);
    return res.send(file.file_data);
  }),

  update: asyncHandler(async (req, res) => {
    const docId = parseInt(req.params.id, 10);
    if (!docId) throw new AppError('Invalid document ID', 400, 'INVALID_ID');
    const document = await documentService.saveAndRevalidate(req.user.id, docId, req.body);
    return success(res, document);
  }),

  setPaymentStatus: asyncHandler(async (req, res) => {
    const docId = parseInt(req.params.id, 10);
    if (!docId) throw new AppError('Invalid document ID', 400, 'INVALID_ID');
    const { payment_status } = req.body;
    const document = await documentService.setPaymentStatus(req.user.id, docId, payment_status);
    return success(res, document);
  }),

  setDirection: asyncHandler(async (req, res) => {
    const docId = parseInt(req.params.id, 10);
    if (!docId) throw new AppError('Invalid document ID', 400, 'INVALID_ID');
    const { direction } = req.body;
    const document = await documentService.setDirection(req.user.id, docId, direction);
    return success(res, document);
  }),

  retry: asyncHandler(async (req, res) => {
    const docId = parseInt(req.params.id, 10);
    if (!docId) throw new AppError('Invalid document ID', 400, 'INVALID_ID');
    const document = await documentService.retryExtraction(req.user.id, docId);
    return success(res, document);
  }),

  delete: asyncHandler(async (req, res) => {
    const docId = parseInt(req.params.id, 10);
    if (!docId) throw new AppError('Invalid document ID', 400, 'INVALID_ID');
    const result = await documentService.deleteDocument(req.user.id, docId);
    return success(res, result);
  })
};
