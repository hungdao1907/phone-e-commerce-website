import type { ProductSpecification } from '@/types/product';

interface ProductSpecificationsProps {
  productName: string;
  specifications: ProductSpecification[];
}

export function ProductSpecifications({
  productName,
  specifications,
}: ProductSpecificationsProps) {
  return (
    <section
      className="mt-10 overflow-hidden rounded-2xl border border-neutral-200 bg-white"
      aria-labelledby="product-specifications-title"
    >
      <div className="border-b border-neutral-100 px-5 py-5 sm:px-6">
        <h2
          id="product-specifications-title"
          className="text-lg font-semibold tracking-tight text-neutral-950"
        >
          Thông số kỹ thuật
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Thông tin dành cho {productName}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <tbody>
            {specifications.map((specification, index) => (
              <tr
                key={specification.label}
                className={index % 2 === 0 ? 'bg-neutral-50/70' : 'bg-white'}
              >
                <th
                  scope="row"
                  className="w-[38%] px-5 py-3.5 text-left text-xs font-medium text-neutral-500 sm:px-6"
                >
                  {specification.label}
                </th>
                <td className="px-5 py-3.5 text-right text-sm font-medium leading-relaxed text-neutral-800 sm:px-6">
                  {specification.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}