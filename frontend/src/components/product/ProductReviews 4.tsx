import { Star } from 'lucide-react';

export function ProductReviews() {
  const reviews = [
    {
      id: 1,
      name: 'Nguyễn Văn Anh',
      rating: 5,
      date: '10/09/2026',
      content: 'Sản phẩm rất đẹp, giao hàng cực kỳ nhanh đúng như cam kết 2 giờ. Sẽ ủng hộ shop thêm nhiều lần nữa!',
      verified: true
    },
    {
      id: 2,
      name: 'Trần Thị Bé',
      rating: 5,
      date: '05/09/2026',
      content: 'Máy xài mượt, camera chụp hình nét. Giá tốt hơn so với các bên khác. Đóng gói cẩn thận.',
      verified: true
    },
    {
      id: 3,
      name: 'Lê Minh',
      rating: 4,
      date: '01/09/2026',
      content: 'Mọi thứ đều ổn định, chỉ có điều hộp hơi móp một chút xíu do vận chuyển. Vote 4 sao!',
      verified: true
    }
  ];

  return (
    <section id="reviews-section" className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm">
      <h2 className="text-xl font-bold text-neutral-900 mb-6 uppercase">Đánh giá sản phẩm</h2>
      
      {/* Rating Overview */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 mb-10 pb-10 border-b border-neutral-100">
        <div className="flex flex-col items-center justify-center">
          <div className="text-5xl font-black text-neutral-900">4.8</div>
          <div className="flex items-center gap-1 mt-2 text-yellow-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`w-5 h-5 ${star <= 4 ? 'fill-current' : 'fill-current text-neutral-200'}`} />
            ))}
          </div>
          <div className="text-sm font-medium text-neutral-500 mt-2">Dựa trên 124 đánh giá</div>
          <button className="mt-6 rounded-full bg-blue-600 text-white px-8 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
            Viết đánh giá
          </button>
        </div>
        
        {/* Rating Bars */}
        <div className="flex flex-col justify-center gap-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const percent = rating === 5 ? 80 : rating === 4 ? 15 : rating === 3 ? 3 : 2;
            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-12 text-sm font-semibold text-neutral-700">
                  {rating} <Star className="w-3.5 h-3.5 text-neutral-400 fill-current" />
                </div>
                <div className="flex-1 h-2.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }}></div>
                </div>
                <div className="w-10 text-sm font-medium text-neutral-500 text-right">{percent}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="pb-6 border-b border-neutral-100 last:border-0 last:pb-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-500 shrink-0">
                {review.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-neutral-900">{review.name}</h4>
                  <span className="text-sm text-neutral-500">{review.date}</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-current' : 'fill-current text-neutral-200'}`} />
                    ))}
                  </div>
                  {review.verified && (
                    <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Đã mua hàng
                    </span>
                  )}
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">{review.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center">
        <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">Xem tất cả 124 đánh giá →</button>
      </div>
    </section>
  );
}
