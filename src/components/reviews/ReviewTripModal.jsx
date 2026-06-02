import React, { useState } from "react";
import { rateTicket } from "../../api/customer";
import { createNotification } from "../../api/notification";

const ReviewTripModal = ({ isOpen, onClose, ticket, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError("Vui lòng chọn số sao hợp lệ.");
      return;
    }


    if (comment.trim().length > 0 && comment.trim().length < 10) {
      setError("Vui lòng nhập đánh giá ít nhất 10 ký tự để giúp các hành khách khác tham khảo nhé.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const resolvedTicketId = Number(ticket.ticketId || ticket.id || ticket.bookingTicketId);
      const payload = {
        tripId: parseInt(ticket.tripId, 10),
        ticketId: Number.isFinite(resolvedTicketId) ? resolvedTicketId : ticket.ticketId || ticket.id || ticket.bookingTicketId,
        rating: parseInt(rating, 10),
        comment: comment.trim()
      };

      await rateTicket(payload);
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const currentUser = JSON.parse(userStr);
          if (currentUser?.id) {
            await createNotification({
              userId: currentUser.id,
              title: "Cảm ơn bạn đã gửi đánh giá!",
              body: `Đóng góp của bạn giúp chuyến xe #${ticket.tripId || ticket.id || ""} cải thiện chất lượng dịch vụ tốt hơn.`,
              data: JSON.stringify({ path: "/profile/tickets" })
            });
          }
        }
      } catch (notifErr) {
        console.warn("Failed to create review notification:", notifErr);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Lỗi gửi đánh giá:", err);
      setError(err.response?.data?.message || "Đã xảy ra lỗi khi gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}>
      </div>

      {}
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface">
          <h2 className="text-xl font-bold text-on-surface">Đánh giá chuyến đi</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
            
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {}
        <form onSubmit={handleSubmit} className="p-6 bg-surface-container-lowest">
          
          {}
          <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-primary">directions_bus</span>
            </div>
            <div>
              <p className="font-bold text-on-surface text-sm">{ticket.companyName || "Chuyến xe của bạn"}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {ticket.departureLocation} ➔ {ticket.arrivalLocation}
              </p>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5 text-primary">
                Khởi hành: {new Date(ticket.departureDate || Date.now()).toLocaleDateString('vi-VN')}
              </p>
              <p className="text-[10px] text-outline font-medium mt-0.5 uppercase tracking-wider">
                Mã chuyến: {ticket.code || "—"}
              </p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="font-bold text-on-surface mb-2">Bạn cảm thấy chuyến đi thế nào?</h3>
            <p className="text-sm text-on-surface-variant mb-4">Nhấp vào sao để đánh giá</p>
            
            {}
            <div className="flex justify-center gap-2" onMouseLeave={() => setRating(rating)}>
              {[1, 2, 3, 4, 5].map((star) =>
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 focus:outline-none">
                
                  <span
                  className={`material-symbols-outlined text-4xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-outline-variant'}`}
                  style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}>
                  
                    star
                  </span>
                </button>
              )}
            </div>
            <div className="text-primary font-bold mt-2 h-5">
              {rating === 5 && "Tuyệt vời!"}
              {rating === 4 && "Rất tốt"}
              {rating === 3 && "Bình thường"}
              {rating === 2 && "Tệ"}
              {rating === 1 && "Rất tệ"}
            </div>
          </div>

          {}
          <div className="mb-6">
            <label className="block text-sm font-bold text-on-surface mb-2">
              Chia sẻ thêm trải nghiệm của bạn (Tuỳ chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chất lượng xe, thái độ tài xế, độ đúng giờ..."
              className="w-full bg-surface border border-outline-variant rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none h-28">
            </textarea>
            <p className="text-right text-xs text-outline mt-1">{comment.length} ký tự</p>
          </div>

          {error &&
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              {error}
            </div>
          }

          {}
          <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors">
              
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2">
              
              {loading ?
              <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Đang gửi...
                </> :
              "Gửi đánh giá"}
            </button>
          </div>

        </form>
      </div>
    </div>);

};

export default ReviewTripModal;