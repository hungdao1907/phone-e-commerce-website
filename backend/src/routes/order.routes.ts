import express from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';
import { getRouteParam } from '../utils/route-param';
import { sendOrderReceivedEmail, sendOrderConfirmedEmail, sendTrackingOtpEmail } from '../services/email.service';
import { withOrderCodeCollisionRetry } from '../services/order-code.service';
import {
  CheckoutIdempotencyError,
  DirectCheckoutIdempotencyPayload,
  resolveCheckoutIdempotencyRequest,
  runIdempotentCheckout,
} from '../services/order-idempotency.service';
import { reservePromoUsage } from '../services/promo-usage.service';
import { JWT_SECRET } from '../config/auth';
import {
  calculateCheckoutPricing,
  CheckoutPricingError,
  CheckoutPricingRequest,
  CheckoutPricingSnapshot,
  createCheckoutPricingConfirmation,
  DeliveryMethod,
  verifyCheckoutPricingConfirmation,
} from '../services/checkout-pricing.service';
import {
  GENERIC_TRACKING_RATE_LIMIT_MESSAGE,
  GENERIC_TRACKING_REQUEST_MESSAGE,
  GENERIC_TRACKING_VERIFY_FAILURE_MESSAGE,
  allowTrackingRequest,
  beginTrackingChallenge,
  createTrackingLookupFingerprint,
  generateTrackingOtp,
  issueTrackingProof,
  normalizeTrackingContact,
  normalizeTrackingOrderCode,
  resolveTrackingProof,
  verifyTrackingChallenge,
} from '../services/order-tracking-security';
import {
  canCustomerCompleteOrder,
  isCustomerPrincipal,
  isOrderManagerRole,
} from './order-authorization';
import { safeErrorSummary } from '../utils/safe-error-summary';
import { trackingOtpDiagnostic } from '../utils/tracking-otp-diagnostics';
import { presentCustomerOrderDetail } from '../services/customer-order-detail';
import { cancelUnpaidOrder, OrderCancellationError } from '../services/order-cancellation.service';
import { createOrderDeleteHandler } from './order-delete.handler';
import { createOrderNotificationSafely } from '../services/order-reference.service';
import { CheckoutRecipientError, resolveCheckoutRecipient } from '../services/checkout-recipient.service';

const router = express.Router();

type PreparedOrderItem = {
  variantId: string;
  productName: string;
  variantInfo: string;
  quantity: number;
  unitPrice: number;
};

type CheckoutItem = {
  variantId: string;
  quantity: number;
};

class CheckoutPriceConfirmationError extends Error {
  constructor() {
    super('Checkout price changed or requires Customer confirmation.');
    this.name = 'CheckoutPriceConfirmationError';
  }
}

function getCheckoutPricingRequest(body: any, items: CheckoutItem[]): CheckoutPricingRequest | null {
  const requestedMethod = body?.deliveryMethod;
  let deliveryMethod: DeliveryMethod;
  if (requestedMethod === 'delivery' || requestedMethod === 'shipping') deliveryMethod = 'delivery';
  else if (requestedMethod === 'pickup' || requestedMethod === 'store_pickup') deliveryMethod = 'pickup';
  else if (requestedMethod === undefined && typeof body?.shippingAddress === 'string') {
    deliveryMethod = body.shippingAddress.includes('Nhận tại cửa hàng') ? 'pickup' : 'delivery';
  } else return null;

  if (body?.promoCode !== undefined && body.promoCode !== null && typeof body.promoCode !== 'string') return null;
  return {
    items,
    promoCode: typeof body?.promoCode === 'string' ? body.promoCode : null,
    deliveryMethod,
  };
}

function pricingConfirmationBody(customerId: string, request: CheckoutPricingRequest, pricing: CheckoutPricingSnapshot) {
  return {
    code: 'PRICE_CONFIRMATION_REQUIRED',
    message: 'Vui lòng kiểm tra và xác nhận lại giá Backend hiện tại trước khi đặt hàng.',
    pricing,
    pricingConfirmation: createCheckoutPricingConfirmation(customerId, request, pricing, JWT_SECRET),
  };
}

