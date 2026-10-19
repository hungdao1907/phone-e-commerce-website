import { LockKeyhole } from 'lucide-react';

interface InfoTabProps {
  initialFullName: string;
  initialEmail: string;
  initialPhone: string;
}

export function InfoTab({ initialFullName, initialEmail, initialPhone }: InfoTabProps) {
  return (
    <section className="bg-white p-6 sm:p-8 rounded-2xl border border-neutral-200/60 shadow-sm max-w-3xl">
      <h2 className="text-xl font-bold text-neutral-900">Thông tin tài khoản</h2>
      <p className="flex items-center gap-2 mt-2 mb-8 text-sm text-neutral-500">
        <LockKeyhole aria-hidden="true" className="w-4 h-4 shrink-0" />
        Thông tin đăng ký không thể chỉnh sửa
      </p>
      <div className="space-y-5">
        {([
          ['Họ và tên', initialFullName], ['Gmail', initialEmail], ['Số điện thoại', initialPhone],
        ] as const).map(([label, value]) => (
          <label key={label} className="block text-sm font-semibold text-neutral-700">
            {label}
            <input aria-label={label} readOnly value={value || 'Chưa có thông tin'}
              className="mt-2 w-full h-12 px-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-normal text-neutral-900" />
          </label>
        ))}
      </div>
      {(!initialFullName || !initialPhone) && <p className="mt-6 text-sm text-neutral-500">
        Tài khoản cũ chưa có đủ thông tin. Vui lòng liên hệ cửa hàng để được hướng dẫn bổ sung có xác minh.
      </p>}
    </section>
  );
}
