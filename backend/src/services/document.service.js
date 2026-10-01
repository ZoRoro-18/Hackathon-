import { aiService } from './ai.service.js';
import { documentRepository } from '../repositories/document.repository.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { AppError } from '../utils.js';
import fs from 'fs/promises';

export const documentService = {
  async processUpload(userId, file) {
    if (!file) {
      throw new AppError('No file provided', 400);
    }
    
    try {
      // Read file into memory (in a real app, this goes to S3 and we fetch stream, but here we read local temp file)
      const fileData = await fs.readFile(file.path);
      const base64Data = fileData.toString('base64');
      
      // Extract data using Gemini Multimodal
      const extractedData = await aiService.extractFinancialData(
        base64Data,
        file.mimetype
      );
      
      // Save document and create transaction
      const docData = {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        storagePath: file.path // Local path for hackathon demo
      };
      
      const docId = await documentRepository.createDocument(userId, docData, extractedData);
      
      await auditRepository.log(userId, 'DOCUMENT_PROCESSED', { docId, type: extractedData.documentType });
      
      return {
        docId,
        extractedData
      };
    } catch (err) {
      console.error('Document processing error:', err);
      throw new AppError('Failed to process document with AI', 500);
    }
  },
  
  async listDocuments(userId, limit, offset) {
    return documentRepository.getUserDocuments(userId, limit, offset);
  }
};
