import React, { useEffect, useState } from "react";
import { getPaymentMethods, deletePaymentMethod, setDefaultPaymentMethod } from "../../api/customer";
import { useNavigate } from "react-router-dom";
import AddCardModal from "../../components/payment/AddCardModal";
import CustomerProfileNav from "../../components/profile/CustomerProfileNav";
import CustomerProfileSectionHeader from "../../components/profile/CustomerProfileSectionHeader";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";

export default function MyPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState(null);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [methodToCancel, setMethodToCancel] = useState(null);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const getPaymentMethodIdentifier = (method) => {
    return method?.stripePaymentMethodId || method?.id;
  };

  const normalizeDefaultMethods = (rawMethods = [], preferredId = null) => {
    const safeMethods = Array.isArray(rawMethods) ? rawMethods : [];
    if (!safeMethods.length) return [];

    const preferredDefault = preferredId
      ? safeMethods.find((method) => getPaymentMethodIdentifier(method) === preferredId)
      : null;
    const fallbackDefault = safeMethods.find((method) => method?.isDefault);
    const defaultMethod = preferredDefault || fallbackDefault || safeMethods[0];
    const defaultId = getPaymentMethodIdentifier(defaultMethod);

    return safeMethods.map((method) => ({
      ...method,
      isDefault: getPaymentMethodIdentifier(method) === defaultId,
    }));
  };

  const mergeMethodsKeepOrder = (previousMethods = [], incomingMethods = []) => {
    const previousOrder = new Map(
      previousMethods.map((method, index) => [getPaymentMethodIdentifier(method), index]),
    );

    return [...incomingMethods].sort((a, b) => {
      const idA = getPaymentMethodIdentifier(a);
      const idB = getPaymentMethodIdentifier(b);
      const indexA = previousOrder.get(idA);
      const indexB = previousOrder.get(idB);

      if (indexA == null && indexB == null) return 0;
      if (indexA == null) return 1;
      if (indexB == null) return -1;
      return indexA - indexB;
    });
  };

  const fetchMethods = async ({ silent = false, preferredId = null } = {}) => {
    try {
      if (!silent) setLoading(true);
      const res = await getPaymentMethods();
      const list = res.data?.paymentMethods || res.data?.data || res.data || [];
      const normalizedList = Array.isArray(list) ? list : [];
      let stableMethods = [];
      setMethods((prevMethods) => {
        const mergedMethods = mergeMethodsKeepOrder(prevMethods, normalizedList);
        stableMethods = normalizeDefaultMethods(mergedMethods, preferredId);
        return stableMethods;
      });
      return stableMethods;
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
      return [];
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, [navigate]);

  const executeDelete = async (id) => {
    try {
      setLoading(true);
      await deletePaymentMethod(id);
      addToast("Xóa thành công!", "success");
      fetchMethods();
    } catch (err) {
      addToast("Lỗi khi xóa: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setLoading(false);
      setMethodToCancel(null);
    }
  };

  const handleDelete = (id) => {
    setMethodToCancel(id);
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
    if (!paymentMethodId || settingDefaultId) return;
    try {
      setSettingDefaultId(paymentMethodId);
      await setDefaultPaymentMethod(paymentMethodId);
      setMethods((prevMethods) => normalizeDefaultMethods(prevMethods, paymentMethodId));
      await fetchMethods({ silent: true, preferredId: paymentMethodId });
    } catch (err) {
      addToast("Lỗi khi đổi thẻ mặc định: " + (err.response?.data?.message || err.message), "error");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleCardAdded = async (newPaymentMethodId) => {
    if (!newPaymentMethodId) return;

    await fetchMethods({ preferredId: newPaymentMethodId });
    addToast("Thêm thẻ thành công!", "success");
  };

  return (
    <div className="bg-surface min-h-screen pt-24 pb-12 px-6">
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

        <ConfirmModal 
          isOpen={!!methodToCancel} 
          title="Xác nhận gỡ thẻ" 
          message="Bạn có chắc chắn muốn gỡ thẻ thanh toán này không?" 
          confirmText="Có, gỡ thẻ"
          cancelText="Đóng"
          onConfirm={() => executeDelete(methodToCancel)} 
          onCancel={() => setMethodToCancel(null)} 
        />

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
            {methods.map((m) => (
               <div
                 key={getPaymentMethodIdentifier(m)}
                 className={`rounded-3xl p-6 border shadow-sm flex flex-col justify-between min-h-[210px] transition-colors transition-shadow duration-200 ${
                   m.isDefault
                     ? "bg-gradient-to-br from-primary/15 via-primary-container/30 to-surface border-primary/40 shadow-primary/20 shadow-lg"
                     : "bg-gradient-to-br from-surface-container-low to-surface border-outline-variant/30 hover:border-primary/25 hover:shadow-md"
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
                     <span
                       className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-sm transition-opacity ${
                         m.isDefault
                           ? "bg-primary text-on-primary opacity-100"
                           : "opacity-0 pointer-events-none"
                       }`}
                     >
                       <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                       Mặc định
                     </span>
                   </div>
                   <div className="flex gap-2">
                     {!m.isDefault && (
                      <button
                        onClick={() => handleSetDefault(getPaymentMethodIdentifier(m))}
                        disabled={Boolean(settingDefaultId)}
                        className="bg-surface-container-low hover:bg-surface-container transition-colors p-2 rounded-full flex items-center justify-center text-primary disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Đặt làm mặc định"
                      >
                         <span className="material-symbols-outlined text-sm">
                           {settingDefaultId === getPaymentMethodIdentifier(m) ? "progress_activity" : "check_circle"}
                         </span>
                       </button>
                     )}
                    <button
                      onClick={() => handleDelete(getPaymentMethodIdentifier(m))}
                      disabled={Boolean(settingDefaultId)}
                      className="bg-surface-container hover:bg-surface-container-high transition-colors p-2 rounded-full flex items-center justify-center text-on-surface-variant disabled:opacity-60 disabled:cursor-not-allowed"
                      title="Xóa thẻ này"
                    >
                       <span className="material-symbols-outlined text-sm">delete</span>
                     </button>
                   </div>
                 </div>
                 
                 <div className="z-10 mt-auto">
                    <p className="font-mono text-[22px] tracking-[0.25em] mb-2 text-on-surface">
                      **** **** **** {m.last4 || "****"}
                    </p>
                    <div className="flex items-end justify-between text-sm text-on-surface-variant font-medium tracking-wide gap-3">
                      <span>HSD: {(m.expMonth || 0).toString().padStart(2, '0')}/{(m.expYear || 0).toString().slice(-2)}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-on-surface-variant/80">
                        Secure Payment
                      </span>
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
