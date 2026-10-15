import { QuotationWorkflowError } from './quotation-workflow.service';
import { removePrivateQuotationPdf, type QuotationPdfStorage } from './quotation-pdf.service';
import { resolvePrivateQuotationFile } from './quotation-private-storage';

const DELETABLE_STATUSES = ['PENDING_CUSTOMER_CONFIRMATION', 'CUSTOMER_CONFIRMED', 'APPROVED', 'NEEDS_REQUOTE', 'REJECTED', 'CUSTOMER_REJECTED', 'EXPIRED'];

/** Deletes only quote-owned rows. Never invokes Order/Payment/Product/Customer writes. */
export async function permanentlyDeleteQuotation(database: any, principal: { id: string; role: string }, id: string, storage?: QuotationPdfStorage) {
  if (!principal.id || !['admin', 'superadmin', 'staff'].includes(principal.role)) {
    throw new QuotationWorkflowError('QUOTATION_DELETE_FORBIDDEN', 403, 'Bạn không có quyền xóa báo giá.');
  }
  let storageKeys: string[];
  try {
    storageKeys = await database.$transaction(async (transaction: any) => {
      await transaction.$queryRaw`SELECT "id" FROM "Quotation" WHERE "id" = ${id} FOR UPDATE`;
      const quotation = await transaction.quotation.findUnique({ where: { id }, include: {
        orders: { select: { id: true } }, nextVersion: { select: { id: true } }, files: { select: { storageKey: true } },
      } });
      if (!quotation) throw new QuotationWorkflowError('QUOTATION_NOT_FOUND', 404, 'Báo giá không tồn tại hoặc đã được xóa.');
      if (principal.role === 'staff' && quotation.assignedStaffId !== principal.id) {
        throw new QuotationWorkflowError('QUOTATION_DELETE_FORBIDDEN', 403, 'Staff chỉ được xóa báo giá được phân công cho mình.');
      }
      if (quotation.status === 'CONVERTED' || quotation.orders.length > 0) {
        throw new QuotationWorkflowError('QUOTATION_HAS_ORDER', 409, 'Báo giá đã liên kết đơn hàng. Cần xử lý đơn hàng theo quy trình riêng.');
      }
      if (quotation.nextVersion) throw new QuotationWorkflowError('QUOTATION_HAS_NEXT_VERSION', 409, 'Báo giá có phiên bản kế tiếp. Cần xử lý phiên bản kế tiếp trước để giữ liên kết lịch sử.');
      if (!DELETABLE_STATUSES.includes(quotation.status)) throw new QuotationWorkflowError('QUOTATION_DELETE_STATE', 409, 'Trạng thái báo giá không cho phép xóa vĩnh viễn.');
      // Fail closed until the approved tombstone migration is activated. Do not discard keys.
      const columns = await transaction.$queryRaw`SELECT is_nullable FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'QuotationCreateIdempotency' AND column_name = 'quotationId'`;
      if (columns.length !== 1 || columns[0].is_nullable !== 'YES') {
        throw new QuotationWorkflowError('QUOTATION_DELETE_MIGRATION_REQUIRED', 503, 'Cần kích hoạt migration bảo toàn idempotency trước khi xóa báo giá.');
      }
      const where = { quotationId: id };
      await transaction.quotationFile.deleteMany({ where });
      await transaction.quotationReview.deleteMany({ where });
      // Retain customer/key/request digests permanently, without keeping any Quotation content.
      await transaction.$executeRaw`UPDATE "QuotationCreateIdempotency" SET "quotationId" = NULL WHERE "quotationId" = ${id}`;
      await transaction.quotationItem.deleteMany({ where });
      const deleted = await transaction.quotation.deleteMany({ where: { id, status: { in: DELETABLE_STATUSES }, orders: { none: {} }, nextVersion: { is: null },
        ...(principal.role === 'staff' ? { assignedStaffId: principal.id } : {}) } });
      if (deleted.count !== 1) throw new QuotationWorkflowError('QUOTATION_DELETE_CONFLICT', 409, 'Báo giá vừa thay đổi. Vui lòng tải lại.');
      return quotation.files.map((file: { storageKey: string }) => file.storageKey);
    }, { isolationLevel: 'Serializable' });
  } catch (error: any) {
    if (error?.code === 'P2034' || error?.code === 'P2003') throw new QuotationWorkflowError('QUOTATION_DELETE_CONFLICT', 409, 'Báo giá đang được xử lý hoặc còn liên kết dữ liệu. Không có dữ liệu nào bị xóa một phần; vui lòng tải lại.');
    if (error?.code === 'P2025') throw new QuotationWorkflowError('QUOTATION_NOT_FOUND', 404, 'Báo giá không tồn tại hoặc đã được xóa.');
    throw error;
  }
  // File deletion cannot join Prisma: only remove bytes after commit. Orphans remain inaccessible.
  let pending = 0;
  for (const key of storageKeys) {
    if (!storage) { pending++; continue; }
    try {
      resolvePrivateQuotationFile(key, storage); // Validate even when the root/file no longer exists.
      await removePrivateQuotationPdf(key, storage);
    }
    catch (error: any) { if (error?.code !== 'ENOENT') pending++; }
  }
  return { id, deleted: true, pdfCleanupPending: pending > 0 };
}
