import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express, { Request, RequestHandler, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';
import { resolvePrivateQuotationFile } from '../services/quotation-private-storage';
import { removePrivateQuotationPdf, writePrivateQuotationPdf } from '../services/quotation-pdf.service';
import { safeErrorSummary } from '../utils/safe-error-summary';
import { permanentlyDeleteQuotation } from '../services/quotation-deletion.service';
import {
  approveAndConvertQuotation,
  confirmQuotation,
  createQuotationDraftInTransaction,
  CreateQuotationInput,
  declineQuotation,
  QuotationOrderConverter,
  QuotationPricing,
  QuotationPricingProvider,
  QuotationTransaction,
  QuotationWorkflowError,
  rejectQuotation,
} from '../services/quotation-workflow.service';
import { getV1QuotationExpiry } from '../services/checkout-pricing.service';
import {
  findExistingQuotationCreate,
  hashQuotationCreateIdempotencyKey,
  recoverQuotationCreateResult,
  runIdempotentQuotationCreate,
} from '../services/quotation-create-idempotency.service';
import { quotationCreateRateLimiter, QuotationCreateRateLimitResult } from '../services/quotation-create-rate-limit';

const QUOTATION_STATUSES = [
  'PENDING_CUSTOMER_CONFIRMATION',
  'CUSTOMER_CONFIRMED',
  'APPROVED',
  'NEEDS_REQUOTE',
  'REJECTED',
  'CUSTOMER_REJECTED',
  'EXPIRED',
  'CONVERTED',
] as const;

const CUSTOMER_QUOTATION_SELECT = {
  id: true,
  quoteNumber: true,
  version: true,
  previousVersionId: true,
  requoteReason: true,
  status: true,
  currency: true,
  subtotal: true,
  discountAmount: true,
  shippingFee: true,
  totalAmount: true,
  paymentMethod: true,
  deliveryMethod: true,
  promoCodeId: true,
  shippingAddress: true,
  shippingPhone: true,
  note: true,
  expiresAt: true,
  customerConfirmedAt: true,
  customerRejectedAt: true,
  approvedAt: true,
  convertedAt: true,
  createdAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productName: true,
      variantSku: true,
      variantAttributes: true,
      quantity: true,
      unitPrice: true,
      originalUnitPrice: true,
      saleUnitPrice: true,
      lineTotal: true,
    },
  },
  files: {
    select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  },
  previousVersion: { select: { id: true, quoteNumber: true, totalAmount: true, status: true, version: true } },
  nextVersion: { select: { id: true, quoteNumber: true, totalAmount: true, status: true, version: true } },
};

const STAFF_QUOTATION_INCLUDE = {
  items: { select: CUSTOMER_QUOTATION_SELECT.items.select },
  customer: { select: { id: true, fullName: true, email: true, phone: true } },
  orders: { select: { id: true, orderCode: true }, take: 1 },
  previousVersion: { select: { id: true, quoteNumber: true, totalAmount: true, status: true, version: true } },
  nextVersion: { select: { id: true, quoteNumber: true, totalAmount: true, status: true, version: true } },
};

const ADMIN_QUOTATION_INCLUDE = {
  ...STAFF_QUOTATION_INCLUDE,
  assignedStaff: { select: { id: true, username: true, role: true } },
};

type PrivateStoragePolicy = {
  privateRoot: string;
  publicUploadRoots: string[];
};

export type QuotationRouterDependencies = {
  /** Prisma-compatible database client. Callers must keep this API disabled until its migrations are applied. */
  database: any;
  /** Must create policy from trusted backend configuration and database state. */
  getPricing: (
    request: Request,
    context?: { transaction?: QuotationTransaction; quotation?: any },
  ) => QuotationPricing | Promise<QuotationPricing>;
  getOrderConverter: (request: Request) => QuotationOrderConverter;
  /** Expiry is server policy; never accept it from the request DTO. */
  getExpiry?: (now: Date) => Date;
  privateStorage: PrivateStoragePolicy;
  /** Injectable for isolated route tests; production uses the JWT middleware. */
  authenticate?: RequestHandler;
  now?: () => Date;
  /** Injection point for source-level tests; default limiter is process-local. */
  consumeCreateRateLimit?: (input: { customerId: string; ip: string; idempotencyKeyHash: string }) => QuotationCreateRateLimitResult;
};

type AllowedPrincipal = { id: string; role: string };

