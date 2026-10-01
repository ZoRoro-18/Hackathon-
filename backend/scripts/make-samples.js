import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesDir = path.join(__dirname, '..', '..', 'samples');

if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

function createInvoicePDF(filename, data) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(samplesDir, filename);
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header
    doc.fillColor('#0F766E').fontSize(20).text(data.companyName, 40, 40);
    doc.fillColor('#475569').fontSize(9)
       .text(data.companyAddress, 40, 68)
       .text(`GSTIN: ${data.companyGstin}`, 40, 80)
       .text(`State: ${data.companyState}`, 40, 92);

    doc.fillColor('#0F766E').fontSize(16).text(data.title || 'TAX INVOICE', 380, 40, { align: 'right' });
    doc.fillColor('#334155').fontSize(9)
       .text(`Invoice No: ${data.invoiceNumber}`, 380, 65, { align: 'right' })
       .text(`Date: ${data.date}`, 380, 78, { align: 'right' })
       .text(`Due Date: ${data.dueDate || data.date}`, 380, 91, { align: 'right' })
       .text(`Place of Supply: ${data.placeOfSupply}`, 380, 104, { align: 'right' });

    doc.moveTo(40, 125).lineTo(555, 125).strokeColor('#CBD5E1').lineWidth(1).stroke();

    // Bill To
    doc.fillColor('#0F766E').fontSize(11).text('BILL TO:', 40, 140);
    doc.fillColor('#1E293B').fontSize(10).text(data.customerName, 40, 155);
    doc.fillColor('#475569').fontSize(9)
       .text(data.customerAddress, 40, 170)
       .text(`GSTIN: ${data.customerGstin}`, 40, 182);

    // Table Header
    const tableTop = 215;
    doc.rect(40, tableTop, 515, 22).fill('#F1F5F9');
    doc.fillColor('#1E293B').fontSize(9).font('Helvetica-Bold')
       .text('Sr.', 48, tableTop + 6)
       .text('Item Description', 75, tableTop + 6)
       .text('HSN', 240, tableTop + 6)
       .text('Qty', 295, tableTop + 6, { width: 35, align: 'right' })
       .text('Rate (₹)', 335, tableTop + 6, { width: 55, align: 'right' })
       .text('Tax (%)', 395, tableTop + 6, { width: 45, align: 'right' })
       .text('Amount (₹)', 450, tableTop + 6, { width: 100, align: 'right' });

    let y = tableTop + 28;
    doc.font('Helvetica').fontSize(9).fillColor('#334155');

    data.items.forEach((item, idx) => {
      doc.text(String(idx + 1), 48, y);
      doc.text(item.description, 75, y, { width: 160 });
      doc.text(item.hsn || '8471', 240, y);
      doc.text(String(item.qty), 295, y, { width: 35, align: 'right' });
      doc.text(item.rate.toFixed(2), 335, y, { width: 55, align: 'right' });
      doc.text(`${item.taxRate}%`, 395, y, { width: 45, align: 'right' });
      doc.text(item.total.toFixed(2), 450, y, { width: 100, align: 'right' });
      y += 24;
      doc.moveTo(40, y - 4).lineTo(555, y - 4).strokeColor('#F1F5F9').lineWidth(0.5).stroke();
    });

    // Summary Box
    const sumTop = y + 10;
    doc.rect(340, sumTop, 215, 120).strokeColor('#CBD5E1').lineWidth(1).stroke();
    let sumY = sumTop + 8;
    
    function addSumRow(label, value, isBold = false) {
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#1E293B')
         .text(label, 350, sumY)
         .text(`₹ ${value.toFixed(2)}`, 450, sumY, { width: 95, align: 'right' });
      sumY += 16;
    }

    addSumRow('Subtotal', data.subtotal);
    if (data.cgst > 0) addSumRow('CGST', data.cgst);
    if (data.sgst > 0) addSumRow('SGST', data.sgst);
    if (data.igst > 0) addSumRow('IGST', data.igst);
    if (data.roundOff) addSumRow('Round Off', data.roundOff);
    
    doc.moveTo(340, sumY - 2).lineTo(555, sumY - 2).strokeColor('#CBD5E1').stroke();
    sumY += 4;
    addSumRow('Grand Total', data.grandTotal, true);

    // Footer
    doc.fontSize(8).fillColor('#94A3B8')
       .text('This is a computer generated invoice and does not require a physical signature.', 40, 750, { align: 'center', width: 515 });

    doc.end();
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
}

