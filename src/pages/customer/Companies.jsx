import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCompanies } from "../../api/public";
import { getTripScheduleRatings } from "../../api/customer";
import CompanyReviewsModal from "../../components/reviews/CompanyReviewsModal";

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedCompanyForReview, setSelectedCompanyForReview] = useState(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await getCompanies({ limit: 100 });
        const data = response.data?.companies || response.data?.data || [];
        const baseCompanies = Array.isArray(data) ? data : [];

        const companiesWithRatings = await Promise.all(
          baseCompanies.map(async (company) => {
            try {
              const res = await getTripScheduleRatings({ companyId: company.id || company._id, limit: 100 });
              const comments = res.data?.comments || [];
              if (comments.length === 0) return { ...company, rating: 0, totalReviews: 0 };

              let sum = 0;
              comments.forEach((c) => sum += c.rating || 5);
              return {
                ...company,
                rating: sum / comments.length,
                totalReviews: comments.length
              };
            } catch (err) {
              return { ...company, rating: 0, totalReviews: 0 };
            }
          })
        );


        companiesWithRatings.sort((a, b) => b.rating - a.rating);
        setCompanies(companiesWithRatings);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách nhà xe:", err);
        setError("Không thể tải danh sách nhà xe. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const openReviewModal = (company, e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedCompanyForReview(company);
    setIsReviewModalOpen(true);
  };

  return (
    <div className="bg-surface-container-lowest min-h-[80vh] pt-32 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-on-surface mb-4">Top Nhà Xe Chất Lượng</h1>
          <p className="text-on-surface-variant text-lg">Khám phá và đặt vé với các đối tác vận tải hàng đầu của BusGo</p>
        </div>

        {loading &&
        <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        }

        {error && !loading &&
        <div className="text-center text-red-500 py-10 font-medium bg-red-50 rounded-xl">{error}</div>
        }

        {!loading && !error && companies.length > 0 &&
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {companies.map((company) =>
          <div
            key={company.id || company._id}
            className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/20 hover:-translate-y-2 hover:shadow-editorial transition-all duration-300 flex flex-col group">
            
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center flex-shrink-0 border border-primary/10">
                    {company.logo || company.logoUrl ?
                <img
                  src={company.logo || company.logoUrl}
                  alt={company.name || company.company_name}
                  className="w-12 h-12 object-contain rounded-lg"
                  onError={(e) => {e.target.style.display = 'none';e.target.nextSibling.style.display = 'block';}} /> :

                null}
                    <span
                  className="material-symbols-outlined text-primary text-3xl"
                  style={{ display: company.logo || company.logoUrl ? 'none' : 'block' }}>
                  
                      directions_bus
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-on-surface truncate group-hover:text-primary transition-colors" title={company.name || company.company_name}>
                      {company.name || company.company_name || "Nhà xe"}
                    </h3>
                    
                    <div
                  onClick={(e) => openReviewModal(company, e)}
                  className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 -ml-2.5 rounded-lg hover:bg-yellow-50 cursor-pointer transition-colors">
                  
                      <span className="material-symbols-outlined text-yellow-400 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-extrabold text-sm text-on-surface">{company.rating > 0 ? company.rating.toFixed(1) : "0.0"}</span>
                      <span className="text-on-surface-variant text-xs underline decoration-dotted underline-offset-2 hover:text-primary transition-colors">
                        ({company.totalReviews} đánh giá)
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1 mb-5 flex-1">
                  {(company.phone || company.phone_number) &&
              <p className="text-on-surface-variant text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">call</span>
                      {company.phone || company.phone_number}
                    </p>
              }
                  {company.email &&
              <p className="text-on-surface-variant text-sm flex items-center gap-2 truncate" title={company.email}>
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      {company.email}
                    </p>
              }
                </div>

                <div className="mt-auto pt-4 border-t border-outline-variant/20 flex items-center justify-end">
                  <Link
                to={`/routes?companyId=${company.id || company._id}`}
                className="bg-primary/10 text-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-colors flex items-center gap-1 w-full justify-center">
                
                    Xem tuyến chạy
                  </Link>
                </div>
              </div>
          )}
          </div>
        }
      </div>

      <CompanyReviewsModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        companyId={selectedCompanyForReview?.id || selectedCompanyForReview?._id}
        companyName={selectedCompanyForReview?.name || selectedCompanyForReview?.company_name} />
      
    </div>);

};

export default Companies;