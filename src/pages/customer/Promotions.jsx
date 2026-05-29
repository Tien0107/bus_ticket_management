import React, { useState, useEffect } from "react";
import { getPromotions } from "../../api/public";
import PromotionModal from "../../components/promotions/PromotionModal";

const fallbackPromoImages = [
"/images/real_promo_flash_1778469351380.png",
"/images/real_promo_route_1778469366193.png",
"/images/real_promo_referral_1778469381670.png",
"/images/real_promo_summer_1778469397468.png",
"/images/real_promo_payment_1778469409783.png"];


const Promotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedPromotion, setSelectedPromotion] = useState(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const response = await getPromotions({ limit: 100 });
        const items = response.data?.items || response.data?.data || [];
        setPromotions(Array.isArray(items) ? items : []);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi tải danh sách khuyến mãi:", err);
        setError("Không thể tải danh sách khuyến mãi. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  return (
    <div className="bg-surface-container-lowest min-h-[80vh] pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-4">Chương Trình Khuyến Mãi</h1>
          <p className="text-on-surface-variant text-lg">Cập nhật những ưu đãi hấp dẫn nhất từ BusGo và các đối tác</p>
        </div>

        {loading &&
        <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        }

        {error && !loading &&
        <div className="text-center text-red-500 py-10 font-medium bg-red-50 rounded-xl">{error}</div>
        }

        {!loading && !error && promotions.length === 0 &&
        <div className="text-center py-20 text-on-surface-variant bg-surface-container rounded-2xl">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-50">local_offer</span>
            <p className="text-lg">Hiện chưa có chương trình khuyến mãi nào.</p>
          </div>
        }

        {!loading && !error && promotions.length > 0 &&
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {promotions.map((item, index) =>
          <div
            key={item.id}
            onClick={() => {
              setSelectedPromotion({
                ...item,
                imageUrl: item.imageUrl || fallbackPromoImages[index % fallbackPromoImages.length]
              });
            }}
            className="bg-white rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden cursor-pointer hover:-translate-y-2 hover:shadow-editorial transition-all duration-300 flex flex-col group">
            
                <div className="h-48 w-full overflow-hidden relative bg-surface-container-low border-b border-outline-variant/20">
                  <img
                src={item.imageUrl || fallbackPromoImages[index % fallbackPromoImages.length]}
                alt={item.title}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {e.target.src = fallbackPromoImages[index % fallbackPromoImages.length];}} />
              
                  {}
                  {new Date() - new Date(item.startDate) < 3 * 24 * 60 * 60 * 1000 &&
              <div className="absolute top-3 left-3 bg-secondary text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-sm">
                      Mới
                    </div>
              }
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                  <h4 className="font-bold text-lg text-on-surface line-clamp-2 leading-snug mb-3 group-hover:text-primary transition-colors" title={item.title}>
                    {item.title}
                  </h4>
                  
                  <div className="mt-auto pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
                    <span className="text-sm font-medium text-on-surface-variant flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px]">event</span> 
                      {new Date(item.startDate).toLocaleDateString('vi-VN')} - {new Date(item.endDate).toLocaleDateString('vi-VN')}
                    </span>
                    <div className="flex items-center justify-between mt-1">
                      {item.isActive ?
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-md flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span> Đang chạy
                        </span> :

                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                          Hết hạn
                        </span>
                  }
                      <span className="text-primary font-bold text-sm hover:underline">Chi tiết</span>
                    </div>
                  </div>
                </div>
              </div>
          )}
          </div>
        }
      </div>

      <PromotionModal
        isOpen={!!selectedPromotion}
        onClose={() => setSelectedPromotion(null)}
        promotion={selectedPromotion} />
      
    </div>);

};

export default Promotions;