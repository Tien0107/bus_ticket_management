import React from "react";

const PromotionModal = ({ isOpen, onClose, promotion }) => {
  if (!isOpen || !promotion) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}>
      </div>

      {}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {}
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-on-surface">Chi tiết Khuyến mãi</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
            
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {}
        <div className="flex-1 overflow-y-auto p-0 bg-surface-container-lowest">
          {}
          {promotion.imageUrl &&
          <div className="w-full h-48 sm:h-64 overflow-hidden bg-surface-container-low flex items-center justify-center border-b border-outline-variant/20">
              <img
              src={promotion.imageUrl}
              alt={promotion.title}
              className="w-full h-full object-contain" />
            
            </div>
          }

          <div className="p-6">
            <h3 className="text-2xl font-black text-on-surface mb-4 leading-snug">
              {promotion.title}
            </h3>
            
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-1.5 text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                Từ {new Date(promotion.startDate).toLocaleDateString('vi-VN')} đến {new Date(promotion.endDate).toLocaleDateString('vi-VN')}
              </div>
              {promotion.isActive &&
              <div className="flex items-center gap-1.5 text-sm font-bold text-green-700 bg-green-100 px-3 py-1.5 rounded-xl border border-green-200">
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  Đang diễn ra
                </div>
              }
            </div>

            <div className="w-full h-[1px] bg-outline-variant/30 mb-6"></div>

            <div className="text-on-surface-variant whitespace-pre-wrap leading-relaxed text-[15px]">
              {promotion.content || "Chưa có nội dung chi tiết cho chương trình này."}
            </div>
          </div>
        </div>

        {}
        <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface sticky bottom-0 z-10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
            
            Đã hiểu
          </button>
        </div>
      </div>
    </div>);

};

export default PromotionModal;