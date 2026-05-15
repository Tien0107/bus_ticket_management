import React, { useState, useEffect } from "react";
import { getTripScheduleRatings } from "../../api/customer";

const CompanyReviewsModal = ({ isOpen, onClose, companyId, companyName }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [starFilter, setStarFilter] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Tính toán thống kê dựa trên dữ liệu thật
  const stats = React.useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.length;
    let sum = 0;
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      sum += r.rating || 5;
      const rate = Math.round(r.rating || 5);
      if (dist[rate] !== undefined) dist[rate]++;
    });
    return {
      average: (sum / total).toFixed(1),
      total,
      distribution: {
        5: Math.round((dist[5] / total) * 100),
        4: Math.round((dist[4] / total) * 100),
        3: Math.round((dist[3] / total) * 100),
        2: Math.round((dist[2] / total) * 100),
        1: Math.round((dist[1] / total) * 100),
      }
    };
  }, [reviews]);

  const fetchReviews = async (isLoadMore = false) => {
    if (!companyId) return;
    try {
      if (isLoadMore) setLoadingMore(true);
      else setLoading(true);

      const params = {
        companyId,
        limit: 10,
        ...(starFilter ? { star: starFilter } : {}),
        ...(isLoadMore && nextCursor ? { next: nextCursor } : {})
      };

      const response = await getTripScheduleRatings(params);
      const data = response.data || { comments: [], next: null };

      if (isLoadMore) {
        setReviews(prev => [...prev, ...(data.comments || [])]);
      } else {
        setReviews(data.comments || []);
      }
      setNextCursor(data.next);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá:", err);
      setError("Không thể tải danh sách đánh giá. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isOpen && companyId) {
      fetchReviews(false);
    }
  }, [isOpen, companyId, starFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Panel */}
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Đánh giá nhà xe</h2>
            <p className="text-sm text-on-surface-variant font-medium">{companyName || "Đang tải..."}</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest">
          
          {/* Overview Section */}
          {stats && (
            <div className="flex flex-col sm:flex-row gap-6 mb-8 p-6 bg-surface-container-low rounded-2xl">
              {/* Average Score */}
              <div className="flex flex-col items-center justify-center sm:w-1/3 sm:border-r border-outline-variant/20">
                <div className="text-5xl font-black text-on-surface mb-1">{stats.average}</div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="material-symbols-outlined text-yellow-400 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <div className="text-sm text-on-surface-variant">{stats.total} đánh giá</div>
              </div>

              {/* Distribution */}
              <div className="flex-1 flex flex-col gap-2 justify-center">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1 w-12 shrink-0 text-on-surface-variant">
                      <span className="font-bold">{star}</span>
                      <span className="material-symbols-outlined text-[14px]">star</span>
                    </div>
                    <div className="flex-1 h-2 bg-outline-variant/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400 rounded-full" 
                        style={{ width: `${stats.distribution[star]}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button 
              onClick={() => setStarFilter(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${!starFilter ? 'bg-primary-container text-on-primary-container border-primary-container' : 'bg-transparent border-outline text-on-surface-variant hover:bg-surface-container'}`}
            >
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map(star => (
              <button 
                key={star}
                onClick={() => setStarFilter(star)}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-bold border transition-colors ${starFilter === star ? 'bg-primary-container text-on-primary-container border-primary-container' : 'bg-transparent border-outline text-on-surface-variant hover:bg-surface-container'}`}
              >
                {star} <span className="material-symbols-outlined text-[14px]">star</span>
              </button>
            ))}
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center text-red-500 py-8 font-medium bg-red-50 rounded-xl">{error}</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-2 opacity-50">speaker_notes_off</span>
              <p>Chưa có đánh giá nào.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div key={review.id || index} className="p-4 rounded-2xl bg-white border border-outline-variant/30 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center uppercase">
                        {(review.reviewerName || "U").charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-on-surface text-sm">{review.reviewerName || "Khách hàng"}</div>
                        <div className="text-xs text-on-surface-variant">
                          {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span 
                          key={i} 
                          className={`material-symbols-outlined text-[16px] ${i < review.rating ? 'text-yellow-400' : 'text-outline-variant'}`}
                          style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-on-surface text-sm leading-relaxed mt-3 whitespace-pre-wrap">
                    {review.comment}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {nextCursor && !loading && (
            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => fetchReviews(true)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-full border border-outline font-bold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore ? 'Đang tải...' : 'Xem thêm đánh giá'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CompanyReviewsModal;