type StockTransaction = {
  productVariant: {
    updateMany(args: {
      where: {
        id: string;
        stock: { gte: number };
        product: { is: { status: string } };
      };
      data: { stock: { decrement: number } };
    }): Promise<{ count: number }>;
  };
};

export class CheckoutStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CheckoutStockError';
  }
}

export function validateAndAggregateCheckoutItems(items: unknown):
  | { ok: true; items: CheckoutItem[]; quantityByVariantId: Map<string, number> }
  | { ok: false; message: string } {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, message: 'Thiếu thông tin khách hàng hoặc sản phẩm' };
  }

  const normalizedItems: CheckoutItem[] = [];
  const quantityByVariantId = new Map<string, number>();

  for (const item of items) {
    const candidate = item as { variantId?: unknown; quantity?: unknown } | null;
    const variantId = typeof candidate?.variantId === 'string' ? candidate.variantId.trim() : '';
    const quantity = candidate?.quantity;

    if (!variantId || typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity <= 0) {
      return { ok: false, message: 'Số lượng sản phẩm phải là số nguyên dương' };
    }

    const totalQuantity = (quantityByVariantId.get(variantId) || 0) + quantity;
    if (!Number.isSafeInteger(totalQuantity)) {
      return { ok: false, message: 'Tổng số lượng sản phẩm không hợp lệ' };
    }

    quantityByVariantId.set(variantId, totalQuantity);
    normalizedItems.push({ variantId, quantity });
  }

  return { ok: true, items: normalizedItems, quantityByVariantId };
}

export async function reserveCheckoutStock(
  tx: StockTransaction,
  quantityByVariantId: ReadonlyMap<string, number>,
  variantNameById: ReadonlyMap<string, string>,
): Promise<void> {
  for (const [variantId, quantity] of quantityByVariantId) {
    const updated = await tx.productVariant.updateMany({
      where: {
        id: variantId,
        stock: { gte: quantity },
        product: { is: { status: 'active' } },
      },
      data: {
        stock: { decrement: quantity },
      },
    });

    if (updated.count !== 1) {
      const productName = variantNameById.get(variantId) || 'Sản phẩm';
      throw new CheckoutStockError(`${productName} không đủ tồn kho`);
    }
  }
}

function requestIp(req: express.Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function trackingContactMatches(
  contact: { type: 'email' | 'phone'; value: string },
  order: { shippingPhone: string; customer: { email: string; phone: string | null } | null },
): boolean {
  if (contact.type === 'email') {
    const orderEmail = normalizeTrackingContact(order.customer?.email);
    return orderEmail?.type === 'email' && orderEmail.value === contact.value;
  }

  return [order.shippingPhone, order.customer?.phone]
    .map(value => normalizeTrackingContact(value))
    .some(normalized => normalized?.type === 'phone' && normalized.value === contact.value);
}

// POST request OTP for public order tracking
router.post('/track/request-otp', async (req, res) => {
  trackingOtpDiagnostic('request', 'received');
  try {
    const { orderCode, contact } = req.body;

    if (typeof orderCode !== 'string' || !orderCode.trim() || typeof contact !== 'string' || !contact.trim()) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã đơn hàng và thông tin liên hệ hợp lệ.' });
    }

    const orderCodeCandidates = normalizeTrackingOrderCode(orderCode);
    const normalizedContact = normalizeTrackingContact(contact);
    if (orderCodeCandidates.length === 0 || !normalizedContact) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã đơn hàng và thông tin liên hệ hợp lệ.' });
    }

    const lookupFingerprint = createTrackingLookupFingerprint(orderCode, normalizedContact);
    if (!allowTrackingRequest(requestIp(req), lookupFingerprint)) {
      trackingOtpDiagnostic('rate_limit', 'blocked');
      return res.status(429).json({ success: false, message: GENERIC_TRACKING_RATE_LIMIT_MESSAGE });
    }

    trackingOtpDiagnostic('rate_limit', 'allowed');
    const order = await prisma.order.findFirst({
      where: {
        OR: orderCodeCandidates.map(candidate => ({
          orderCode: { equals: candidate, mode: 'insensitive' as const },
        })),
      },
      include: {
        customer: {
          select: { fullName: true, email: true, phone: true },
        },
      }
    });

    trackingOtpDiagnostic('order_lookup', order ? 'matched' : 'not_matched');
    trackingOtpDiagnostic('contact_match', order && trackingContactMatches(normalizedContact, order) ? 'matched' : 'not_matched');
    trackingOtpDiagnostic('recipient', normalizeTrackingContact(order?.customer?.email)?.type === 'email' ? 'valid' : 'unavailable');
    const isValidLookup = Boolean(
      order
      && trackingContactMatches(normalizedContact, order)
      && normalizeTrackingContact(order.customer?.email)?.type === 'email'
    );

    let challengeId: string = crypto.randomUUID();
    if (isValidLookup && order) {
      const otp = generateTrackingOtp();
      const challenge = beginTrackingChallenge(
        order.id,
        createTrackingLookupFingerprint(order.orderCode, normalizedContact),
        otp,
      );
      challengeId = challenge.challengeId;
      trackingOtpDiagnostic('challenge', challenge.shouldSend ? 'created' : 'cooldown');

      if (challenge.shouldSend) {
        await sendTrackingOtpEmail(
          order.customer.email,
          order.customer.fullName || 'Quý khách',
          order.orderCode,
          otp,
        );
      }
    }

    return res.status(202).json({
      success: true,
      challengeId,
      message: GENERIC_TRACKING_REQUEST_MESSAGE,
    });
  } catch (error) {
    console.error('Error in tracking request flow.');
    res.status(500).json({ success: false, message: 'Không thể xử lý yêu cầu lúc này.' });
  }
});

