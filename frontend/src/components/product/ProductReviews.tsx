import React, { useState, useEffect, useRef } from 'react';
import { Star, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { getCriteriaForCategory, ExperienceCriterion } from '../../data/experienceCriteria';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: string;
  adminReply: string | null;
  adminReplyAt: string | null;
  customer: { id: string; fullName: string };
  variant: { attributes: any; colorCode?: string };
  experienceRatings?: Record<string, number>;
  isVerifiedPurchase: boolean;
}

interface RatingSummary {
  ratingAverage: number;
  reviewCount: number;
  ratingBreakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  experienceRatings?: Record<string, number>;
}

interface EligibleItem {
  orderId: string;
  orderCode: string;
  orderItemId: string;
  variantId: string;
  variantInfo: string;
  purchasedAt: string;
}

export function ProductReviews({ productId, categorySlug }: { productId?: string, categorySlug?: string }) {
  const navigate = useNavigate();
  const criteria = getCriteriaForCategory(categorySlug || '');
  const { user, token } = useAuthStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number>(0); // 0 = all
  const [hasImageFilter, setHasImageFilter] = useState(false);
  const [isVerifiedPurchaseFilter, setIsVerifiedPurchaseFilter] = useState(false);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isWriting, setIsWriting] = useState(false);

  // Eligibility state
  const [isEligible, setIsEligible] = useState(false);
  const [eligibleItems, setEligibleItems] = useState<EligibleItem[]>([]);

  // Form state
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [formRating, setFormRating] = useState(0);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formExperienceRatings, setFormExperienceRatings] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!productId) return;
    fetchReviews(1, ratingFilter, hasImageFilter, isVerifiedPurchaseFilter, true);
  }, [productId, ratingFilter, hasImageFilter, isVerifiedPurchaseFilter]);

  useEffect(() => {
    if (!productId || !token) return;
    checkEligibility();
  }, [productId, token]);

  const fetchReviews = async (pageNum: number, rFilter: number, imgFilter: boolean, vpFilter: boolean, reset = false) => {
    try {
      if (reset) setLoading(true);
      setError(false);
      const url = `${API_URL}/api/reviews/product/${productId}?page=${pageNum}&limit=5&rating=${rFilter}&hasImage=${imgFilter}&isVerifiedPurchase=${vpFilter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch failed');
      const data = await res.json();
      
      if (reset) {
        setReviews(data.reviews);
      } else {
        setReviews(prev => [...prev, ...data.reviews]);
      }
      
      if (data.ratingSummary) {
        setRatingSummary(data.ratingSummary);
      }
      setTotalPages(data.pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      if (reset) setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/eligibility/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsEligible(data.isEligible);
        setEligibleItems(data.eligibleItems || []);
      }
    } catch (err) {
      console.error('Eligibility check failed', err);
    }
  };

  const handleWriteClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    if (!isEligible || eligibleItems.length === 0) {
      alert('Bạn cần mua và nhận sản phẩm này trước khi có thể đánh giá.');
      return;
    }
    setIsWriting(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (formImages.length + files.length > 5) {
      alert('Chỉ được tải lên tối đa 5 ảnh');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append('image', files[i]);
        const res = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.imageUrl) uploadedUrls.push(data.imageUrl);
      }
      setFormImages(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      alert('Tải ảnh lên thất bại');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmitReview = async () => {
    if (formRating === 0) {
      alert('Vui lòng chọn số sao đánh giá');
      return;
    }

    setIsSubmitting(true);
    const item = eligibleItems[selectedItemIndex];

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          variantId: item?.variantId,
          orderId: item?.orderId,
          orderItemId: item?.orderItemId,
          rating: formRating,
          comment: formComment,
          images: formImages,
          experienceRatings: formExperienceRatings
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setIsWriting(false);
        // refresh eligibility
        checkEligibility();
      } else {
        const errorData = await res.json();
        alert(errorData.message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert('Không thể gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm text-center">
        <p className="text-neutral-500 mb-4">Không thể tải đánh giá. Vui lòng thử lại.</p>
        <button onClick={() => fetchReviews(1, ratingFilter, true)} className="px-4 py-2 border rounded-full text-sm font-medium hover:bg-neutral-50">Thử lại</button>
      </section>
    );
  }

  return (
    <>
    <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 lg:p-10 shadow-sm scroll-mt-24">
      <h2 className="text-xl font-bold text-neutral-900 mb-6 uppercase">Đánh giá sản phẩm</h2>
      
      {/* Rating Overview */}
      {ratingSummary && ratingSummary.reviewCount > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1.5fr] gap-8 lg:gap-12 mb-10 pb-10 border-b border-neutral-100">
          {/* Main Average */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-5xl font-black text-neutral-900">{ratingSummary.ratingAverage}</div>
            <div className="flex items-center gap-1 mt-2 text-yellow-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`w-5 h-5 ${star <= Math.round(ratingSummary.ratingAverage) ? 'fill-current' : 'fill-current text-neutral-200'}`} />
              ))}
            </div>
            <div className="text-sm font-medium text-neutral-500 mt-2">Dựa trên {ratingSummary.reviewCount} đánh giá</div>
            
            {!isWriting && (
              <button 
                onClick={handleWriteClick}
                className="mt-6 rounded-full bg-blue-600 text-white px-8 py-3 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
              >
                Viết đánh giá
              </button>
            )}
            {submitSuccess && (
              <div className="mt-4 text-sm font-medium text-green-600 bg-green-50 px-4 py-2 rounded-full text-center">
                Đánh giá của bạn đã gửi và đang chờ duyệt
              </div>
            )}
          </div>
          
          {/* Rating Bars */}
          <div className="flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-neutral-100 pt-6 md:pt-0 md:pl-8 lg:pl-12">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingSummary.ratingBreakdown[rating as keyof typeof ratingSummary.ratingBreakdown] || 0;
              const percent = ratingSummary.reviewCount > 0 ? Math.round((count / ratingSummary.reviewCount) * 100) : 0;
              return (
                <div key={rating} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 w-8 text-sm font-semibold text-neutral-700">
                    {rating} <Star className="w-3.5 h-3.5 text-neutral-400 fill-current" />
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="w-10 text-xs font-medium text-neutral-500 text-right">{percent}%</div>
                </div>
              );
            })}
          </div>

          {/* Experience Ratings */}
          <div className="flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-neutral-100 pt-6 md:pt-0 md:pl-8 lg:pl-12">
            <h3 className="text-sm font-bold text-neutral-900 mb-2">Đánh giá theo trải nghiệm</h3>
            {criteria.map(crit => {
              const score = ratingSummary.experienceRatings?.[crit.id] || 0;
              if (score === 0) return null; // Hide if no one rated this yet
              return (
                <div key={crit.id} className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium text-neutral-700 truncate w-24 sm:w-32">{crit.label}</div>
                  <div className="flex items-center gap-1 text-yellow-500 flex-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3.5 h-3.5 ${star <= Math.round(score) ? 'fill-current' : 'fill-current text-neutral-200'}`} />
                    ))}
                  </div>
                  <div className="text-xs font-bold text-neutral-900">{score.toFixed(1)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border-b border-neutral-100 mb-8">
          <Star className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-neutral-900">Chưa có đánh giá nào</h3>
          <p className="text-neutral-500 mt-2">Hãy là người đầu tiên chia sẻ trải nghiệm của bạn.</p>
          {!isWriting && (
            <button 
              onClick={handleWriteClick}
              className="mt-6 rounded-full bg-neutral-900 text-white px-6 py-2 text-sm font-semibold hover:bg-black transition-colors"
            >
              Viết đánh giá
            </button>
          )}
          {submitSuccess && (
            <div className="mt-6 inline-block text-sm font-medium text-green-600 bg-green-50 px-4 py-2 rounded-full text-center border border-green-200">
              Đánh giá của bạn đã gửi và đang chờ duyệt
            </div>
          )}
        </div>
      )}

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl text-center">
            <h3 className="text-xl font-bold mb-3">Đăng nhập để đánh giá</h3>
            <p className="text-neutral-500 mb-6 text-sm">Vui lòng đăng nhập để chia sẻ trải nghiệm của bạn về sản phẩm này.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsLoginModalOpen(false)} className="px-6 py-2 border border-neutral-200 rounded-full text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors">Đóng</button>
              <button onClick={() => navigate('/login')} className="px-6 py-2 rounded-full text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Đăng nhập</button>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Form Modal */}
      {isWriting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 sm:p-8 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-neutral-900">Đánh giá sản phẩm</h3>
              <button onClick={() => setIsWriting(false)} className="text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-center font-medium text-neutral-600 mb-4">Bạn cảm thấy sản phẩm này thế nào?</p>

            {eligibleItems.length > 1 && (
              <div className="mb-6 bg-neutral-50 p-4 rounded-xl">
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Chọn sản phẩm đã mua</label>
                <select 
                  value={selectedItemIndex}
                  onChange={(e) => setSelectedItemIndex(Number(e.target.value))}
                  className="w-full rounded-lg border-neutral-200 py-2.5 px-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {eligibleItems.map((item, idx) => (
                    <option key={item.orderItemId} value={idx}>
                      {item.variantInfo} (Đơn {item.orderCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {eligibleItems.length === 1 && (
              <div className="mb-6 bg-neutral-50 p-4 rounded-xl text-sm text-neutral-600">
                <span className="font-semibold text-neutral-900">Đang đánh giá: </span>
                {eligibleItems[0].variantInfo}
              </div>
            )}

          <div className="mb-6 flex flex-col items-center">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Đánh giá tổng thể</h4>
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setFormHoverRating(star)}
                  onMouseLeave={() => setFormHoverRating(0)}
                  onClick={() => setFormRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star className={`w-10 h-10 ${star <= (formHoverRating || formRating) ? 'fill-yellow-500 text-yellow-500' : 'fill-neutral-200 text-neutral-200'}`} />
                </button>
              ))}
            </div>
            <div className="text-sm font-semibold text-yellow-600">{formRating}/5</div>
          </div>

          <div className="mb-6 border-t border-neutral-100 pt-6">
            <h4 className="text-sm font-bold text-neutral-900 mb-4">Đánh giá theo trải nghiệm (Tùy chọn)</h4>
            <div className="space-y-4">
              {criteria.map(crit => (
                <div key={crit.id} className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium text-neutral-700">{crit.label}</div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFormExperienceRatings(prev => ({ ...prev, [crit.id]: star }))}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star className={`w-6 h-6 ${(formExperienceRatings[crit.id] || 0) >= star ? 'fill-yellow-500 text-yellow-500' : 'fill-neutral-200 text-neutral-200'}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <textarea 
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              value={formComment}
              onChange={(e) => setFormComment(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 p-4 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            ></textarea>
          </div>

          <div className="mb-6">
            <div className="flex gap-4 overflow-x-auto pb-2">
              {formImages.map((img, idx) => (
                <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                  <img src={img.startsWith('/uploads') ? `${API_URL}${img}` : img} alt="upload" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setFormImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {formImages.length < 5 && (
                <label className="w-20 h-20 rounded-lg border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100 shrink-0 transition-colors">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-neutral-400" /> : <Upload className="w-5 h-5 text-neutral-400 mb-1" />}
                  <span className="text-[10px] font-medium text-neutral-500 text-center">Thêm ảnh<br/>(Tối đa 5)</span>
                  <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsWriting(false)}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleSubmitReview}
              disabled={isSubmitting || formRating === 0}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Gửi đánh giá
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Filters */}
      {ratingSummary && ratingSummary.reviewCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button 
            onClick={() => {
              setRatingFilter(0);
              setHasImageFilter(false);
              setIsVerifiedPurchaseFilter(false);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${ratingFilter === 0 && !hasImageFilter && !isVerifiedPurchaseFilter ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
          >
            Tất cả
          </button>
          
          <button 
            onClick={() => setIsVerifiedPurchaseFilter(!isVerifiedPurchaseFilter)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${isVerifiedPurchaseFilter ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
          >
            Đã mua hàng
          </button>
          
          <button 
            onClick={() => setHasImageFilter(!hasImageFilter)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${hasImageFilter ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
          >
            Có hình ảnh
          </button>

          {[5, 4, 3, 2, 1].map(star => (
            <button 
              key={star}
              onClick={() => {
                if (ratingFilter === star) setRatingFilter(0);
                else setRatingFilter(star);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${ratingFilter === star ? 'border-blue-600 text-blue-600 bg-blue-50' : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
            >
              {star} sao
            </button>
          ))}
        </div>
      )}

      {/* Review List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="pb-6 border-b border-neutral-100 last:border-0 last:pb-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-neutral-500 shrink-0 uppercase">
                {review.customer.fullName.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-neutral-900">{review.customer.fullName}</h4>
                  <span className="text-sm text-neutral-500">
                    {new Date(review.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <div className="flex items-center text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-current' : 'fill-current text-neutral-200'}`} />
                    ))}
                  </div>
                  {review.isVerifiedPurchase && (
                    <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Đã mua hàng
                    </span>
                  )}
                  {review.variant?.attributes && (
                    <span className="text-[11px] text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200">
                      {Object.values(review.variant.attributes).join(' · ')}
                    </span>
                  )}
                </div>
                {review.comment && <p className="text-sm text-neutral-700 leading-relaxed mb-3">{review.comment}</p>}
                
                {/* Individual Experience Ratings */}
                {review.experienceRatings && Object.keys(review.experienceRatings).length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
                    {Object.entries(review.experienceRatings).map(([key, val]) => {
                      const crit = criteria.find(c => c.id === key);
                      if (!crit) return null;
                      return (
                        <div key={key} className="flex items-center gap-1.5 bg-neutral-50 px-2 py-1 rounded-md text-xs border border-neutral-100">
                          <span className="text-neutral-600 font-medium">{crit.label}:</span>
                          <div className="flex items-center text-yellow-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-2.5 h-2.5 ${star <= val ? 'fill-current' : 'fill-current text-neutral-200'}`} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {review.images.map((img, idx) => (
                      <a key={idx} href={img.startsWith('/uploads') ? `${API_URL}${img}` : img} target="_blank" rel="noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 block hover:opacity-80 transition-opacity">
                        <img src={img.startsWith('/uploads') ? `${API_URL}${img}` : img} className="w-full h-full object-cover" alt="review" />
                      </a>
                    ))}
                  </div>
                )}

                {review.adminReply && (
                  <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">A</div>
                      <span className="font-semibold text-sm text-neutral-900">Phản hồi từ cửa hàng</span>
                      <span className="text-xs text-neutral-500 ml-auto">
                        {review.adminReplyAt && new Date(review.adminReplyAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-700">{review.adminReply}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="text-center py-8 text-neutral-500 text-sm">
            Không có đánh giá nào phù hợp với bộ lọc.
          </div>
        )}
      </div>
      
      {page < totalPages && (
        <div className="mt-8 text-center">
          <button 
            onClick={() => fetchReviews(page + 1, ratingFilter, false)}
            disabled={loading}
            className="text-sm font-semibold text-blue-600 border border-blue-200 bg-blue-50 px-6 py-2.5 rounded-full hover:bg-blue-100 hover:border-blue-300 transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Xem thêm đánh giá
          </button>
        </div>
      )}
    </section>
      
      {/* Login Prompt Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-neutral-100">
              <h3 className="font-bold text-lg text-neutral-900">Yêu cầu đăng nhập</h3>
              <button onClick={() => setIsLoginModalOpen(false)} className="text-neutral-400 hover:text-neutral-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 text-center">
              <p className="text-neutral-600 mb-6 text-sm">Bạn cần đăng nhập để có thể viết đánh giá cho sản phẩm này.</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setIsLoginModalOpen(false)}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    setIsLoginModalOpen(false);
                    navigate('/login', { state: { from: location.pathname } });
                  }}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
