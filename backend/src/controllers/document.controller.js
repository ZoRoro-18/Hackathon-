import { documentService } from '../services/document.service.js';

export const documentController = {
  upload: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: 'No file provided.' } });
      }
      const result = await documentService.processUpload(req.user.id, req.file);
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      console.error('[Upload Error]', err);
      // Return 500 JSON to ensure frontend does not hang forever on failure
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  },

  list: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const documents = await documentService.listDocuments(req.user.id, limit, offset);
      return res.status(200).json({ success: true, data: documents });
    } catch (err) {
      console.error('[List Documents Error]', err);
      return res.status(500).json({ success: false, error: { message: err.message } });
    }
  }
};