// POST verify OTP and issue an order-scoped lookup proof
router.post('/track/verify-otp', async (req, res) => {
  try {
    const { challengeId, otp } = req.body;

    if (typeof challengeId !== 'string' || !challengeId || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: GENERIC_TRACKING_VERIFY_FAILURE_MESSAGE });
    }

    const verification = verifyTrackingChallenge(challengeId, otp, requestIp(req));
    if (!verification.ok) {
      const status = verification.reason === 'rate_limited' ? 429 : 400;
      return res.status(status).json({ success: false, message: GENERIC_TRACKING_VERIFY_FAILURE_MESSAGE });
    }

    const proof = issueTrackingProof(verification.orderId);
    return res.json({
      success: true,
      accessToken: proof.token,
      expiresIn: proof.expiresIn,
    });
  } catch (error) {
    console.error('Error in tracking verification flow.');
    res.status(500).json({ success: false, message: 'Không thể xác thực lúc này.' });
  }
});

// GET safe tracking details using only an order-scoped lookup proof.
router.get('/track/details', async (req, res) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(/\s+/);
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Lookup proof không hợp lệ hoặc đã hết hạn.' });
    }

    const orderId = resolveTrackingProof(token);
    if (!orderId) {
      return res.status(401).json({ message: 'Lookup proof không hợp lệ hoặc đã hết hạn.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        orderCode: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        shippingAddress: true,
        shippingPhone: true,
        recipientName: true,
        totalAmount: true,
        shippingFee: true,
        discountAmount: true,
        estimatedDelivery: true,
        createdAt: true,
        customer: { select: { fullName: true } },
        items: {
          select: {
            productName: true,
            variantInfo: true,
            quantity: true,
            unitPrice: true,
            variant: {
              select: {
                image: true,
                product: { select: { image: true } },
              },
            },
          },
        },
      },
    });

    if (!order) return res.status(404).json({ message: 'Không tìm thấy thông tin đơn hàng.' });

    const { customer, items, ...safeOrder } = order;
    return res.json({
      success: true,
      order: {
        ...safeOrder,
        recipientName: order.recipientName?.trim() || customer?.fullName || null,
        items: items.map(item => ({
          productName: item.productName,
          variantInfo: item.variantInfo,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          image: item.variant?.image || item.variant?.product?.image || null,
        })),
      },
    });
  } catch (error) {
    console.error('Error loading safe tracking details.');
    return res.status(500).json({ message: 'Không thể tải thông tin đơn hàng lúc này.' });
  }
});