function principalOf(request: AuthRequest): AllowedPrincipal | null {
  const principal = request.user;
  if (!principal || typeof principal.id !== 'string' || !principal.id
    || typeof principal.role !== 'string') return null;
  return { id: principal.id, role: principal.role };
}

function routeId(request: Request): string | null {
  const value = request.params.id;
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value) ? value : null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  return Object.keys(value).every(key => keys.includes(key));
}

function hasEmptyBody(body: unknown): boolean {
  return body === undefined || body === null || (isPlainObject(body) && Object.keys(body).length === 0);
}

export function parseCreateQuotationDto(body: unknown): Omit<CreateQuotationInput, 'expiresAt'> | null {
  if (!isPlainObject(body)
    || !hasOnlyKeys(body, ['items', 'shippingAddress', 'shippingPhone', 'paymentMethod', 'note', 'sourceSessionId', 'deliveryMethod', 'promoCode'])
    || !Array.isArray(body.items)
    || body.items.length === 0
    || body.items.length > 100
    || typeof body.shippingAddress !== 'string'
    || body.shippingAddress.trim().length === 0
    || body.shippingAddress.trim().length > 1000
    || typeof body.shippingPhone !== 'string'
    || body.shippingPhone.trim().length < 6
    || body.shippingPhone.trim().length > 40
    || (body.paymentMethod !== 'COD' && body.paymentMethod !== 'BANK_TRANSFER')
    || (body.deliveryMethod !== undefined && body.deliveryMethod !== 'delivery' && body.deliveryMethod !== 'pickup')
    || (body.promoCode !== undefined && body.promoCode !== null
      && (typeof body.promoCode !== 'string' || body.promoCode.trim().length > 64))) return null;

  const items: CreateQuotationInput['items'] = [];
  for (const candidate of body.items) {
    if (!isPlainObject(candidate)
      || !hasOnlyKeys(candidate, ['variantId', 'quantity'])
      || typeof candidate.variantId !== 'string'
      || candidate.variantId.trim().length === 0
      || candidate.variantId.trim().length > 128
      || !Number.isSafeInteger(candidate.quantity)
      || (candidate.quantity as number) <= 0
      || (candidate.quantity as number) > 1000) return null;
    items.push({ variantId: candidate.variantId.trim(), quantity: candidate.quantity as number });
  }

  if (body.note !== undefined && body.note !== null
    && (typeof body.note !== 'string' || body.note.length > 1000)) return null;
  if (body.sourceSessionId !== undefined && body.sourceSessionId !== null
    && (typeof body.sourceSessionId !== 'string' || body.sourceSessionId.length > 160)) return null;

  return {
    items,
    shippingAddress: body.shippingAddress.trim(),
    shippingPhone: body.shippingPhone.trim(),
    paymentMethod: body.paymentMethod,
    deliveryMethod: body.deliveryMethod === 'pickup' || (body.deliveryMethod === undefined && body.shippingAddress.trim().startsWith('Nhận tại cửa hàng'))
      ? 'pickup' : 'delivery',
    promoCode: typeof body.promoCode === 'string' ? body.promoCode.trim() || null : null,
    note: typeof body.note === 'string' ? body.note.trim() || null : null,
    sourceSessionId: typeof body.sourceSessionId === 'string' ? body.sourceSessionId.trim() || null : null,
  };
}

function safePage(request: Request): { take: number; skip: number } {
  const takeInput = request.query.limit;
  const skipInput = request.query.offset;
  const take = typeof takeInput === 'string' && /^\d{1,3}$/.test(takeInput) ? Number(takeInput) : 50;
  const skip = typeof skipInput === 'string' && /^\d{1,7}$/.test(skipInput) ? Number(skipInput) : 0;
  return { take: Math.max(1, Math.min(take, 100)), skip: Math.min(skip, 1000000) };
}

function requestedStatus(request: Request): string | null | false {
  const status = request.query.status;
  if (status === undefined) return null;
  if (typeof status !== 'string' || !(QUOTATION_STATUSES as readonly string[]).includes(status)) return false;
  return status;
}

