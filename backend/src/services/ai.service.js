import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

export const aiService = {
  /**
   * Process a document using Gemini Flash 2.0 Multimodal capabilities.
   * @param {Object} documentData - The file buffer or base64 data
   * @param {string} mimeType - The mime type of the document (pdf, jpeg, png)
   */
  async extractFinancialData(documentData, mimeType) {
    const prompt = `You are a financial AI assistant for Indian small businesses. 
Analyze the provided document (invoice, receipt, or bank statement) and extract the key information.
Ensure you strictly follow the provided JSON schema. Extracted amounts should be numbers.
Dates should be in ISO format (YYYY-MM-DD). If a value is not found, leave it null or empty.`;

    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: documentData, mimeType } }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            documentType: { type: Type.STRING, description: 'Type of document: INVOICE, RECEIPT, or BANK_STATEMENT' },
            date: { type: Type.STRING, description: 'Date of the transaction or invoice in YYYY-MM-DD' },
            amount: { type: Type.NUMBER, description: 'Total amount' },
            currency: { type: Type.STRING, description: 'Currency code, usually INR' },
            partyName: { type: Type.STRING, description: 'Name of the merchant, vendor, or customer' },
            gstin: { type: Type.STRING, description: 'GSTIN if present' },
            category: { type: Type.STRING, description: 'Expense or Income category' },
            confidenceScore: { type: Type.NUMBER, description: 'Confidence score of extraction from 0.0 to 1.0' },
            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  total: { type: Type.NUMBER }
                }
              }
            }
          },
          required: ['documentType', 'amount', 'date', 'partyName']
        }
      }
    });

    return JSON.parse(response.text);
  },

  /**
   * AI-driven financial insights
   */
  async generateInsights(financialData) {
    const prompt = `Analyze the following financial data for an Indian small business and provide 3 key actionable insights. Focus on cash flow, expense reduction, and tax planning (GST). 
Data: ${JSON.stringify(financialData)}`;
    
    const response = await ai.models.generateContent({
      model: config.geminiModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              actionable: { type: Type.BOOLEAN }
            }
          }
        }
      }
    });
    
    return JSON.parse(response.text);
  }
};
