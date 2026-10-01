// KhaataAI - Deterministic Validation Engine for GST & Financial Accuracy

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export function runValidationEngine(doc = {}, lineItems = []) {
  const issues = [];

  const subtotal = Number(doc.subtotal ?? doc.subTotal) || 0;
  const cgst = Number(doc.cgst) || 0;
  const sgst = Number(doc.sgst) || 0;
  const igst = Number(doc.igst) || 0;
  const cess = Number(doc.cess) || 0;
  const roundOff = Number(doc.round_off ?? doc.roundOff) || 0;
  const grandTotal = Number(doc.grand_total ?? doc.grandTotal) || 0;

  const vendorGstin = typeof (doc.vendor_gstin ?? doc.vendorGstin) === 'string' 
    ? (doc.vendor_gstin ?? doc.vendorGstin).trim() 
    : null;
  const customerGstin = typeof (doc.customer_gstin ?? doc.customerGstin) === 'string' 
    ? (doc.customer_gstin ?? doc.customerGstin).trim() 
    : null;

  let invoiceDateStr = null;
  const rawDate = doc.invoice_date ?? doc.invoiceDate;
  if (rawDate instanceof Date) {
    invoiceDateStr = rawDate.toISOString().split('T')[0];
  } else if (typeof rawDate === 'string' && rawDate.trim()) {
    invoiceDateStr = rawDate.trim();
  }

  const confidenceScore = Number(doc.confidence_score ?? doc.confidenceScore) || 0;

  // 1. Grand Total Arithmetic
  const calculatedTotal = subtotal + cgst + sgst + igst + cess + roundOff;
  const totalDiff = Math.abs(calculatedTotal - grandTotal);
  if (grandTotal > 0 && calculatedTotal > 0 && totalDiff > 1.00) {
    issues.push({
      severity: 'error',
      code: 'TOTAL_MISMATCH',
      field: 'grand_total',
      message: `Grand total (₹${grandTotal.toFixed(2)}) does not match subtotal + taxes (₹${calculatedTotal.toFixed(2)}, diff: ₹${totalDiff.toFixed(2)})`,
      params: { calculatedTotal, grandTotal, diff: totalDiff }
    });
  }

  // 2. GST Type Conflict (Cannot have both CGST/SGST and IGST on the same document)
  if ((cgst > 0 || sgst > 0) && igst > 0) {
    issues.push({
      severity: 'error',
      code: 'GST_TYPE_CONFLICT',
      field: 'igst',
      message: 'Both intra-state (CGST/SGST) and inter-state (IGST) taxes are present on the same invoice',
      params: { cgst, sgst, igst }
    });
  }

  // 3. Intra-State Tax Equality
  if (cgst > 0 && sgst > 0 && Math.abs(cgst - sgst) > 0.50) {
    issues.push({
      severity: 'warning',
      code: 'CGST_SGST_MISMATCH',
      field: 'sgst',
      message: `CGST (₹${cgst.toFixed(2)}) and SGST (₹${sgst.toFixed(2)}) should be equal for intra-state supplies`,
      params: { cgst, sgst }
    });
  }

  // 4. Vendor GSTIN Validation
  if (vendorGstin && !GSTIN_REGEX.test(vendorGstin)) {
    issues.push({
      severity: 'warning',
      code: 'INVALID_GSTIN',
      field: 'vendor_gstin',
      message: `Vendor GSTIN format is invalid: ${vendorGstin}`,
      params: { gstin: vendorGstin }
    });
  }

  // 5. Customer GSTIN Validation
  if (customerGstin && !GSTIN_REGEX.test(customerGstin)) {
    issues.push({
      severity: 'warning',
      code: 'INVALID_GSTIN',
      field: 'customer_gstin',
      message: `Customer GSTIN format is invalid: ${customerGstin}`,
      params: { gstin: customerGstin }
    });
  }

  // 6. Line items vs Subtotal
  const items = lineItems || doc.lineItems || doc.line_items || [];
  if (items && items.length > 0) {
    const itemsSum = items.reduce((acc, item) => {
      const amt = Number(item.taxable_amount ?? item.taxableAmount ?? item.total) || 0;
      return acc + amt;
    }, 0);
    const itemDiff = Math.abs(itemsSum - subtotal);
    if (subtotal > 0 && itemDiff > 2.00) {
      issues.push({
        severity: 'warning',
        code: 'LINE_ITEMS_MISMATCH',
        field: 'subtotal',
        message: `Sum of line item amounts (₹${itemsSum.toFixed(2)}) does not match invoice subtotal (₹${subtotal.toFixed(2)})`,
        params: { itemsSum, subtotal, diff: itemDiff }
      });
    }
  }

  // 7. Date checks
  if (!invoiceDateStr) {
    issues.push({
      severity: 'warning',
      code: 'MISSING_DATE',
      field: 'invoice_date',
      message: 'Invoice date could not be detected from document',
      params: {}
    });
  } else {
    const invDate = new Date(invoiceDateStr);
    const now = new Date();
    if (!isNaN(invDate.getTime()) && invDate.getTime() > now.getTime() + (24 * 60 * 60 * 1000)) {
      issues.push({
        severity: 'warning',
        code: 'FUTURE_DATE',
        field: 'invoice_date',
        message: `Invoice date (${invoiceDateStr}) is in the future`,
        params: { invoice_date: invoiceDateStr }
      });
    }
  }

  // Determine overall status per STAGE 2 spec:
  // "needs_review if any error issue or confidence below 80, otherwise done"
  const hasErrors = issues.some(i => i.severity === 'error');
  
  let status = 'done';
  if (hasErrors || confidenceScore < 80) {
    status = 'needs_review';
  }

  return {
    issues,
    status,
    hasErrors,
    errorCount: issues.filter(i => i.severity === 'error').length,
    warningCount: issues.filter(i => i.severity === 'warning').length
  };
}