function sendWorkflowError(response: Response, error: unknown): boolean {
  if (error instanceof QuotationWorkflowError) {
    response.status(error.httpStatus).json({ code: error.code, message: error.message });
    return true;
  }
  if (error && typeof error === 'object'
    && typeof (error as { code?: unknown }).code === 'string'
    && Number.isInteger((error as { httpStatus?: unknown }).httpStatus)) {
    const typedError = error as { code: string; httpStatus: number; message?: string };
    response.status(typedError.httpStatus).json({
      code: typedError.code,
      message: typedError.message || 'Quotation request could not be confirmed. Retry with the same Idempotency-Key.',
    });
    return true;
  }
  console.error('[Quotation API] Request failed.', safeErrorSummary(error));
  response.status(500).json({ code: 'QUOTATION_API_ERROR', message: 'Không thể xử lý yêu cầu báo giá lúc này.' });
  return false;
}

function customerQuotationDto(value: any, customerId: string): Record<string, unknown> | null {
  if (!value || value.customerId !== customerId || !Array.isArray(value.items)) return null;
  const dto: Record<string, unknown> = {};
  for (const field of Object.keys(CUSTOMER_QUOTATION_SELECT)) {
    if (field === 'items') {
      dto[field] = value.items.map((item: any) => ({
        id: item.id,
        productName: item.productName,
        variantSku: item.variantSku,
        variantAttributes: item.variantAttributes,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        originalUnitPrice: item.originalUnitPrice,
        saleUnitPrice: item.saleUnitPrice,
        lineTotal: item.lineTotal,
      }));
    } else if (field === 'files') dto[field] = Array.isArray(value.files) ? value.files : [];
    else if (field === 'previousVersion' || field === 'nextVersion') dto[field] = value[field] ?? null;
    else dto[field] = value[field];
  }
  return dto;
}