async function generateAllSamples() {
  console.log('Generating sample documents in /samples...');

  // 1. Valid Tax Invoice
  await createInvoicePDF('sample-tax-invoice.pdf', {
    companyName: 'Apex Cloud Solutions Pvt Ltd',
    companyAddress: 'Plot 42, Electronic City Phase 1, Bengaluru, Karnataka 560100',
    companyGstin: '29ABCDE1234F1Z5',
    companyState: 'Karnataka',
    title: 'TAX INVOICE',
    invoiceNumber: 'INV-2026-0891',
    date: '2026-09-15',
    dueDate: '2026-10-15',
    placeOfSupply: 'Karnataka',
    customerName: 'Khaata Retailers Ltd',
    customerAddress: 'Shop 12, Commercial Complex, MG Road, Bengaluru, Karnataka 560001',
    customerGstin: '29XYZAB9876C1Z3',
    items: [
      { description: 'Cloud Server Hosting (Monthly)', hsn: '998315', qty: 1, rate: 10000, taxRate: 18, total: 10000 },
      { description: 'Managed Database Backup Service', hsn: '998313', qty: 2, rate: 2500, taxRate: 18, total: 5000 }
    ],
    subtotal: 15000,
    cgst: 1350,
    sgst: 1350,
    igst: 0,
    grandTotal: 17700
  });
  console.log('✓ Created sample-tax-invoice.pdf');

  // 2. Retail Purchase Bill
  await createInvoicePDF('sample-purchase-bill.pdf', {
    companyName: 'National Office Supplies Co.',
    companyAddress: '15 Nariman Point, Mumbai, Maharashtra 400021',
    companyGstin: '27AABCN5555M1Z8',
    companyState: 'Maharashtra',
    title: 'PURCHASE BILL',
    invoiceNumber: 'BILL-4492',
    date: '2026-09-20',
    dueDate: '2026-09-20',
    placeOfSupply: 'Maharashtra',
    customerName: 'Khaata Retailers Ltd',
    customerAddress: 'Bandra West, Mumbai 400050',
    customerGstin: '27XYZAB9876C1Z3',
    items: [
      { description: 'A4 Copier Paper Reams (Box of 5)', hsn: '4802', qty: 10, rate: 1200, taxRate: 12, total: 12000 },
      { description: 'Ergonomic Mesh Office Chairs', hsn: '9401', qty: 4, rate: 6500, taxRate: 18, total: 26000 }
    ],
    subtotal: 38000,
    cgst: 3060,
    sgst: 3060,
    igst: 0,
    grandTotal: 44120
  });
  console.log('✓ Created sample-purchase-bill.pdf');

  // 3. Wrong Totals Invoice (To trigger deterministic validation errors!)
  await createInvoicePDF('sample-wrong-totals.pdf', {
    companyName: 'Faulty Calculations Inc.',
    companyAddress: '101 Error Way, Ahmedabad, Gujarat 380001',
    companyGstin: '24AAACF1111G1Z9',
    companyState: 'Gujarat',
    title: 'TAX INVOICE',
    invoiceNumber: 'ERR-9999',
    date: '2026-09-28',
    dueDate: '2026-10-28',
    placeOfSupply: 'Gujarat',
    customerName: 'Khaata Retailers Ltd',
    customerAddress: 'Surat, Gujarat',
    customerGstin: '24XYZAB9876C1Z3',
    items: [
      { description: 'Consulting Services', hsn: '998311', qty: 1, rate: 10000, taxRate: 18, total: 10000 }
    ],
    subtotal: 10000,
    cgst: 900,
    sgst: 900,
    igst: 500, // Conflict: both CGST/SGST and IGST!
    grandTotal: 15000 // Error: 10000 + 900 + 900 + 500 = 12300, not 15000!
  });
  console.log('✓ Created sample-wrong-totals.pdf');

  // 4. Create sample phone-style photo / image (PNG format using pure node Canvas or standard PNG buffer)
  const imagePath = path.join(samplesDir, 'sample-receipt.png');
  // 1x1 or sample PNG buffer with valid PNG header
  const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAcIAAAGQCAYAAAB2bM6gAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA1zSURBVHgB7d0/bBx1HMfx79357nzn+/yX2Ekcx42bpGmTNmmbpqlpmqZpmqZpmqZpmqZp2gYGBgYGBgYGBgYGBgYGBgYGBgYG3vze/e64k/1jIeecn8/n8zn3+/18/n/e3d7efr27u3vnzs7O3d3d3b/v7e39+d7e3t/v7+/vf7e7u/vd+/fv/+n+/fuv7+/vf7K/v/+3ff0e88cfb4/9Yd/v379/+PHHH3842Nvbu7O7u/tnfP4n';
  fs.writeFileSync(imagePath, Buffer.from(samplePngBase64, 'base64'));
  console.log('✓ Created sample-receipt.png');

  console.log('All sample documents successfully generated in /samples folder.');
}

generateAllSamples().catch(console.error);
