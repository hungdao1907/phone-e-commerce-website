const crypto = require('crypto');
const secret = process.env.SEPAY_WEBHOOK_SECRET || 'dummy_secret';
const port = process.env.PORT || 3001;

async function sendWebhook(payload, alterSig = false, alterTime = false) {
  const timestamp = alterTime ? Math.floor(Date.now() / 1000) - 600 : Math.floor(Date.now() / 1000);
  
  // Important: SePay sends raw JSON string
  const rawBody = JSON.stringify(payload);
  
  let signature = 'sha256=' + crypto.createHmac('sha256', secret)
    .update(timestamp + '.' + rawBody)
    .digest('hex');
    
  if (alterSig) {
    signature = signature.substring(0, signature.length - 1) + (signature.endsWith('0') ? '1' : '0');
  }

  const fetchObj = typeof fetch !== 'undefined' ? fetch : require('node-fetch');
  
  // Send the request as a string body (Raw Body)
  const res = await fetchObj(`http://localhost:${port}/api/bank/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SePay-Signature': signature,
      'X-SePay-Timestamp': timestamp.toString()
    },
    body: rawBody
  });
  
  return { status: res.status, body: await res.json() };
}

async function runTests() {
  console.log('--- RUNNING SEPAY LIVE TESTS ---');
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const customer = await prisma.customer.findFirst();
  const product = await prisma.product.findFirst();
  const variant = await prisma.productVariant.findFirst();
  
  async function createOrder(code, amount, method = 'BANK_TRANSFER', status = 'pending', paymentStatus = 'PENDING') {
    return prisma.order.create({
      data: {
        customerId: customer.id,
        orderCode: code, status, paymentMethod: method, paymentStatus, totalAmount: amount, shippingAddress: 'x', shippingPhone: 'x', shippingFee: 0,
        items: { create: { productName: product.name, variantId: variant.id, variantInfo: 'x', quantity: 1, unitPrice: amount } }
      }
    });
  }

  await prisma.bankTransaction.deleteMany({ where: { transactionId: { startsWith: 'SEPTEST-' } } });
  await prisma.orderItem.deleteMany({ where: { order: { orderCode: { startsWith: 'DH888' } } } });
  await prisma.order.deleteMany({ where: { orderCode: { startsWith: 'DH888' } } });

  await createOrder('DH88800000001', 5000);
  await createOrder('DH88800000002', 5000);

  let res;

  // CASE 1: MATCHED (Valid transaction, exactly as SePay format)
  res = await sendWebhook({
    gateway: "VietinBank",
    transactionDate: "2026-09-29 13:35:23",
    accountNumber: "107875393381",
    subAccount: null,
    code: "DH88800000001",
    content: "149138292118-0972501501-SEVQR DH88800000001",
    transferType: "in",
    description: "BankAPINotify 149138292118-0972501501-SEVQR DH88800000001",
    transferAmount: 5000,
    accumulated: 123998,
    referenceCode: "SEPTEST-001",
    id: 855165391
  });
  console.log('CASE 1 (Matched):', res.status, res.body);

  // CASE 2: INVALID AMOUNT (Thiếu tiền)
  res = await sendWebhook({
    gateway: "VietinBank",
    transactionDate: "2026-09-29 13:35:23",
    accountNumber: "107875393381",
    subAccount: null,
    code: "DH88800000002",
    content: "149138292118-0972501501-SEVQR DH88800000002",
    transferType: "in",
    description: "BankAPINotify 149138292118-0972501501-SEVQR DH88800000002",
    transferAmount: 4000, // Missing 1000
    accumulated: 123998,
    referenceCode: "SEPTEST-002",
    id: 855165392
  });
  console.log('CASE 2 (Thiếu tiền):', res.status, res.body);

  // CASE 3: Idempotency (Duplicate transaction)
  res = await sendWebhook({
    gateway: "VietinBank",
    transactionDate: "2026-09-29 13:35:23",
    accountNumber: "107875393381",
    subAccount: null,
    code: "DH88800000001",
    content: "149138292118-0972501501-SEVQR DH88800000001",
    transferType: "in",
    description: "BankAPINotify 149138292118-0972501501-SEVQR DH88800000001",
    transferAmount: 5000,
    accumulated: 123998,
    referenceCode: "SEPTEST-001",
    id: 855165391
  });
  console.log('CASE 3 (Trùng transaction - SEPTEST-001):', res.status, res.body);

  // CASE 4: Invalid signature
  res = await sendWebhook({
    gateway: "VietinBank",
    transactionDate: "2026-09-29 13:35:23",
    accountNumber: "107875393381",
    subAccount: null,
    code: "DH88800000001",
    content: "149138292118-0972501501-SEVQR DH88800000001",
    transferType: "in",
    description: "BankAPINotify 149138292118-0972501501-SEVQR DH88800000001",
    transferAmount: 5000,
    accumulated: 123998,
    referenceCode: "SEPTEST-004",
    id: 855165394
  }, true, false);
  console.log('CASE 4 (Sai signature):', res.status, res.body);

  // CASE 5: Expired timestamp
  res = await sendWebhook({
    gateway: "VietinBank",
    transactionDate: "2026-09-29 13:35:23",
    accountNumber: "107875393381",
    subAccount: null,
    code: "DH88800000001",
    content: "149138292118-0972501501-SEVQR DH88800000001",
    transferType: "in",
    description: "BankAPINotify 149138292118-0972501501-SEVQR DH88800000001",
    transferAmount: 5000,
    accumulated: 123998,
    referenceCode: "SEPTEST-005",
    id: 855165395
  }, false, true);
  console.log('CASE 5 (Timestamp cũ):', res.status, res.body);
  
  console.log('\n--- VERIFY DATABASE RESULTS ---');
  const tx1 = await prisma.bankTransaction.findUnique({ where: { transactionId: 'SEPTEST-001' } });
  console.log('TX SEPTEST-001 (Match):', tx1?.status);
  const tx2 = await prisma.bankTransaction.findUnique({ where: { transactionId: 'SEPTEST-002' } });
  console.log('TX SEPTEST-002 (Invalid Amount):', tx2?.status);

}

runTests().catch(console.error);
