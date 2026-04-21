import React, { useEffect, useState } from "react";
import { getPaymentMethods, deletePaymentMethod, addPaymentMethod, setDefaultPaymentMethod } from "../../api/customer";
import { useNavigate } from "react-router-dom";

export default function MyPaymentMethods() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const res = await getPaymentMethods();
      const list = res.data?.paymentMethods || res.data?.data || res.data || [];
      // Wrap it in array if it's not
      setMethods(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) navigate("/login");
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

  const handleSetDefault = async (id) => {
    try {
      setLoading(true);
      await setDefaultPaymentMethod(id);
      fetchMethods();
    } catch (err) {
      alert("Lỗi khi đổi thẻ mặc định: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    // Tạm thời mô phỏng popup điền Card, thực tế sẽ dùng Stripe Elements hoặc VNPAY để tạo token ở bước này
    const token = window.prompt("Nhập Payment Method ID (Mô phỏng Stripe Token):");
    if (!token) return;

    try {
      setLoading(true);
      await addPaymentMethod(token);
      alert("Thêm thẻ thành công!");
      fetchMethods();
    } catch (err) {
      alert("Lỗi khi thêm: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end mb-8 border-b-2 border-primary pb-2">
           <h1 className="text-3xl font-bold text-primary">Hồ Sơ Của Tôi</h1>
           <button onClick={handleAdd} className="bg-primary text-white hover:bg-primary/90 transition-colors px-4 py-2 rounded-xl font-bold shadow-md flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">add</span>
              Thêm Thẻ
           </button>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-8">
           <button onClick={() => navigate("/my-tickets")} className="bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary transition-colors px-6 py-2 rounded-full font-bold shadow-sm">Vé đã đặt</button>
           <button onClick={() => navigate("/my-coupons")} className="bg-surface-container-low text-on-surface hover:bg-surface-container hover:text-primary transition-colors px-6 py-2 rounded-full font-bold shadow-sm">Ví Khuyến Mãi</button>
           <button className="bg-primary text-white px-6 py-2 rounded-full font-bold shadow-md">Thanh Toán</button>
        </div>

        {loading && methods.length === 0 ? (
          <p className="text-on-surface-variant animate-pulse">Đang tải danh sách thẻ...</p>
        ) : methods.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 text-center rounded-2xl shadow-sm border border-surface-container">
             <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">credit_card_off</span>
             <h2 className="text-xl font-bold text-on-surface mb-2">Chưa có phương thức thanh toán</h2>
             <p className="text-on-surface-variant mb-6">Bạn chưa liên kết bất kỳ thẻ nào. Hãy thêm phương thức thanh toán để thanh toán nhanh hơn!</p>
             <button onClick={handleAdd} className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">Thêm thẻ đầu tiên</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {methods.map((m, idx) => (
               <div key={idx} className="bg-gradient-to-r from-zinc-800 to-zinc-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between h-48">
                 <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                 
                 <div className="z-10 flex justify-between items-start">
                   <div className="flex space-x-2">
                     <span className="bg-white/20 inline-block px-3 py-1 rounded-md text-xs font-bold backdrop-blur-sm tracking-widest uppercase">
                       {m.brand || "CARD"}
                     </span>
                     {m.isDefault && (
                       <span className="bg-primary/80 inline-block px-3 py-1 rounded-md text-xs font-bold backdrop-blur-sm tracking-widest uppercase text-white">
                         Mặc định
                       </span>
                     )}
                   </div>
                   <div className="flex gap-2">
                     {!m.isDefault && (
                       <button onClick={() => handleSetDefault(m.id)} className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-full backdrop-blur-sm flex items-center justify-center text-white" title="Đặt làm mặc định">
                         <span className="material-symbols-outlined text-sm">check_circle</span>
                       </button>
                     )}
                     <button onClick={() => handleDelete(m.id)} className="bg-red-500/80 hover:bg-red-600 transition-colors p-2 rounded-full backdrop-blur-sm flex items-center justify-center" title="Xóa thẻ này">
                       <span className="material-symbols-outlined text-sm">delete</span>
                     </button>
                   </div>
                 </div>
                 
                 <div className="z-10 mt-auto">
                    <p className="font-mono text-xl tracking-widest mb-2 opacity-90 drop-shadow-md">
                      **** **** **** {m.last4 || "****"}
                    </p>
                    <div className="flex justify-start text-sm opacity-80 font-medium tracking-wide">
                      <span>HSD: {(m.expMonth || 0).toString().padStart(2, '0')}/{(m.expYear || 0).toString().slice(-2)}</span>
                    </div>
                 </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
