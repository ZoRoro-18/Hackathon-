import { documentService } from '../services/document.service.js';
import { success, asyncHandler } from '../utils.js';

export const documentController = {
  upload: asyncHandler(async (req, res) => {
    const result = await documentService.processUpload(req.user.id, req.file);
    return success(res, result, 201);
  }),

  list: asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const documents = await documentService.listDocuments(req.user.id, limit, offset);
    return success(res, documents);
  })
};
