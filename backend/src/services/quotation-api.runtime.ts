import crypto from 'crypto';
import path from 'path';
import prisma from '../config/prisma';
import { createQuotationRouters } from '../routes/quotation.routes';
import { generateOrderCode } from './order-code.service';
import { createQuotationOrderConverter } from './quotation-workflow.service';
import { createV1QuotationPricingProvider, getV1QuotationExpiry } from './checkout-pricing.service';

function generateQuoteNumber(): string {
  return `QT-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
}

function createBankTransferData(orderCode: string, amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error('Invalid bank-transfer amount for quotation conversion.');
  }

  const bankId = process.env.VIETQR_BANK_ID || 'MB';
  const accountNo = process.env.VIETQR_ACCOUNT_NO || '0123456789';
  const accountName = process.env.VIETQR_ACCOUNT_NAME || 'APPLEWEB';
  const transferContent = `SEVQR ${orderCode}`;
  const qrData = `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accountNo)}-compact.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

  return {
    transferContent,
    qrData,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  };
}

/** Production composition only; it performs no queries or external side effects until a request arrives. */
export function createProductionQuotationRouters() {
  const pricingProvider = createV1QuotationPricingProvider(prisma, generateQuoteNumber);
  const orderConverter = createQuotationOrderConverter({
    generateOrderCode,
    createBankTransferData,
  });
  const backendRoot = path.resolve(__dirname, '..', '..');
  const cwdUploads = path.resolve(process.cwd(), 'uploads');

  return createQuotationRouters({
    database: prisma,
    getPricing: (request, context) => pricingProvider(request, context),
    getOrderConverter: () => orderConverter,
    getExpiry: getV1QuotationExpiry,
    privateStorage: {
      privateRoot: path.resolve(process.env.QUOTATION_PRIVATE_STORAGE_ROOT || path.join(backendRoot, 'private-data', 'quotations')),
      publicUploadRoots: [...new Set([path.join(backendRoot, 'uploads'), cwdUploads])],
    },
  });
}
