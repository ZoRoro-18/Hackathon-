import 'dotenv/config';

async function testStage3() {
  console.log('====================================================');
  console.log('STAGE 3: DOCUMENTS AND DASHBOARD VERIFICATION SUITE');
  console.log('====================================================');

  // 1. Log in as demo user
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@khaata.ai', password: 'demo123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success || !loginData.data?.token) {
    throw new Error('Demo login failed: ' + JSON.stringify(loginData));
  }
  const token = loginData.data.token;
  console.log('[Setup] Logged in as demo@khaata.ai');

  // 2. Fetch Dashboard KPIs
  console.log('\n[Check 1] Verify Dashboard KPIs for Demo User against Hand Calculations...');
  const dashRes = await fetch('http://localhost:5000/api/documents/dashboard', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const dashData = await dashRes.json();
  const kpis = dashData.data.kpis;
  console.log('  Calculated Server KPIs:', kpis);

  // Assertions
  if (kpis.income !== 147500) throw new Error(`Expected Income ₹147,500, got ${kpis.income}`);
  if (kpis.expenses !== 89700) throw new Error(`Expected Expenses ₹89,700, got ${kpis.expenses}`);
  if (kpis.netProfit !== 57800) throw new Error(`Expected Net Profit ₹57,800, got ${kpis.netProfit}`);
  if (kpis.gstCollected !== 22500) throw new Error(`Expected GST Collected ₹22,500, got ${kpis.gstCollected}`);
  if (kpis.gstPaid !== 13500) throw new Error(`Expected GST Paid ₹13,500, got ${kpis.gstPaid}`);
  if (kpis.netGstPayable !== 9000) throw new Error(`Expected Net GST Payable ₹9,000, got ${kpis.netGstPayable}`);
  if (kpis.receivables !== 94400) throw new Error(`Expected Receivables ₹94,400, got ${kpis.receivables}`);
  if (kpis.payables !== 27160) throw new Error(`Expected Payables ₹27,160, got ${kpis.payables}`);
  if (kpis.overdueCount !== 1) throw new Error(`Expected Overdue Count 1, got ${kpis.overdueCount}`);
  console.log('  -> PASS: All 9 KPI metrics exactly match hand calculations!');

  console.log(`  -> Monthly Trends count: ${dashData.data.monthlyTrends.length}`);
  console.log(`  -> Category Breakdown items: ${dashData.data.categoryBreakdown.map(c => `${c.name}: ₹${c.value}`).join(', ')}`);

  // 3. Verify Empty State for Brand-New User
  console.log('\n[Check 2] Verify Empty Dashboard for Brand-New User (All Zeros & No Fake Data)...');
  const newEmail = `brandnew_${Date.now()}@khaata.ai`;
  const newReg = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: newEmail,
      password: 'Password123',
      fullName: 'Brand New User',
      businessName: 'Brand New Kirana'
    })
  });
  const newToken = (await newReg.json()).data.token;
  const newDash = await (await fetch('http://localhost:5000/api/documents/dashboard', {
    headers: { 'Authorization': `Bearer ${newToken}` }
  })).json();

  const newKpis = newDash.data.kpis;
  if (newKpis.income === 0 && newKpis.expenses === 0 && newKpis.totalDocuments === 0) {
    console.log('  -> PASS: Brand-new user sees clean zero KPIs and empty lists.');
  } else {
    throw new Error('New user did not have 0 KPIs: ' + JSON.stringify(newKpis));
  }

  // 4. Test Documents Page List & Filtering
  console.log('\n[Check 3] List Documents with Search and Filters...');
  const listRes = await fetch('http://localhost:5000/api/documents?search=Reliance&direction=sales', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const listData = await listRes.json();
  if (listData.success && listData.data.documents.length >= 2) {
    console.log(`  -> PASS: Filtered search returned ${listData.data.documents.length} matching sales documents.`);
  } else {
    throw new Error('Filtered search failed: ' + JSON.stringify(listData));
  }

  // 5. Test Document Detail with Source File Preview
  const sampleDocId = listData.data.documents[0].id;
  console.log(`\n[Check 4] Get Document #${sampleDocId} Details and Authenticated File Preview...`);
  const detailRes = await fetch(`http://localhost:5000/api/documents/${sampleDocId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const detailData = await detailRes.json();
  if (detailData.success && detailData.data.line_items.length > 0) {
    console.log(`  -> PASS: Document #${sampleDocId} details loaded with ${detailData.data.line_items.length} line items.`);
  } else {
    throw new Error('Get document details failed');
  }

  const fileRes = await fetch(`http://localhost:5000/api/documents/${sampleDocId}/file`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (fileRes.status === 200 && fileRes.headers.get('content-type')?.includes('application/pdf')) {
    console.log('  -> PASS: Document source file binary stream retrieved with correct Content-Type.');
  } else {
    throw new Error('Get document file stream failed');
  }

  // 6. Test Edit & Re-validate
  console.log(`\n[Check 5] Edit Fields & Re-validate Document #${sampleDocId}...`);
  const updateRes = await fetch(`http://localhost:5000/api/documents/${sampleDocId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({
      updates: { notes: 'Updated by automation test' }
    })
  });
  const updateData = await updateRes.json();
  if (updateData.success && updateData.data.notes === 'Updated by automation test') {
    console.log('  -> PASS: Document notes updated & re-validated.');
  } else {
    throw new Error('Update document failed: ' + JSON.stringify(updateData));
  }

  // 7. Test Mark Paid / Unpaid Toggle
  console.log(`\n[Check 6] Toggle Payment Status on Document #${sampleDocId}...`);
  const payRes = await fetch(`http://localhost:5000/api/documents/${sampleDocId}/payment-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ payment_status: 'unpaid' })
  });
  const payData = await payRes.json();
  if (payData.success && payData.data.payment_status === 'unpaid') {
    console.log('  -> PASS: Payment status successfully toggled to unpaid.');
  } else {
    throw new Error('Toggle payment status failed: ' + JSON.stringify(payData));
  }

  // 8. Test Toggle Direction
  console.log(`\n[Check 7] Toggle Direction on Document #${sampleDocId}...`);
  const dirRes = await fetch(`http://localhost:5000/api/documents/${sampleDocId}/direction`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ direction: 'purchase' })
  });
  const dirData = await dirRes.json();
  if (dirData.success && dirData.data.direction === 'purchase') {
    console.log('  -> PASS: Direction successfully toggled to purchase.');
  } else {
    throw new Error('Toggle direction failed: ' + JSON.stringify(dirData));
  }

  // 9. Test Delete Document
  console.log(`\n[Check 8] Delete Document #${sampleDocId}...`);
  const delRes = await fetch(`http://localhost:5000/api/documents/${sampleDocId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const delData = await delRes.json();
  if (delRes.status === 200 && delData.success) {
    console.log(`  -> PASS: Document #${sampleDocId} deleted successfully.`);
  } else {
    throw new Error('Delete document failed: ' + JSON.stringify(delData));
  }

  console.log('\n====================================================');
  console.log('ALL STAGE 3 CHECKS: PASS');
  console.log('====================================================');
}

testStage3().catch(err => {
  console.error('Error during Stage 3 verification:', err);
  process.exit(1);
});
