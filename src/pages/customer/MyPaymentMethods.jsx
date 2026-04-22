import React, { useEffect, useState } from "react";
import { getPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod } from "../../api/customer";
import { useNavigate } from "react-router-dom";
import AddCardModal from "../../components/payment/AddCardModal";
import CustomerProfileNav from "../../components/profile/CustomerProfileNav";
import CustomerProfileSectionHeader from "../../components/profile/CustomerProfileSectionHeader";

export default function MyPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const navigate = useNavigate();

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await getPaymentMethods();
      const list = res.data?.paymentMethods || res.data?.data || res.data || [];
      const normalizedList = Array.isArray(list) ? list : [];
      setMethods(normalizedList);
      return normalizedList;
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn gỡ thẻ này?")) return;
    try {
      setLoading(true);
      await deletePaymentMethod(id);
      alert("Xóa thành công!");
      fetchMethods();
    } catch (err) {
      alert("Lỗi khi xóa: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIdentifier = (method) => {
    return method?.stripePaymentMethodId || method?.id;
  };
  const normalizeBrand = (brand) => {
    const value = String(brand || "CARD").toLowerCase();
    if (value === "mastercard") return "Mastercard";
    if (value === "visa") return "VISA";
    if (value === "amex") return "American Express";
    return value.toUpperCase();
  };
  const getBrandTone = (brand) => {
    const value = String(brand || "").toLowerCase();
    if (value === "visa") return "text-primary bg-primary/10 border-primary/20";
    if (value === "mastercard") return "text-secondary bg-secondary/10 border-secondary/20";
    if (value === "amex") return "text-primary bg-primary-container/60 border-primary/20";
    return "text-primary bg-primary/10 border-primary/20";
  };

  const handleSetDefault = async (paymentMethodId) => {
    try {
      setLoading(true);
      await setDefaultPaymentMethod(paymentMethodId);
      setMethods((prevMethods) =>
        prevMethods.map((method) => ({
          ...method,
          isDefault: getPaymentMethodIdentifier(method) === paymentMethodId,
        })),
      );
      await fetchMethods();
    } catch (err) {
      alert("Lỗi khi đổi thẻ mặc định: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCardAdded = async (newPaymentMethodId) => {
    const freshMethods = await fetchMethods();
    if (!newPaymentMethodId) return;

    setMethods(
      freshMethods.map((method) => ({
        ...method,
        isDefault: getPaymentMethodIdentifier(method) === newPaymentMethodId,
      })),
    );
  };

  return (
    <div className="bg-surface min-h-screen pt-10 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <CustomerProfileSectionHeader
          title="Phương thức thanh toán"
          action={
            <button
              onClick={() => setShowAddCardModal(true)}
              className="bg-primary text-white hover:bg-primary/90 transition-colors px-4 py-2 rounded-xl font-bold shadow-md flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Thêm Thẻ
            </button>
          }
        />
        
        <CustomerProfileNav />

        {loading && methods.length === 0 ? (
          <p className="text-on-surface-variant animate-pulse">Đang tải danh sách thẻ...</p>
        ) : methods.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 text-center rounded-2xl shadow-sm border border-surface-container">
             <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">credit_card_off</span>
             <h2 className="text-xl font-bold text-on-surface mb-2">Chưa có phương thức thanh toán</h2>
             <p className="text-on-surface-variant mb-6">Bạn chưa liên kết bất kỳ thẻ nào. Hãy thêm phương thức thanh toán để thanh toán nhanh hơn!</p>
             <button
               onClick={() => setShowAddCardModal(true)}
               className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
             >
               Thêm thẻ đầu tiên
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {methods.map((m, idx) => (
               <div
                 key={idx}
                 className={`rounded-2xl p-6 border shadow-sm flex flex-col justify-between min-h-[192px] ${
                   m.isDefault
                     ? "bg-primary-container/30 border-primary/40"
                     : "bg-surface-container-low border-outline-variant/30"
                 }`}
               >
                 
                 <div className="z-10 flex justify-between items-start">
                   <div className="flex space-x-2">
                     <span
                       className={`inline-block px-3 py-1 rounded-md text-xs font-bold border tracking-widest uppercase ${getBrandTone(
                         m.brand,
                       )}`}
                     >
                       {normalizeBrand(m.brand)}
                     </span>
                     {m.isDefault && (
                      <span className="bg-primary text-on-primary inline-block px-3 py-1 rounded-md text-xs font-bold tracking-widest uppercase">
                         Mặc định
                       </span>
                     )}
                   </div>
                   <div className="flex gap-2">
                     {!m.isDefault && (
                      <button
                        onClick={() => handleSetDefault(getPaymentMethodIdentifier(m))}
                        className="bg-surface-container-low hover:bg-surface-container transition-colors p-2 rounded-full flex items-center justify-center text-primary"
                        title="Đặt làm mặc định"
                      >
                         <span className="material-symbols-outlined text-sm">check_circle</span>
                       </button>
                     )}
                    <button
                      onClick={() => handleDelete(getPaymentMethodIdentifier(m))}
                      className="bg-surface-container hover:bg-surface-container-high transition-colors p-2 rounded-full flex items-center justify-center text-on-surface-variant"
                      title="Xóa thẻ này"
                    >
                       <span className="material-symbols-outlined text-sm">delete</span>
                     </button>
                   </div>
                 </div>
                 
                 <div className="z-10 mt-auto">
                    <p className="font-mono text-xl tracking-widest mb-2 text-on-surface">
                      **** **** **** {m.last4 || "****"}
                    </p>
                    <div className="flex items-end justify-between text-sm text-on-surface-variant font-medium tracking-wide gap-3">
                      <span>HSD: {(m.expMonth || 0).toString().padStart(2, '0')}/{(m.expYear || 0).toString().slice(-2)}</span>
                    </div>
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>
      <AddCardModal
        open={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onAdded={handleCardAdded}
      />
    </div>
  );
}