function pathIsWithin(parent: string, candidate: string): boolean {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

async function fileSha256(filePath: string): Promise<string> {
  const hash = crypto.createHash('sha256');
  await new Promise<void>((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.once('error', reject);
    stream.once('end', resolve);
  });
  return hash.digest('hex');
}

async function streamPrivatePdf(
  response: Response,
  file: { storageKey: string; fileName: string; mimeType: string; sizeBytes: number; sha256: string },
  storage: PrivateStoragePolicy,
): Promise<void> {
  if (file.mimeType !== 'application/pdf'
    || !Number.isSafeInteger(file.sizeBytes) || file.sizeBytes <= 0
    || !/^[a-f0-9]{64}$/i.test(file.sha256)) {
    response.status(404).json({ message: 'Quotation PDF not found.' });
    return;
  }

  try {
    const filePath = resolvePrivateQuotationFile(file.storageKey, {
      privateRoot: storage.privateRoot,
      publicUploadRoots: storage.publicUploadRoots,
    });
    const [realRoot, realFile] = await Promise.all([
      fs.promises.realpath(storage.privateRoot),
      fs.promises.realpath(filePath),
    ]);
    if (!pathIsWithin(realRoot, realFile)) {
      response.status(404).json({ message: 'Quotation PDF not found.' });
      return;
    }
    const realPublicRoots = await Promise.all(storage.publicUploadRoots.map(async publicRoot => {
      try {
        return await fs.promises.realpath(publicRoot);
      } catch {
        return null;
      }
    }));
    if (realPublicRoots.some(publicRoot => publicRoot
      && (pathIsWithin(publicRoot, realRoot) || pathIsWithin(realRoot, publicRoot)))) {
      response.status(404).json({ message: 'Quotation PDF not found.' });
      return;
    }
    const stat = await fs.promises.stat(realFile);
    if (!stat.isFile() || stat.size !== file.sizeBytes
      || (await fileSha256(realFile)).toLowerCase() !== file.sha256.toLowerCase()) {
      response.status(404).json({ message: 'Quotation PDF not found.' });
      return;
    }

    const safeName = `${path.basename(file.fileName).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 120) || 'quotation'}`;
    response.status(200);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Length', String(stat.size));
    response.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const stream = fs.createReadStream(realFile);
    stream.once('error', () => {
      if (!response.headersSent) response.status(404).end();
      else response.destroy();
    });
    stream.pipe(response);
  } catch {
    response.status(404).json({ message: 'Quotation PDF not found.' });
  }
}

async function servePrivatePdfForScope(
  dependencies: QuotationRouterDependencies,
  response: Response,
  where: Record<string, unknown>,
): Promise<void> {
  const quotation = await dependencies.database.quotation.findFirst({ where, select: { id: true } });
  if (!quotation) {
    response.status(404).json({ message: 'Quotation not found.' });
    return;
  }
  const file = await dependencies.database.quotationFile.findFirst({
    where: { quotationId: quotation.id },
    orderBy: { createdAt: 'desc' },
    select: { storageKey: true, fileName: true, mimeType: true, sizeBytes: true, sha256: true },
  });
  if (!file) {
    response.status(404).json({ message: 'Quotation PDF not found.' });
    return;
  }
  await streamPrivatePdf(response, file, dependencies.privateStorage);
}

function privatePdfNoStore(_request: Request, response: Response, next: express.NextFunction): void {
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

async function createPrivatePdfForScope(
  dependencies: QuotationRouterDependencies,
  response: Response,
  where: Record<string, unknown>,
): Promise<void> {
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Pragma', 'no-cache');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  const quotation = await dependencies.database.quotation.findFirst({
    where,
    select: {
      id: true,
      quoteNumber: true,
      version: true,
      status: true,
      currency: true,
      subtotal: true,
      discountAmount: true,
      shippingFee: true,
      totalAmount: true,
      shippingAddress: true,
      shippingPhone: true,
      note: true,
      expiresAt: true,
      createdAt: true,
      customer: { select: { fullName: true, email: true } },
      items: {
        select: {
          productName: true,
          variantSku: true,
          variantAttributes: true,
          quantity: true,
          unitPrice: true,
          lineTotal: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!quotation) {
    response.status(404).json({ message: 'Quotation not found.' });
    return;
  }

  const stored = await writePrivateQuotationPdf(quotation, dependencies.privateStorage);
  try {
    const file = await dependencies.database.quotationFile.create({
      data: { quotationId: quotation.id, ...stored },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
    });
    response.status(201).json({ file });
  } catch (error) {
    await removePrivateQuotationPdf(stored.storageKey, dependencies.privateStorage).catch(() => undefined);
    throw error;
  }
}

/**
 * Creates three routers for separate mounts:
 * /api/quotations, /api/staff/quotations, and /api/admin/quotations.
 */
export function createQuotationRouters(dependencies: QuotationRouterDependencies) {
  if (!dependencies.privateStorage?.privateRoot
    || !Array.isArray(dependencies.privateStorage.publicUploadRoots)
    || dependencies.privateStorage.publicUploadRoots.length === 0) {
    throw new Error('Quotation PDF private root and public upload roots must be configured.');
  }

  const authenticate = dependencies.authenticate || authenticateToken;
  const customer = express.Router();
  const deleteHandler: RequestHandler = async (request: AuthRequest, response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    if (!principal || !['admin', 'superadmin', 'staff'].includes(principal.role)) { response.status(403).json({ message: 'Bạn không có quyền xóa báo giá.' }); return; }
    if (!id || !hasEmptyBody(request.body)) { response.status(400).json({ message: 'Yêu cầu xóa báo giá không hợp lệ.' }); return; }
    try {
      response.json(await permanentlyDeleteQuotation(dependencies.database, principal, id, dependencies.privateStorage));
    }
    catch (error) { sendWorkflowError(response, error); }
  };
  customer.delete('/:id', authenticate, (_request, response) => { response.status(403).json({ message: 'Customer không được xóa báo giá.' }); });

  customer.post('/recovery', authenticate, requireRoles('customer'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    if (!principal || principal.role !== 'customer') return response.status(403).json({ message: 'Customer access required.' });
    const idempotencyKey = request.get('Idempotency-Key');
    try {
      const quotation = await recoverQuotationCreateResult<any>({
        database: dependencies.database,
        customerId: principal.id,
        rawKey: idempotencyKey,
        quotationSelect: CUSTOMER_QUOTATION_SELECT,
      });
      if (!quotation) {
        return response.status(404).json({
          code: 'IDEMPOTENCY_RESULT_NOT_FOUND',
          status: 'NOT_FOUND_AT_CHECK',
          message: 'No committed result is visible yet. Check again with the same key; do not submit a new request while the result is uncertain.',
        });
      }
      const dto = customerQuotationDto(quotation, principal.id);
      if (!dto) return response.status(503).json({ code: 'IDEMPOTENCY_RESULT_UNAVAILABLE' });
      return response.json({ quotation: dto, recovered: true });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  customer.post('/', authenticate, requireRoles('customer'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const input = parseCreateQuotationDto(request.body);
    if (!principal || principal.role !== 'customer') return response.status(403).json({ message: 'Customer access required.' });
    if (!input) return response.status(400).json({ code: 'INVALID_QUOTATION_DTO', message: 'Quotation request is invalid.' });
    const idempotencyKey = request.get('Idempotency-Key');
    if (!idempotencyKey) {
      return response.status(400).json({
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Send a unique Idempotency-Key for this quotation request.',
      });
    }

    try {
      const idempotencyKeyHash = hashQuotationCreateIdempotencyKey(idempotencyKey);
      const existing = await findExistingQuotationCreate<any>({
        database: dependencies.database,
        customerId: principal.id,
        rawKey: idempotencyKey,
        input,
        quotationSelect: CUSTOMER_QUOTATION_SELECT,
      });
      if (existing) {
        const quotation = customerQuotationDto(existing, principal.id);
        if (!quotation) return response.status(503).json({ code: 'IDEMPOTENCY_RESULT_UNAVAILABLE' });
        return response.status(201).json({ quotation });
      }

      const rateLimit = (dependencies.consumeCreateRateLimit || (value => quotationCreateRateLimiter.consume(value)))({
        customerId: principal.id,
        ip: request.ip || request.socket.remoteAddress || 'unknown',
        idempotencyKeyHash,
      });
      if (!rateLimit.allowed) {
        response.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
        return response.status(429).json({
          code: 'QUOTATION_CREATE_RATE_LIMITED',
          message: 'Tạm thời có quá nhiều yêu cầu báo giá. Vui lòng thử lại sau.',
        });
      }
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }

    const now = dependencies.now?.() || new Date();
    const expiresAt = (dependencies.getExpiry || getV1QuotationExpiry)(now);
    if (!(expiresAt instanceof Date) || !Number.isFinite(expiresAt.getTime()) || expiresAt <= now) {
      return response.status(503).json({ code: 'QUOTATION_POLICY_UNAVAILABLE', message: 'Quotation expiry policy is not configured.' });
    }

    try {
      const pricingProvider: QuotationPricingProvider = transaction => dependencies.getPricing(request, { transaction });
      const result = await runIdempotentQuotationCreate({
        database: dependencies.database,
        customerId: principal.id,
        rawKey: idempotencyKey,
        input,
        quotationSelect: CUSTOMER_QUOTATION_SELECT,
        createQuotation: transaction => createQuotationDraftInTransaction(
          transaction as unknown as QuotationTransaction,
          principal,
          { ...input, expiresAt },
          pricingProvider,
          now,
        ),
      });
      const quotation = customerQuotationDto(result.quotation, principal.id);
      if (!quotation) return response.status(500).json({ code: 'QUOTATION_CREATE_RESULT_MISSING' });
      return response.status(201).json({ quotation });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  customer.get('/', authenticate, requireRoles('customer'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    if (!principal || principal.role !== 'customer') return response.status(403).json({ message: 'Customer access required.' });
    const status = requestedStatus(request);
    if (status === false) return response.status(400).json({ message: 'Quotation status filter is invalid.' });
    const { take, skip } = safePage(request);
    try {
      const quotations = await dependencies.database.quotation.findMany({
        where: { customerId: principal.id, ...(status ? { status } : {}) },
        select: CUSTOMER_QUOTATION_SELECT,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });
      return response.json({ quotations });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  customer.post('/:id/pdf', privatePdfNoStore, authenticate, requireRoles('customer'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    if (!principal || principal.role !== 'customer') return response.status(403).json({ message: 'Customer access required.' });
    if (!id || !hasEmptyBody(request.body)) return response.status(400).json({ message: 'Quotation PDF request is invalid.' });
    try {
      await createPrivatePdfForScope(dependencies, response, { id, customerId: principal.id });
      return undefined;
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  customer.get('/:id/pdf', privatePdfNoStore, authenticate, requireRoles('customer'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    if (!principal || principal.role !== 'customer') return response.status(403).json({ message: 'Customer access required.' });
    if (!id) return response.status(400).json({ message: 'Quotation id is invalid.' });
    try {
      await servePrivatePdfForScope(dependencies, response, { id, customerId: principal.id });
      return undefined;
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  customer.get('/:id', authenticate, requireRoles('customer'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    if (!principal || principal.role !== 'customer') return response.status(403).json({ message: 'Customer access required.' });
    if (!id) return response.status(400).json({ message: 'Quotation id is invalid.' });
    try {
      const quotation = await dependencies.database.quotation.findFirst({
        where: { id, customerId: principal.id },
        select: CUSTOMER_QUOTATION_SELECT,
      });
      if (!quotation) return response.status(404).json({ message: 'Quotation not found.' });
      return response.json({ quotation });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  customer.post('/:id/confirm', authenticate, requireRoles('customer'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    if (!principal || principal.role !== 'customer') return response.status(403).json({ message: 'Customer access required.' });
    if (!id || !hasEmptyBody(request.body)) {
      return response.status(400).json({ message: 'Confirmation request is invalid.' });
    }
    try {
      const quotation = await confirmQuotation(
        dependencies.database,
        principal,
        id,
        dependencies.now?.() || new Date(),
      );
      return response.json({ quotation });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  customer.post('/:id/decline', authenticate, requireRoles('customer'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    if (!principal || principal.role !== 'customer') return response.status(403).json({ message: 'Customer access required.' });
    if (!id || !hasEmptyBody(request.body)) {
      return response.status(400).json({ message: 'Decline request is invalid.' });
    }
    try {
      const quotation = await declineQuotation(
        dependencies.database,
        principal,
        id,
        dependencies.now?.() || new Date(),
      );
      return response.json({ quotation });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  const staff = express.Router();
  staff.delete('/:id', authenticate, requireRoles('staff'), deleteHandler);
  staff.get('/', authenticate, requireRoles('staff'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    if (!principal || principal.role !== 'staff') return response.status(403).json({ message: 'Staff access required.' });
    const status = requestedStatus(request);
    if (status === false) return response.status(400).json({ message: 'Quotation status filter is invalid.' });
    const { take, skip } = safePage(request);
    try {
      const quotations = await dependencies.database.quotation.findMany({
        where: { assignedStaffId: principal.id, ...(status ? { status } : {}) },
        include: STAFF_QUOTATION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });
      return response.json({ quotations });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  staff.get('/:id', authenticate, requireRoles('staff'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    if (!principal || principal.role !== 'staff') return response.status(403).json({ message: 'Staff access required.' });
    if (!id) return response.status(400).json({ message: 'Quotation id is invalid.' });
    try {
      const quotation = await dependencies.database.quotation.findFirst({
        where: { id, assignedStaffId: principal.id },
        include: STAFF_QUOTATION_INCLUDE,
      });
      if (!quotation) return response.status(404).json({ message: 'Quotation not found.' });
      return response.json({ quotation });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  staff.post('/:id/pdf', privatePdfNoStore, authenticate, requireRoles('staff'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    if (!principal || principal.role !== 'staff') return response.status(403).json({ message: 'Staff access required.' });
    if (!id || !hasEmptyBody(request.body)) return response.status(400).json({ message: 'Quotation PDF request is invalid.' });
    try {
      await createPrivatePdfForScope(dependencies, response, { id, assignedStaffId: principal.id });
      return undefined;
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  staff.get('/:id/pdf', privatePdfNoStore, authenticate, requireRoles('staff'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    if (!principal || principal.role !== 'staff') return response.status(403).json({ message: 'Staff access required.' });
    if (!id) return response.status(400).json({ message: 'Quotation id is invalid.' });
    try {
      await servePrivatePdfForScope(dependencies, response, { id, assignedStaffId: principal.id });
      return undefined;
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  staff.post('/:id/approve', authenticate, requireRoles('staff', 'admin', 'superadmin'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    const idempotencyKey = request.get('Idempotency-Key') || '';
    if (!principal || !id || !hasEmptyBody(request.body)) {
      return response.status(400).json({ message: 'Approval request is invalid.' });
    }
    try {
      const pricingProvider: QuotationPricingProvider = (transaction, quotation) =>
        dependencies.getPricing(request, { transaction, quotation });
      const result = await approveAndConvertQuotation(
        dependencies.database,
        principal,
        id,
        idempotencyKey,
        pricingProvider,
        dependencies.getOrderConverter(request),
        dependencies.now?.() || new Date(),
        {},
        getV1QuotationExpiry,
      );
      if (result.outcome === 'expired') return response.status(410).json(result);
      if (result.outcome === 'needs_requote') return response.status(409).json(result);
      return response.status(200).json({ outcome: result.outcome, orderId: result.order.id, orderCode: result.order.orderCode });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  staff.post('/:id/reject', authenticate, requireRoles('staff', 'admin', 'superadmin'), async (request: AuthRequest, response: Response) => {
    const principal = principalOf(request);
    const id = routeId(request);
    const idempotencyKey = request.get('Idempotency-Key') || '';
    const body = request.body === undefined ? {} : request.body;
    if (!principal || !id || !isPlainObject(body) || !hasOnlyKeys(body, ['note'])
      || (body.note !== undefined && body.note !== null
        && (typeof body.note !== 'string' || body.note.trim().length > 500))) {
      return response.status(400).json({ message: 'Rejection request is invalid.' });
    }
    try {
      const result = await rejectQuotation(
        dependencies.database,
        principal,
        id,
        idempotencyKey,
        typeof body.note === 'string' ? body.note.trim() || null : null,
        dependencies.now?.() || new Date(),
      );
      if (result.outcome === 'expired') return response.status(410).json(result);
      return response.status(200).json({ outcome: result.outcome });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  const admin = express.Router();
  admin.delete('/:id', authenticate, requireRoles('admin', 'superadmin'), deleteHandler);
  admin.get('/', authenticate, requireRoles('admin', 'superadmin'), async (request: AuthRequest, response: Response) => {
    const status = requestedStatus(request);
    if (status === false) return response.status(400).json({ message: 'Quotation status filter is invalid.' });
    const { take, skip } = safePage(request);
    try {
      const quotations = await dependencies.database.quotation.findMany({
        where: status ? { status } : {},
        include: ADMIN_QUOTATION_INCLUDE,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });
      return response.json({ quotations });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  admin.post('/:id/pdf', privatePdfNoStore, authenticate, requireRoles('admin', 'superadmin'), async (request: AuthRequest, response: Response) => {
    const id = routeId(request);
    if (!id || !hasEmptyBody(request.body)) return response.status(400).json({ message: 'Quotation PDF request is invalid.' });
    try {
      await createPrivatePdfForScope(dependencies, response, { id });
      return undefined;
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  admin.get('/:id/pdf', privatePdfNoStore, authenticate, requireRoles('admin', 'superadmin'), async (request: AuthRequest, response: Response) => {
    const id = routeId(request);
    if (!id) return response.status(400).json({ message: 'Quotation id is invalid.' });
    try {
      await servePrivatePdfForScope(dependencies, response, { id });
      return undefined;
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  admin.get('/:id', authenticate, requireRoles('admin', 'superadmin'), async (request: AuthRequest, response: Response) => {
    const id = routeId(request);
    if (!id) return response.status(400).json({ message: 'Quotation id is invalid.' });
    try {
      const quotation = await dependencies.database.quotation.findUnique({
        where: { id },
        include: ADMIN_QUOTATION_INCLUDE,
      });
      if (!quotation) return response.status(404).json({ message: 'Quotation not found.' });
      return response.json({ quotation });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  admin.post('/:id/assign', authenticate, requireRoles('admin', 'superadmin'), async (request: AuthRequest, response: Response) => {
    const id = routeId(request);
    const body = request.body;
    if (!id || !isPlainObject(body) || !hasOnlyKeys(body, ['staffId'])
      || typeof body.staffId !== 'string' || !body.staffId.trim() || body.staffId.length > 128) {
      return response.status(400).json({ message: 'Staff assignment request is invalid.' });
    }
    try {
      const staffUser = await dependencies.database.user.findUnique({
        where: { id: body.staffId.trim() },
        select: { id: true, username: true, role: true },
      });
      if (!staffUser || staffUser.role !== 'staff') return response.status(404).json({ message: 'Staff member not found.' });
      const assignment = await dependencies.database.quotation.updateMany({
        where: {
          id,
          status: { in: ['PENDING_CUSTOMER_CONFIRMATION', 'CUSTOMER_CONFIRMED'] },
        },
        data: { assignedStaffId: staffUser.id },
      });
      if (assignment.count !== 1) {
        const exists = await dependencies.database.quotation.findUnique({ where: { id }, select: { id: true } });
        return response.status(exists ? 409 : 404).json({ message: exists ? 'Quotation cannot be assigned in its current state.' : 'Quotation not found.' });
      }
      const quotation = await dependencies.database.quotation.findUnique({
        where: { id },
        include: ADMIN_QUOTATION_INCLUDE,
      });
      return response.json({ quotation });
    } catch (error) {
      sendWorkflowError(response, error);
      return undefined;
    }
  });

  return { customer, staff, admin };
}
