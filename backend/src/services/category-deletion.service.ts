export class CategoryDeletionError extends Error {
  constructor(
    public readonly code: 'CATEGORY_NOT_FOUND' | 'CATEGORY_IN_USE',
    public readonly httpStatus: 404 | 409,
    message: string,
  ) {
    super(message);
    this.name = 'CategoryDeletionError';
  }
}

type CategoryDeletionDatabase = {
  $transaction<T>(work: (transaction: any) => Promise<T>, options?: { isolationLevel: 'ReadCommitted' }): Promise<T>;
};

/**
 * Lock the category row before checking references. PostgreSQL's FOR UPDATE lock
 * conflicts with the KEY SHARE lock taken by concurrent foreign-key inserts. Use
 * READ COMMITTED so checks after waiting on an earlier insert see its commit.
 */
export async function deleteCategorySafely(database: CategoryDeletionDatabase, categoryId: string): Promise<void> {
  await database.$transaction(async transaction => {
    const locked = await transaction.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "Category" WHERE "id" = ${categoryId} FOR UPDATE
    `;
    if (!locked.length) {
      throw new CategoryDeletionError('CATEGORY_NOT_FOUND', 404, 'Không tìm thấy danh mục.');
    }

    const [products, children, attributes] = await Promise.all([
      transaction.product.count({ where: { categoryId } }),
      transaction.category.count({ where: { parentId: categoryId } }),
      transaction.categoryAttribute.count({ where: { categoryId } }),
    ]);

    if (products || children || attributes) {
      const references = [
        products ? 'sản phẩm' : null,
        children ? 'danh mục con' : null,
        attributes ? 'thuộc tính danh mục' : null,
      ].filter(Boolean).join(', ');
      throw new CategoryDeletionError(
        'CATEGORY_IN_USE',
        409,
        `Không thể xóa danh mục vì vẫn còn ${references}. Hãy xử lý các liên kết này trước.`,
      );
    }

    await transaction.category.delete({ where: { id: categoryId } });
  }, { isolationLevel: 'ReadCommitted' });
}

/** Map database race/FK conflicts to a safe conflict response without hiding unrelated errors. */
export function categoryDeleteDatabaseStatus(error: unknown): 404 | 409 | null {
  if (!error || typeof error !== 'object' || !('code' in error)) return null;
  const code = String((error as { code?: unknown }).code);
  if (code === 'P2025') return 404;
  if (code === 'P2003' || code === 'P2034') return 409;
  return null;
}
