import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesDir = path.join(__dirname, '..', '..', 'samples');

async function testStage2() {
  console.log('====================================================');
  console.log('STAGE 2: UPLOAD + AI EXTRACTION VERIFICATION SUITE');
  console.log('====================================================');

  // 1. Register a test user for upload testing
  const timestamp = Date.now();
  const testEmail = `upload_tester_${timestamp}@khaata.ai`;
  const regRes = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'Password123',
      fullName: 'Upload Tester',
      businessName: 'Tester Corp',
      gstin: '27ABCDE1234F1Z5',
      state: 'Maharashtra'
    })
  });
  const regData = await regRes.json();
  const token = regData.data.token;
  console.log(`[Setup] Created test user: ${testEmail}`);

  // 2. Test Error Handling: Missing file (Expect 400)
  console.log('\n[Check 1] Upload without file (Expect 400 NO_FILE_PROVIDED)...');
  const emptyForm = new FormData();
  const emptyRes = await fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: emptyForm
  });
  const emptyData = await emptyRes.json();
  if (emptyRes.status === 400 && emptyData.success === false) {
    console.log(`  -> PASS: Rejected missing file with 400 (${emptyData.error?.message})`);
  } else {
    console.error('  -> FAIL: Missing file did not return 400', emptyData);
    process.exit(1);
  }

  // 3. Test Error Handling: Unsupported file type (Expect 415)
  console.log('\n[Check 2] Upload invalid file type (.txt file, Expect 415)...');
  const badForm = new FormData();
  badForm.append('file', new Blob(['Some plain text'], { type: 'text/plain' }), 'notes.txt');
  const badTypeRes = await fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: badForm
  });
  const badTypeData = await badTypeRes.json();
  if (badTypeRes.status === 415 && badTypeData.success === false) {
    console.log(`  -> PASS: Rejected invalid MIME with 415 (${badTypeData.error?.message})`);
  } else {
    console.error('  -> FAIL: Bad MIME type did not return 415', badTypeData);
    process.exit(1);
  }

  // 4. Test Valid Tax Invoice PDF with Real Gemini Multimodal
  console.log('\n[Check 3] Upload Valid Tax Invoice PDF (sample-tax-invoice.pdf)...');
  const taxPdfBuffer = fs.readFileSync(path.join(samplesDir, 'sample-tax-invoice.pdf'));
  const taxForm = new FormData();
  taxForm.append('file', new Blob([taxPdfBuffer], { type: 'application/pdf' }), 'sample-tax-invoice.pdf');
  
  const taxRes = await fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: taxForm
  });
  const taxData = await taxRes.json();
  if (taxRes.status === 201 && taxData.success && taxData.data?.id) {
    const doc = taxData.data;
    console.log(`  -> PASS: Document #${doc.id} processed by Gemini.`);
    console.log(`     Vendor: "${doc.vendor_name}", Invoice No: "${doc.invoice_number}", Grand Total: ₹${doc.grand_total}`);
    console.log(`     Status: "${doc.status}", Confidence: ${doc.confidence_score}%`);
    console.log(`     Line Items Extracted: ${doc.line_items?.length || 0}`);
    console.log(`     Validation Issues: ${doc.validation_issues?.length || 0}`);
  } else {
    console.error('  -> FAIL: Tax invoice upload failed', taxData);
    process.exit(1);
  }

  // 5. Test Wrong Totals Invoice PDF (Must Flag Validation Errors & Set needs_review)
  console.log('\n[Check 4] Upload Wrong Totals PDF (sample-wrong-totals.pdf, Expect status: needs_review & validation errors)...');
  const wrongPdfBuffer = fs.readFileSync(path.join(samplesDir, 'sample-wrong-totals.pdf'));
  const wrongForm = new FormData();
  wrongForm.append('file', new Blob([wrongPdfBuffer], { type: 'application/pdf' }), 'sample-wrong-totals.pdf');

  const wrongRes = await fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: wrongForm
  });
  const wrongData = await wrongRes.json();
  if (wrongRes.status === 201 && wrongData.success && wrongData.data?.id) {
    const doc = wrongData.data;
    console.log(`  -> PASS: Document #${doc.id} processed.`);
    console.log(`     Status: "${doc.status}" (Expected: needs_review)`);
    console.log(`     Validation Issues Count: ${doc.validation_issues?.length || 0}`);
    doc.validation_issues?.forEach((issue, idx) => {
      console.log(`       [${idx + 1}] [${issue.severity.toUpperCase()}] ${issue.code}: ${issue.message}`);
    });
    if (doc.status !== 'needs_review' || (doc.validation_issues?.length || 0) === 0) {
      console.error('  -> FAIL: Wrong totals document should have validation errors and status: needs_review');
      process.exit(1);
    }
  } else {
    console.error('  -> FAIL: Wrong totals upload failed', wrongData);
    process.exit(1);
  }

  // 6. Test Phone-Style Receipt Image
  console.log('\n[Check 5] Upload Phone-Style Receipt PNG (sample-receipt.png)...');
  const imgBuffer = fs.readFileSync(path.join(samplesDir, 'sample-receipt.png'));
  const imgForm = new FormData();
  imgForm.append('file', new Blob([imgBuffer], { type: 'image/png' }), 'sample-receipt.png');

  const imgRes = await fetch('http://localhost:5000/api/documents/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: imgForm
  });
  const imgData = await imgRes.json();
  if (imgRes.status === 201 && imgData.success && imgData.data?.id) {
    console.log(`  -> PASS: Image document #${imgData.data.id} uploaded & processed successfully.`);
  } else {
    console.error('  -> FAIL: Image upload failed', imgData);
    process.exit(1);
  }

  // 7. Test Retry Button endpoint
  console.log('\n[Check 6] Retry Extraction for Document...');
  const retryRes = await fetch(`http://localhost:5000/api/documents/${taxData.data.id}/retry`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const retryData = await retryRes.json();
  if (retryRes.status === 200 && retryData.success && retryData.data?.id === taxData.data.id) {
    console.log(`  -> PASS: Document #${retryData.data.id} re-extracted and re-validated successfully.`);
  } else {
    console.error('  -> FAIL: Retry extraction failed', retryData);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('ALL STAGE 2 CHECKS: PASS');
  console.log('====================================================');
}

testStage2().catch(err => {
  console.error('Error during Stage 2 verification:', err);
  process.exit(1);
});
