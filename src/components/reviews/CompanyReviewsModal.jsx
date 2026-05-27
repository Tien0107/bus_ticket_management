import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTripScheduleRatings } from "../../api/customer";

const PAGE_LIMIT = 10;
const SUMMARY_LIMIT = 100;
const MAX_SUMMARY_PAGES = 20;

const extractReviews = (data) => {
  const nested = data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(nested)) return nested;
  const list =
    data?.comments ||
    data?.reviews ||
    data?.ratings ||
    data?.items ||
    data?.records ||
    nested?.comments ||
    nested?.reviews ||
    nested?.ratings ||
    nested?.items ||
    nested?.records ||
    [];
  return Array.isArray(list) ? list : [];
};

const extractNextCursor = (data) => {
  const nested = data?.data || {};
  return (
    data?.next ||
    data?.nextCursor ||
    data?.cursor?.next ||
    data?.pagination?.next ||
    nested?.next ||
    nested?.nextCursor ||
    nested?.cursor?.next ||
    nested?.pagination?.next ||
    null
  );
};

const getRatingValue = (review) => {
  const value = Number(review?.rating ?? review?.star ?? review?.stars ?? 5);
  if (!Number.isFinite(value)) return 5;
  return Math.min(5, Math.max(1, value));
};

const getRatingBucket = (review) => Math.min(5, Math.max(1, Math.round(getRatingValue(review))));

const buildStatsFromReviews = (items, hasMore = false) => {
  const total = items.length;
  let sum = 0;

  items.forEach((review) => {
    sum += getRatingValue(review);
  });

  return {
    average: total > 0 ? (sum / total).toFixed(1) : "0.0",
    total,
    hasMore,
  };
};

const getReviewerName = (review) =>
  review?.reviewerName ||
  review?.customerName ||
  review?.userName ||
  review?.customer?.name ||
  review?.user?.name ||
  "Khách hàng";

const getReviewerInitial = (review) => getReviewerName(review).trim().charAt(0) || "K";