// GET payment status polling endpoint
router.get('/:orderCode/payment-status', authenticateToken, async (req, res) => {
  try {
    const orderCode = getRouteParam(req.params.orderCode);
    const principal = (req as AuthRequest).user;
    const orderWhere = isCustomerPrincipal(principal)
      ? { orderCode, customerId: principal.id }
      : isOrderManagerRole(principal?.role)
        ? { orderCode }
        : null;

    if (!orderWhere) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập trạng thái đơn hàng này' });
    }

    const order = await prisma.order.findFirst({
      where: orderWhere,
      select: { id: true, orderCode: true, status: true, paymentStatus: true }
    });

    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Check if there are any BankTransactions for this order code
    const latestTx = await prisma.bankTransaction.findFirst({
      where: { orderCode },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      orderId: order.id,
      orderCode: order.orderCode,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      transaction: latestTx ? {
        transactionId: latestTx.transactionId,
        amount: latestTx.amount,
        status: latestTx.status
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching payment status' });
  }
});

// Column existence cache for unmigrated database support
let hasAssignedStaffColCache: boolean | null = null;

async function checkAssignedStaffColumnExists(): Promise<boolean> {
  if (hasAssignedStaffColCache !== null) return hasAssignedStaffColCache;
  try {
    const res: any = await prisma.$queryRaw`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'Order' AND column_name = 'assignedStaffId'
      LIMIT 1;
    `;
    hasAssignedStaffColCache = Array.isArray(res) && res.length > 0;
  } catch {
    hasAssignedStaffColCache = false;
  }
  return hasAssignedStaffColCache;
}

const BASE_ORDER_FIELDS = {
  id: true,
  orderCode: true,
  customerId: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  shippingAddress: true,
  shippingPhone: true,
  recipientName: true,
  shippingFee: true,
  totalAmount: true,
  discountAmount: true,
  promoCodeId: true,
  note: true,
  estimatedDelivery: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: { fullName: true, email: true, phone: true }
  },
  items: {
    include: {
      variant: {
        include: { product: { select: { id: true, name: true, image: true, images: true, brand: true, status: true } } }
      }
    }
  }
};

async function getOrderSelectFields(): Promise<any> {
  const hasStaffCol = await checkAssignedStaffColumnExists();
  return {
    ...BASE_ORDER_FIELDS,
    ...(hasStaffCol ? { assignedStaffId: true } : {}),
  };
}

// GET all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const principal = (req as AuthRequest).user;
    const whereClause = isCustomerPrincipal(principal)
      ? { customerId: principal.id }
      : isOrderManagerRole(principal?.role)
        ? {}
        : null;

    if (!whereClause) {
      return res.status(403).json({ message: 'Bạn không có quyền xem danh sách đơn hàng' });
    }

    const selectFields = await getOrderSelectFields();
    const orders = await prisma.order.findMany({
      where: whereClause,
      select: selectFields,
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', safeErrorSummary(error));
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET orders assigned to authenticated staff
router.get('/assigned', authenticateToken, requireRoles('staff'), async (req, res) => {
  try {
    const principal = (req as AuthRequest).user;
    if (!principal || !principal.id || principal.role !== 'staff') {
      return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng được phân công' });
    }

    const hasStaffCol = await checkAssignedStaffColumnExists();
    if (!hasStaffCol) {
      // In database where assignedStaffId column is not present, no orders are assigned to staff
      return res.json([]);
    }

    const selectFields = await getOrderSelectFields();
    const orders = await prisma.order.findMany({
      where: { assignedStaffId: principal.id },
      select: selectFields,
      orderBy: { createdAt: 'desc' }
    });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching assigned orders:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// GET single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const principal = (req as AuthRequest).user;
    const orderId = getRouteParam(req.params.id);
    const hasStaffCol = await checkAssignedStaffColumnExists();

    if (principal?.role === 'staff' && !hasStaffCol) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    const orderWhere = isCustomerPrincipal(principal)
      ? { id: orderId, customerId: principal.id }
      : isOrderManagerRole(principal?.role)
        ? { id: orderId }
        : principal?.role === 'staff' && typeof principal.id === 'string' && principal.id.length > 0
          ? { id: orderId, ...(hasStaffCol ? { assignedStaffId: principal.id } : {}) }
          : null;

    if (!orderWhere) {
      return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này' });
    }

    const selectFields = await getOrderSelectFields();
    const order = await prisma.order.findFirst({
      where: orderWhere,
      select: selectFields
    });

    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    // Ownership/assignment was checked before reading this order's transfer metadata.
    // Never expose webhook payloads or another order's transactions.
    const bankTransaction = await prisma.bankTransaction.findFirst({ where: { orderId }, orderBy: { createdAt: 'desc' },
      select: { status: true, amount: true, transactionDate: true, transactionId: true } });
    const detail = { ...order, bankTransaction };
    res.json(isCustomerPrincipal(principal) ? presentCustomerOrderDetail(detail, principal.id) : detail);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Backend-owned price preview. The signed confirmation is short-lived and bound to
// the Customer, cart, promo, delivery method, and complete price snapshot.
router.post('/price-preview', authenticateToken, async (req, res) => {
  const principal = (req as AuthRequest).user;
  if (!isCustomerPrincipal(principal)) return res.status(403).json({ message: 'Chỉ khách hàng mới có thể xem giá checkout' });
  if (req.body?.customerId && req.body.customerId !== principal.id) {
    return res.status(403).json({ message: 'customerId không khớp với tài khoản đăng nhập' });
  }
  const validatedItems = validateAndAggregateCheckoutItems(req.body?.items);
  if (!validatedItems.ok) return res.status(400).json({ message: validatedItems.message });
  const pricingRequest = getCheckoutPricingRequest(req.body, validatedItems.items);
  if (!pricingRequest) return res.status(400).json({ code: 'INVALID_DELIVERY_METHOD', message: 'Phương thức giao/nhận không hợp lệ.' });
  try {
    const pricing = await calculateCheckoutPricing(prisma, pricingRequest);
    return res.json({ pricing, pricingConfirmation: createCheckoutPricingConfirmation(principal.id, pricingRequest, pricing, JWT_SECRET) });
  } catch (error) {
    if (error instanceof CheckoutPricingError) return res.status(error.status).json({ code: error.code, message: error.message });
    console.error('Error calculating checkout price:', error);
    return res.status(500).json({ message: 'Không thể tính giá checkout lúc này.' });
  }
});

// POST create order
router.post('/', authenticateToken, async (req, res) => {
  const principal = (req as AuthRequest).user;
  if (!isCustomerPrincipal(principal)) return res.status(403).json({ message: 'Chỉ khách hàng mới có thể tạo đơn hàng' });
  if (req.body?.customerId && req.body.customerId !== principal.id) {
    return res.status(403).json({ message: 'customerId không khớp với tài khoản đăng nhập' });
  }
  if (['email', 'customerEmail', 'customer', 'fullName', 'phone'].some(field => Object.prototype.hasOwnProperty.call(req.body || {}, field))) {
    return res.status(400).json({ code: 'CUSTOMER_IDENTITY_READ_ONLY', message: 'Thông tin tài khoản chỉ được lấy từ Customer đã đăng nhập. Hãy dùng các trường người nhận cho thông tin giao hàng.' });
  }
  const validatedItems = validateAndAggregateCheckoutItems(req.body?.items);
  if (!validatedItems.ok) return res.status(400).json({ message: validatedItems.message });
  const pricingRequest = getCheckoutPricingRequest(req.body, validatedItems.items);
  if (!pricingRequest) return res.status(400).json({ code: 'INVALID_DELIVERY_METHOD', message: 'Phương thức giao/nhận không hợp lệ.' });

  const { paymentMethod, shippingAddress, shippingPhone, note, estimatedDelivery } = req.body;
  if (typeof shippingAddress !== 'string' || typeof shippingPhone !== 'string' || !shippingAddress.trim() || !shippingPhone.trim()) {
    return res.status(400).json({ message: 'Thiếu địa chỉ hoặc số điện thoại nhận hàng.' });
  }
  const dbPaymentMethod = paymentMethod === 'BANK' || paymentMethod === 'BANK_TRANSFER' ? 'BANK_TRANSFER' : 'COD';
  const initialStatus = dbPaymentMethod === 'BANK_TRANSFER' ? 'pending_payment' : 'confirmed';
  const quantityByVariantId = validatedItems.quantityByVariantId;
  let idempotencyRequest: { enabled: boolean; key: string | null };
  try {
    idempotencyRequest = resolveCheckoutIdempotencyRequest(
      process.env.CHECKOUT_IDEMPOTENCY_ENABLED === 'true',
      req.get('Idempotency-Key'),
    );
  } catch (error) {
    if (error instanceof CheckoutIdempotencyError) {
      return res.status(error.status).json({ code: error.code, message: error.message });
    }
    throw error;
  }
  const idempotencyEnabled = idempotencyRequest.enabled;
  const idempotencyKey = idempotencyRequest.key;

  try {
    // Missing/expired/modified confirmations never proceed to any write.
    // With idempotency enabled this check runs inside the claimed transaction so
    // a committed Order can still be replayed after its short-lived token expires.
    if (!idempotencyEnabled && !req.body?.pricingConfirmation) {
      const currentPricing = await calculateCheckoutPricing(prisma, pricingRequest);
      return res.status(409).json(pricingConfirmationBody(principal.id, pricingRequest, currentPricing));
    }

    const idempotencyPayload: DirectCheckoutIdempotencyPayload = {
      items: validatedItems.items,
      promoCode: pricingRequest.promoCode,
      deliveryMethod: pricingRequest.deliveryMethod,
      paymentMethod,
      shippingAddress,
      shippingPhone,
      ...(req.body.recipientName !== undefined ? { recipientName: req.body.recipientName } : {}),
      note,
      estimatedDelivery,
    };

    const checkoutResult = await withOrderCodeCollisionRetry(async orderCode => {
      const createOrderInTransaction = async (tx: any) => {
      const recipient = await resolveCheckoutRecipient(tx, principal.id, req.body.recipientName);
      const pricing = await calculateCheckoutPricing(tx, pricingRequest, new Date());
      if (!verifyCheckoutPricingConfirmation(
        req.body.pricingConfirmation,
        principal.id,
        pricingRequest,
        pricing,
        JWT_SECRET,
      )) throw new CheckoutPriceConfirmationError();

      const variants = await tx.productVariant.findMany({
        where: { id: { in: [...quantityByVariantId.keys()] } },
        include: { product: true },
      });
      const variantsById = new Map(variants.map((variant: any) => [variant.id, variant]));
      const variantNameById = new Map<string, string>(variants.map((variant: any) => [variant.id, variant.product.name]));
      const pricedLineById = new Map(pricing.lines.map(line => [line.variantId, line]));
      const orderItemsData: PreparedOrderItem[] = validatedItems.items.map(item => {
        const variant = variantsById.get(item.variantId) as any;
        const pricedLine = pricedLineById.get(item.variantId);
        if (!variant || !pricedLine) throw new CheckoutStockError('Một sản phẩm không còn khả dụng.');
        const variantInfo = Object.values(variant.attributes as Record<string, unknown> || {})
          .map(value => String(value)).join(' · ');
        return {
          variantId: variant.id,
          productName: variant.product.name,
          variantInfo: variantInfo || 'Mặc định',
          quantity: item.quantity,
          unitPrice: pricedLine.effectiveUnitPrice,
        };
      });
      const promoWinner = pricing.discountBreakdown.cart.find(item => item.source === 'promo' && item.appliedAmount > 0);
      const promoCodeId = promoWinner?.id || null;
      const totalAmount = pricing.grandTotal;
      const shippingFee = pricing.shipping.amount;
      const totalDiscountAmount = pricing.discountBreakdown.cartDiscountAmount;

      // Reserve all variants and create Order/Payment in the same serializable transaction.
      await reserveCheckoutStock(tx, quantityByVariantId, variantNameById);
      const order = await tx.order.create({
        data: {
          orderCode,
          customerId: principal.id,
          paymentMethod: dbPaymentMethod,
          status: initialStatus,
          shippingAddress,
          shippingPhone,
          recipientName: recipient.recipientName,
          shippingFee,
          totalAmount,
          discountAmount: totalDiscountAmount,
          promoCodeId,
          note,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
          items: { create: orderItemsData },
        },
        include: { items: true, customer: true, Payment: true },
      });

      if (dbPaymentMethod === 'BANK_TRANSFER') {
        const bankId = process.env.VIETQR_BANK_ID || 'MB';
        const accountNo = process.env.VIETQR_ACCOUNT_NO || '0123456789';
        const accountName = process.env.VIETQR_ACCOUNT_NAME || 'APPLEWEB';
        const transferContent = `SEVQR ${orderCode}`;
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.png?amount=${totalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;
        await tx.payment.create({
          data: {
            orderId: order.id,
            method: 'BANK_TRANSFER',
            amount: totalAmount,
            status: 'PENDING',
            transferContent,
            qrData: qrUrl,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000),
          },
        });
        const updatedOrder = await tx.order.findUnique({
          where: { id: order.id }, include: { items: true, customer: true, Payment: true },
        });
        Object.assign(order, updatedOrder);
      }

      if (promoCodeId) {
        if (!await reservePromoUsage(tx, promoCodeId, new Date())) throw new CheckoutPriceConfirmationError();
      }
      return order;
      };

      if (idempotencyEnabled) {
        return runIdempotentCheckout(
          prisma as any,
          principal.id,
          idempotencyKey,
          idempotencyPayload,
          createOrderInTransaction,
        );
      }
      return {
        order: await prisma.$transaction(createOrderInTransaction, { isolationLevel: 'Serializable' }),
        replayed: false,
      };
    });
    const newOrder = checkoutResult.order;

    // External notifications remain strictly after transaction commit.
    if (!checkoutResult.replayed && newOrder.customer?.email) {
      sendOrderReceivedEmail(newOrder).catch(console.error);
    }
    if (!checkoutResult.replayed) {
      createOrderNotificationSafely(prisma, newOrder.id, {
          type: 'ORDER',
          title: `Đơn hàng mới #${newOrder.orderCode}`,
          message: `${newOrder.customer?.fullName || 'Khách hàng'} vừa đặt hàng. Tổng: ${new Intl.NumberFormat('vi-VN').format(newOrder.totalAmount)}đ.`,
          referenceType: 'Order',
          referenceId: newOrder.id,
      }).catch(console.error);
    }

    const paymentConfig = {
      bankId: process.env.VIETQR_BANK_ID || 'MB',
      accountNo: process.env.VIETQR_ACCOUNT_NO || '0123456789',
      accountName: process.env.VIETQR_ACCOUNT_NAME || 'APPLEWEB',
    };
    return res.status(checkoutResult.replayed ? 200 : 201).json({
      message: checkoutResult.replayed ? 'Đơn hàng đã được tạo trước đó' : 'Tạo đơn hàng thành công',
      code: checkoutResult.replayed ? 'ORDER_REPLAYED' : 'ORDER_CREATED',
      replayed: checkoutResult.replayed,
      order: newOrder,
      paymentConfig,
    });
  } catch (error) {
    if (error instanceof CheckoutRecipientError) {
      return res.status(error.status).json({ code: error.code, message: error.message });
    }
    if (error instanceof CheckoutIdempotencyError) {
      return res.status(error.status).json({ code: error.code, message: error.message });
    }
    if (error instanceof CheckoutStockError) return res.status(400).json({ message: error.message });
    if (error instanceof CheckoutPriceConfirmationError) {
      try {
        const currentPricing = await calculateCheckoutPricing(prisma, pricingRequest);
        return res.status(409).json(pricingConfirmationBody(principal.id, pricingRequest, currentPricing));
      } catch (pricingError) {
        if (pricingError instanceof CheckoutPricingError) return res.status(pricingError.status).json({ code: pricingError.code, message: pricingError.message });
      }
    }
    if (error instanceof CheckoutPricingError) return res.status(error.status).json({ code: error.code, message: error.message });
    console.error('Error creating order:', error);
    return res.status(500).json({ message: 'Lỗi server' });
  }
});

// PUT update order status
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const principal = (req as AuthRequest).user;
    const orderId = getRouteParam(req.params.id);

    const isStaff = principal?.role === 'staff' && typeof principal.id === 'string' && principal.id.length > 0;
    if (!isCustomerPrincipal(principal) && !isOrderManagerRole(principal?.role) && !isStaff) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật đơn hàng' });
    }

    if (isCustomerPrincipal(principal)) {
      const ownedOrder = await prisma.order.findFirst({
        where: { id: orderId, customerId: principal.id },
        select: { customerId: true, status: true }
      });

      if (!ownedOrder) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      if (!canCustomerCompleteOrder(
        principal,
        ownedOrder.customerId,
        ownedOrder.status,
        status,
        paymentStatus !== undefined,
      )) {
        return res.status(403).json({ message: 'Khách hàng chỉ có thể hoàn tất đơn đã giao của chính mình' });
      }
    }

    if (isStaff) {
      const hasStaffCol = await checkAssignedStaffColumnExists();
      if (!hasStaffCol) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc đơn hàng không được phân công cho bạn' });
      }
      const assignedOrder = await prisma.order.findFirst({
        where: { id: orderId, assignedStaffId: principal.id },
        select: { id: true }
      });

      if (!assignedOrder) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc đơn hàng không được phân công cho bạn' });
      }
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (paymentStatus) dataToUpdate.paymentStatus = paymentStatus;

    // Admin/Staff's existing status UI must use the same atomic cancellation path.
    if (status === 'cancelled') {
      await cancelUnpaidOrder(prisma, principal || {}, orderId, { reason: req.body.reason || 'Cancelled by assigned staff or administrator', note: req.body.note });
      const cancelled = await prisma.order.findUnique({ where: { id: orderId }, select: BASE_ORDER_FIELDS });
      return res.json({ message: 'Cập nhật trạng thái thành công', order: cancelled });
    }

    // A racing status/payment update must never reopen an order whose stock was restored.
    const updateWhere = { id: orderId, status: isCustomerPrincipal(principal) ? 'delivered' : { not: 'cancelled' },
      ...(isCustomerPrincipal(principal) ? { customerId: principal.id } : isStaff ? { assignedStaffId: principal!.id as string } : {}) };

    // Execute in transaction if status is becoming completed
    let updatedOrder: any;
    if (status === 'completed') {
      updatedOrder = await prisma.$transaction(async (tx) => {
        const order = await tx.order.update({
          where: updateWhere,
          data: dataToUpdate,
          select: {
            ...BASE_ORDER_FIELDS,
            Invoice: true
          }
        });

        // Create invoice if not exists
        if (!order.Invoice) {
          const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const count = await tx.invoice.count({
            where: {
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            }
          });
          const invoiceCode = `INV-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;

          await tx.invoice.create({
            data: {
              invoiceCode,
              orderId: order.id,
              subtotal: order.totalAmount,
              shippingFee: order.shippingFee,
              total: order.totalAmount + order.shippingFee,
              tax: 0
            }
          });
        }
        return order;
      });
    } else {
      updatedOrder = await prisma.order.update({
        where: updateWhere,
        data: dataToUpdate,
        select: BASE_ORDER_FIELDS
      });
    }

    // 📩 Send "Order Confirmed / Shipping" Email when status changes to 'shipping'
    if (status === 'shipping' && updatedOrder.customer && updatedOrder.customer.email) {
      sendOrderConfirmedEmail(updatedOrder).catch(console.error);
    }

    res.json({ message: 'Cập nhật trạng thái thành công', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order status:', error);
    if (error instanceof OrderCancellationError) return res.status(error.httpStatus).json({ message: error.message });
    if ((error as any)?.code === 'P2025') return res.status(409).json({ message: 'Order status changed; reload before updating.' });
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// PATCH order (Cancel): authenticated ownership/assignment and atomic restoration.
router.patch('/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await cancelUnpaidOrder(prisma, req.user || {}, getRouteParam(req.params.id), req.body || {});
    res.json({ message: 'Hủy đơn hàng thành công', ...result });
  } catch (error) {
    if (error instanceof OrderCancellationError) return res.status(error.httpStatus).json({ message: error.message });
    console.error('Error cancelling order:', safeErrorSummary(error));
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.delete('/:id', authenticateToken, requireRoles('superadmin'), createOrderDeleteHandler(prisma));

export default router;

