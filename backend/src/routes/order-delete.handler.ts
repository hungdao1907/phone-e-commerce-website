import type { PrismaClient } from '@prisma/client';
import type { RequestHandler } from 'express';
import { deleteOrderSafely, OrderDeletionError } from '../services/order-deletion.service';
import { getRouteParam } from '../utils/route-param';
import { safeErrorSummary } from '../utils/safe-error-summary';

export function createOrderDeleteHandler(database: PrismaClient): RequestHandler {
  return async (req, res) => {
    try {
      const result = await deleteOrderSafely(database, getRouteParam(req.params.id), req.body?.confirmationCode);
      return res.json({ message: 'Đã xóa vĩnh viễn đơn hàng.', ...result });
    } catch (error) {
      if (error instanceof OrderDeletionError) return res.status(error.status).json({ code: error.code, message: error.message });
      console.error('Order deletion failed:', safeErrorSummary(error));
      return res.status(500).json({ message: 'Không thể xóa đơn hàng. Không có thao tác xóa một phần.' });
    }
  };
}