const getReviewDate = (review) => {
  const value = review?.createdAt || review?.created_at || review?.ratedAt || review?.updatedAt;
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const getRatingMeta = (review) => {
  const rating = getRatingBucket(review);
  if (rating >= 5) return { title: "Rất hài lòng", tone: "text-green-700 bg-green-50 border-green-200" };
  if (rating === 4) return { title: "Hài lòng", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (rating === 3) return { title: "Trải nghiệm ổn", tone: "text-yellow-700 bg-yellow-50 border-yellow-200" };
  if (rating === 2) return { title: "Cần cải thiện", tone: "text-orange-700 bg-orange-50 border-orange-200" };
  return { title: "Chưa hài lòng", tone: "text-red-700 bg-red-50 border-red-200" };
};

const getDisplayComment = (review) => {
  const comment = String(review?.comment || review?.content || "").trim();
  if (comment) return comment;
  const rating = getRatingBucket(review);
  if (rating >= 5) return "Trải nghiệm rất tốt, dịch vụ đáp ứng kỳ vọng trong suốt hành trình.";
  if (rating === 4) return "Chuyến đi nhìn chung ổn, nhà xe phục vụ khá tốt.";
  if (rating === 3) return "Chất lượng ở mức chấp nhận được, vẫn còn điểm có thể cải thiện thêm.";
  return "Trải nghiệm chưa như mong đợi, cần nâng cấp dịch vụ để phục vụ tốt hơn.";
};

const getReviewTags = (review) => {
  const rating = getRatingBucket(review);
  const comment = String(review?.comment || review?.content || "").toLowerCase();
  const tags = [];

  if (comment.includes("đúng giờ") || comment.includes("đúng h")) tags.push("Đúng giờ");
  if (comment.includes("sạch") || comment.includes("thoáng")) tags.push("Xe sạch");
  if (comment.includes("tài xế") || comment.includes("phụ xe")) tags.push("Nhân viên");
  if (comment.includes("êm") || comment.includes("an toàn")) tags.push("Di chuyển êm");

  if (tags.length === 0) {
    if (rating >= 5) tags.push("Dịch vụ tốt", "Sẵn sàng giới thiệu");
    else if (rating === 4) tags.push("Trải nghiệm ổn định", "Phù hợp nhu cầu");
    else if (rating === 3) tags.push("Mức trung bình", "Cần cải thiện nhẹ");
    else tags.push("Cần cải thiện", "Chưa đạt kỳ vọng");
  }

  return tags.slice(0, 3);
};

const mergeUniqueReviews = (current, incoming) => {
  const seenIds = new Set(current.map((item) => item?.id || item?._id || item?.ratingId).filter(Boolean));
  const uniqueIncoming = incoming.filter((item) => {
    const id = item?.id || item?._id || item?.ratingId;
    if (!id) return true;
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
  return [...current, ...uniqueIncoming];
};

const CompanyReviewsModal = ({ isOpen, onClose, companyId, companyName }) => {
  const [reviews, setReviews] = useState([]);
  const [summaryStats, setSummaryStats] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [starFilter, setStarFilter] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterRefreshing, setFilterRefreshing] = useState(false);
  const scrollContainerRef = useRef(null);
  const loadMoreRef = useRef(null);
  const listRequestRef = useRef(0);
  const summaryRequestRef = useRef(0);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);

  const stats = useMemo(() => summaryStats || buildStatsFromReviews([]), [summaryStats]);

  const fetchReviewSummary = useCallback(async () => {
    if (!companyId) return;
    const requestId = summaryRequestRef.current + 1;
    summaryRequestRef.current = requestId;

    try {
      setSummaryLoading(true);
      setSummaryStats(null);
      let cursor = null;
      let allReviews = [];
      let hasMore = false;

      for (let page = 0; page < MAX_SUMMARY_PAGES; page += 1) {
        const response = await getTripScheduleRatings({
          companyId,
          limit: SUMMARY_LIMIT,
          ...(cursor ? { next: cursor } : {}),
        });
        const data = response.data || {};
        allReviews = [...allReviews, ...extractReviews(data)];
        cursor = extractNextCursor(data);
        hasMore = Boolean(cursor);
        if (!cursor) break;
      }

      if (summaryRequestRef.current !== requestId) return;
      setSummaryStats(buildStatsFromReviews(allReviews, hasMore));
    } catch (err) {
      console.error("Lỗi khi tải tổng quan đánh giá:", err);
      if (summaryRequestRef.current === requestId) {
        setSummaryStats(buildStatsFromReviews([]));
      }
    } finally {
      if (summaryRequestRef.current === requestId) {
        setSummaryLoading(false);
      }
    }
  }, [companyId]);

  const fetchReviews = useCallback(async ({ append = false, cursor = null } = {}) => {
    if (!companyId) return;
    if (append && (!cursor || loadingMoreRef.current)) return;

    const requestId = listRequestRef.current + 1;
    listRequestRef.current = requestId;

    try {
      if (append) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        loadingRef.current = true;
        if (reviews.length === 0) {
          setLoading(true);
        } else {
          setFilterRefreshing(true);
        }
      }

      const params = {
        companyId,
        limit: PAGE_LIMIT,
        ...(starFilter ? { star: starFilter } : {}),
        ...(append && cursor ? { next: cursor } : {}),
      };

      const response = await getTripScheduleRatings(params);
      const data = response.data || {};
      const list = extractReviews(data);
      const next = extractNextCursor(data);

      if (listRequestRef.current !== requestId) return;
      if (append) {
        setReviews((prev) => mergeUniqueReviews(prev, list));
      } else {
        setReviews(list);
        scrollContainerRef.current?.scrollTo({ top: 0 });
      }
      setNextCursor(next);
      setError(null);
    } catch (err) {
      console.error("Lỗi khi tải đánh giá:", err);
      if (listRequestRef.current === requestId) {
        setError("Không thể tải danh sách đánh giá. Vui lòng thử lại sau.");
      }
    } finally {
      if (listRequestRef.current === requestId) {
        setLoading(false);
        setLoadingMore(false);
        setFilterRefreshing(false);
        loadingRef.current = false;
        loadingMoreRef.current = false;
      }
    }
  }, [companyId, reviews.length, starFilter]);

  useEffect(() => {
    if (isOpen && companyId) {
      fetchReviewSummary();
    }
  }, [isOpen, companyId, fetchReviewSummary]);

  useEffect(() => {
    if (isOpen && companyId) {
      setNextCursor(null);
      setError(null);
      fetchReviews();
    }
  }, [isOpen, companyId, starFilter, fetchReviews]);

  useEffect(() => {
    if (!isOpen || !nextCursor || loading || loadingMore) return undefined;

    const root = scrollContainerRef.current;
    const target = loadMoreRef.current;
    if (!root || !target) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && nextCursor && !loadingMoreRef.current) {
          fetchReviews({ append: true, cursor: nextCursor });
        }
      },
      { root, rootMargin: "180px 0px 180px 0px", threshold: 0.01 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchReviews, isOpen, loading, loadingMore, nextCursor]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Panel */}
      <div className="relative bg-white rounded-3xl shadow-[0_24px_80px_rgba(15,23,42,0.22)] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>reviews</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black text-on-surface leading-tight">Đánh giá nhà xe</h2>
              <p className="text-sm text-on-surface-variant font-semibold truncate">{companyName || "Đang tải..."}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            aria-label="Đóng đánh giá"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-container-lowest">
          
          {/* Overview Section */}
          <div className="mb-6 overflow-hidden rounded-3xl border border-outline-variant/25 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3 border-b border-outline-variant/20 px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase text-primary">Tổng quan chất lượng</p>
                <p className="text-sm font-medium text-on-surface-variant">
                  {summaryLoading ? "Đang đồng bộ dữ liệu đánh giá..." : `${stats.total}${stats.hasMore ? "+" : ""} đánh giá đã ghi nhận`}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-black text-primary">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                BusGo reviews
              </div>
            </div>

            {summaryLoading ? (
              <div className="p-5">
                <div className="h-40 rounded-2xl bg-surface-container-low animate-pulse"></div>
              </div>
            ) : (
              <div className="p-5">
              <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 via-white to-yellow-50 px-5 py-6 text-center">
                <div className="text-6xl font-black tracking-normal text-on-surface mb-1">{stats.average}</div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className="material-symbols-outlined text-yellow-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      star
                    </span>
                  ))}
                </div>
                <div className="text-sm font-bold text-on-surface-variant">{stats.total}{stats.hasMore ? "+" : ""} đánh giá</div>
              </div>
              </div>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setStarFilter(null)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${!starFilter ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-white border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[17px]">grid_view</span>
              Tất cả
            </button>
            {[5, 4, 3, 2, 1].map(star => (
              <button
                key={star}
                onClick={() => setStarFilter(star)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${starFilter === star ? 'bg-primary text-on-primary border-primary shadow-sm' : 'bg-white border-outline-variant text-on-surface-variant hover:bg-surface-container'}`}
              >
                {star} <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </button>
            ))}
          </div>

          {/* Reviews List */}
          <div className="relative min-h-[360px]">
            {loading && reviews.length === 0 ? (
              <div className="space-y-4">
                {[1, 2, 3].map((key) => (
                  <div key={key} className="h-[132px] rounded-2xl bg-surface-container-low animate-pulse"></div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8 font-medium bg-red-50 rounded-xl">{error}</div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">speaker_notes_off</span>
                <p>{starFilter ? `Chưa có đánh giá ${starFilter} sao.` : "Chưa có đánh giá nào."}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review, index) => {
                  const rating = getRatingBucket(review);
                  const ratingMeta = getRatingMeta(review);
                  const commentText = getDisplayComment(review);
                  const tags = getReviewTags(review);

                  return (
                    <div key={review.id || review._id || review.ratingId || index} className="p-5 rounded-2xl bg-white border border-outline-variant/25 shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary font-black flex items-center justify-center uppercase">
                            {getReviewerInitial(review)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-on-surface text-sm truncate">{getReviewerName(review)}</div>
                            {getReviewDate(review) && (
                              <div className="mt-0.5 text-xs font-medium text-on-surface-variant">{getReviewDate(review)}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-0.5 rounded-full bg-yellow-50 px-2.5 py-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`material-symbols-outlined text-[16px] ${i < rating ? 'text-yellow-400' : 'text-outline-variant'}`}
                              style={{ fontVariationSettings: i < rating ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${ratingMeta.tone}`}>
                          {ratingMeta.title}
                        </span>
                        <span className="text-xs font-medium text-on-surface-variant">Đánh giá {rating}/5</span>
                      </div>
                      <div className="rounded-xl bg-surface-container-low/60 border border-outline-variant/20 p-3">
                        <p className="text-[11px] uppercase font-black text-outline mb-1">Nhận xét chi tiết</p>
                        <p className="text-on-surface text-sm leading-relaxed whitespace-pre-wrap">
                          {commentText}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-surface-container-high px-2.5 py-1 text-[11px] font-bold text-on-surface-variant"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filterRefreshing && (
              <div className="absolute inset-0 z-10 rounded-2xl bg-white/65 backdrop-blur-[1px] flex items-start justify-center pt-12">
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-outline-variant/30 px-4 py-2 text-sm font-bold text-on-surface-variant shadow-sm">
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  Đang lọc đánh giá...
                </div>
              </div>
            )}
          </div>

          <div ref={loadMoreRef} className="h-1"></div>

          {loadingMore && (
            <div className="mt-6 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-outline-variant/30 px-4 py-2 text-sm font-bold text-on-surface-variant shadow-sm">
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                Đang tải thêm đánh giá...
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CompanyReviewsModal;
