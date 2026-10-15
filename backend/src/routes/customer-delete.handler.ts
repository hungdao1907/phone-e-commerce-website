import { PrismaClient } from '@prisma/client';
import { RequestHandler } from 'express';
import { deleteCustomerSafely, CustomerDeletionError, isCustomerForeignKeyError } from '../services/customer-deletion.service';
import { getRouteParam } from '../utils/route-param';

export function createCustomerDeleteHandler(database: PrismaClient): RequestHandler {
  return async (req, res) => {
    try {
      await deleteCustomerSafely(database, getRouteParam(req.params.id));
      return res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      if (error instanceof CustomerDeletionError) {
        return res.status(error.kind === 'NOT_FOUND' ? 404 : 409).json({ message: error.message });
      }
      if (isCustomerForeignKeyError(error)) {
        return res.status(409).json({ message: 'Không thể xóa khách hàng vì còn dữ liệu liên quan cần được bảo toàn.' });
      }
      console.error('Error deleting customer:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
}
