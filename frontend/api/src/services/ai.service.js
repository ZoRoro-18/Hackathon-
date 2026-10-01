import { GoogleGenAI, Type } from '@google/genai';
import { config } from '../config.js';
import { z } from 'zod';

const ai = new GoogleGenAI({ apiKey: config.geminiApiKey });

const lineItemSchema = z.object({
  position: z.number().default(0),
  description: z.string().default(''),
  hsnSac: z.string().nullable().optional().default(null),
  quantity: z.number().default(1),
  unit: z.string().nullable().optional().default(null),
  unitPrice: z.number().default(0),
  discount: z.number().default(0),
  taxableAmount: z.number().default(0),
  taxRate: z.number().default(0),
  taxAmount: z.number().default(0),
  total: z.number().default(0),
});

const extractedDocumentSchema = z.object({
  type: z.enum([
    'invoice',
    'receipt',
    'purchase_order',
    'credit_note',
    'debit_note',
    'quotation',
    'bank_statement',
    'other'
  ]).default('invoice'),
  direction: z.enum(['sales', 'purchase']).default('purchase'),
  invoiceNumber: z.string().nullable().optional().default(null),
  invoiceDate: z.string().nullable().optional().default(null),
  dueDate: z.string().nullable().optional().default(null),
  vendorName: z.string().nullable().optional().default(null),
  vendorGstin: z.string().nullable().optional().default(null),
  customerName: z.string().nullable().optional().default(null),
  customerGstin: z.string().nullable().optional().default(null),
  placeOfSupply: z.string().nullable().optional().default(null),
  category: z.enum([
    'inventory',
    'rent',
    'utilities',
    'transport',
    'salaries',
    'office',
    'other'
  ]).default('other'),
  paymentStatus: z.enum(['paid', 'unpaid']).default('unpaid'),
  currency: z.string().default('INR'),
  subtotal: z.number().default(0),
  cgst: z.number().default(0),
  sgst: z.number().default(0),
  igst: z.number().default(0),
  cess: z.number().default(0),
  roundOff: z.number().default(0),
  grandTotal: z.number().default(0),
  confidenceScore: z.number().min(0).max(100).default(85),
  notes: z.string().nullable().optional().default(null),
  lineItems: z.array(lineItemSchema).default([]),
});

export const aiService = {
  /**
   * Extract financial document details from PDF or image using Gemini Multimodal
   */
  async extractFinancialData(fileData, mimeType) {
    const base64 = Buffer.isBuffer(fileData) ? fileData.toString('base64') : fileData;

    const systemPrompt = `You are an expert Indian GST Accounting and Document Processing AI for KhaataAI.
Extract all relevant accounting, tax, and itemized data from the provided Indian invoice, receipt, purchase order, credit note, or financial document.

Rules:
1. type: 'invoice' | 'receipt' | 'purchase_order' | 'credit_note' | 'debit_note' | 'quotation' | 'bank_statement' | 'other'
2. direction: 'sales' (if issued by the merchant) or 'purchase' (if received from a supplier)
3. Dates must be formatted as YYYY-MM-DD.
4. Extract GSTIN exactly (15 characters: 2 state digits + 10 PAN chars + 1 entity num + 'Z' + 1 checksum).
5. All monetary amounts must be numbers in rupees (e.g. 1500.50).
6. Split taxes accurately: CGST (central), SGST (state), IGST (interstate), CESS.
7. Extract each line item with quantity, unit rate, tax rate (%), taxable amount, and item total.
8. Set confidenceScore between 0 and 100 based on document legibility and completeness.`;

    const modelPool = [
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      config.geminiModel,
      'gemini-3.8-flash'
    ].filter(Boolean);
    const uniqueModels = [...new Set(modelPool)];

    let lastError = null;

    for (const modelName of uniqueModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: 'user',
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    data: base64,
                    mimeType: mimeType || 'application/pdf'
                  }
                }
              ]
            }
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "invoice, receipt, purchase_order, credit_note, debit_note, quotation, bank_statement, other"
                },
                direction: {
                  type: Type.STRING,
                  description: "sales or purchase"
                },
                invoiceNumber: { type: Type.STRING, description: "Invoice / Bill / Receipt number" },
                invoiceDate: { type: Type.STRING, description: "Date of invoice in YYYY-MM-DD" },
                dueDate: { type: Type.STRING, description: "Due date in YYYY-MM-DD" },
                vendorName: { type: Type.STRING, description: "Seller / Supplier name" },
                vendorGstin: { type: Type.STRING, description: "15-digit GSTIN of seller" },
                customerName: { type: Type.STRING, description: "Buyer / Customer name" },
                customerGstin: { type: Type.STRING, description: "15-digit GSTIN of buyer" },
                placeOfSupply: { type: Type.STRING, description: "Place of supply / State" },
                category: {
                  type: Type.STRING,
                  description: "inventory, rent, utilities, transport, salaries, office, other"
                },
                paymentStatus: { type: Type.STRING, description: "paid or unpaid" },
                currency: { type: Type.STRING, description: "INR" },
                subtotal: { type: Type.NUMBER, description: "Taxable subtotal before taxes" },
                cgst: { type: Type.NUMBER, description: "CGST amount" },
                sgst: { type: Type.NUMBER, description: "SGST amount" },
                igst: { type: Type.NUMBER, description: "IGST amount" },
                cess: { type: Type.NUMBER, description: "Cess amount" },
                roundOff: { type: Type.NUMBER, description: "Round off adjustment" },
                grandTotal: { type: Type.NUMBER, description: "Final invoice total payable" },
                confidenceScore: { type: Type.INTEGER, description: "0 to 100 confidence score" },
                notes: { type: Type.STRING, description: "Additional notes or terms" },
                lineItems: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      position: { type: Type.INTEGER },
                      description: { type: Type.STRING },
                      hsnSac: { type: Type.STRING },
                      quantity: { type: Type.NUMBER },
                      unit: { type: Type.STRING },
                      unitPrice: { type: Type.NUMBER },
                      discount: { type: Type.NUMBER },
                      taxableAmount: { type: Type.NUMBER },
                      taxRate: { type: Type.NUMBER },
                      taxAmount: { type: Type.NUMBER },
                      total: { type: Type.NUMBER }
                    }
                  }
                }
              },
              required: ['type', 'grandTotal', 'confidenceScore']
            }
          }
        });

        // Strip markdown fences if present
        let cleanText = response.text.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json?\s*/i, '').replace(/```$/i, '').trim();
        }

        const parsed = JSON.parse(cleanText);
        return extractedDocumentSchema.parse(parsed);
      } catch (err) {
        lastError = err;
        console.warn(`[AI Service] Model ${modelName} encountered error:`, err.message?.slice(0, 100));
        // Continue to next model in pool
      }
    }

    let cleanMessage = lastError?.message || 'AI extraction failed';
    try {
      const parsedErr = JSON.parse(lastError.message);
      if (parsedErr.error?.message) cleanMessage = parsedErr.error.message;
    } catch {}

    const finalErr = new Error(cleanMessage);
    finalErr.statusCode = 500;
    throw finalErr;
  }
};
