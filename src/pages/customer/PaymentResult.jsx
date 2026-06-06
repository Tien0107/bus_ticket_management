import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import { getStoredToken, getStoredUser } from "../../utils/authStorage";
import { sendEmail } from "../../api/auth";

const VNPAY_ERROR_MAP = {
  "00": "Giao dịch thành công",
  "07": "Trừ tiền thành công nhưng giao dịch bị nghi ngờ. Vui lòng liên hệ nhà xe để xác nhận.",
  "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking.",
  "10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.",
  "11": "Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.",
  "12": "Thẻ hoặc tài khoản của bạn đang bị khóa.",
  "13": "Sai mật khẩu hoặc mã OTP xác thực giao dịch.",
  "24": "Giao dịch đã bị hủy bởi người dùng.",
  "51": "Tài khoản của bạn không đủ số dư để thanh toán.",
  "65": "Giao dịch vượt quá hạn mức thanh toán trong ngày.",
  "75": "Ngân hàng thanh toán hiện đang bảo trì hệ thống.",
  "79": "Nhập sai mật khẩu thanh toán quá số lần quy định.",
  "99": "Lỗi hệ thống VNPAY. Vui lòng thử lại sau hoặc liên hệ hỗ trợ."
};

const safeDecodeMessage = (value) => {
  if (!value) return "";

  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value;
  }
};

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const status = searchParams.get("status") || searchParams.get("vnp_TransactionStatus") || "";
  const code = searchParams.get("code") || searchParams.get("vnp_ResponseCode") || "";
  const message = searchParams.get("message") || "";
  const transactionCode =
    searchParams.get("transactionCode") ||
    searchParams.get("vnp_TransactionNo") ||
    searchParams.get("vnp_TxnRef") ||
    "";

  const normalizedStatus = status.toLowerCase();
  const isSuccess = normalizedStatus === "success" || normalizedStatus === "00" || code === "00";
  const hasToken = Boolean(getStoredToken());

  useEffect(() => {
    if (isSuccess) {
      addToast("Thanh toán vé xe thành công!", "success", 2800);

      const user = getStoredUser();
      const userEmail = user?.contactInfo?.email || user?.email;
      if (userEmail) {
        sendEmail({
          to: userEmail,
          subject: `[BusGo] Xác nhận thanh toán vé xe thành công - Mã GD: ${transactionCode}`,
          text: `Chào ${user.fullName || "bạn"},\n\nCảm ơn bạn đã tin tưởng lựa chọn BusGo! Thanh toán cho giao dịch của bạn đã hoàn tất thành công.\n\nThông tin chi tiết:\n- Mã giao dịch: ${transactionCode}\n- Thời gian giao dịch: ${new Date().toLocaleString("vi-VN")}\n\nVé xe của bạn đã được ghi nhận vào hệ thống. Bạn có thể xem lại chi tiết và quản lý vé tại trang cá nhân.\n\nChúc bạn có một hành trình an toàn và thuận lợi!\n\nThân ái,\nĐội ngũ BusGo`,
          template: "default",
          params: {}
        }).catch((err) => {
          console.error("Lỗi gửi email xác nhận thanh toán:", err);
        });
      }
    } else {
      addToast("Thanh toán không thành công. Vui lòng kiểm tra lại!", "error");
    }
  }, [isSuccess, addToast, transactionCode]);

  useEffect(() => {
    if (!isSuccess || !hasToken) return undefined;

    const timeoutId = setTimeout(() => {
      navigate("/profile/tickets", { replace: true });
    }, 2500);

    return () => clearTimeout(timeoutId);
  }, [hasToken, isSuccess, navigate]);

  const handleGoToTickets = () => {
    navigate("/profile/tickets");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface-container-low to-surface-dim flex flex-col justify-center items-center px-4 py-16 relative overflow-hidden font-body">
      {}
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-secondary/5 blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-surface-container-lowest/80 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/50 shadow-editorial text-center transition-all duration-500 scale-100 animate-fade-in relative z-10">
        
        {}
        <div className="flex justify-center mb-6">
          {isSuccess ?
          <div className="relative">
              {}
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping duration-1000 scale-150"></div>
              {}
              <div className="absolute inset-[-8px] rounded-full bg-primary/20 blur-md"></div>
              {}
              <div className="relative w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-[48px] animate-scale-up font-bold">
                  check_circle
                </span>
              </div>
            </div> :

          <div className="relative">
              {}
              <div className="absolute inset-[-8px] rounded-full bg-error/20 blur-md"></div>
              {}
              <div className="relative w-24 h-24 rounded-full bg-error flex items-center justify-center text-white shadow-lg shadow-error/30 animate-shake">
                <span className="material-symbols-outlined text-[48px] font-bold">
                  error
                </span>
              </div>
            </div>
          }
        </div>

        {}
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
          {isSuccess ?
          <span className="text-primary bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
              Thanh Toán Thành Công!
            </span> :

          <span className="text-error">
              Thanh Toán Thất Bại
            </span>
          }
        </h1>

        <p className="text-on-surface-variant text-sm md:text-base font-medium mb-6 max-w-sm mx-auto">
          {isSuccess ?
          "Cảm ơn bạn đã lựa chọn BusGo. Giao dịch của bạn đã hoàn tất và vé xe đang được hệ thống xử lý." :
          "Có lỗi xảy ra trong quá trình thanh toán bằng cổng VNPay hoặc giao dịch đã bị hủy bỏ."}
        </p>

        {}
        <div className="bg-surface rounded-2xl p-4 border border-surface-container-high/60 text-left space-y-3 mb-6">
          <h3 className="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest border-b border-surface-container-high pb-2">
            Chi tiết giao dịch
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Trạng thái</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                isSuccess ?
                "bg-primary/10 text-primary" :
                "bg-error/10 text-error"}`
                }>
                
                {isSuccess ? "Thành công" : "Thất bại"}
              </span>
            </div>

            {transactionCode &&
            <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-medium">Mã giao dịch</span>
                <span className="font-mono font-bold text-on-surface">{transactionCode}</span>
              </div>
            }

            {code &&
            <div className="flex justify-between items-center">
                <span className="text-on-surface-variant font-medium">Mã phản hồi</span>
                <span className="font-mono font-bold text-on-surface">{code}</span>
              </div>
            }

            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-medium">Thời gian</span>
              <span className="text-on-surface font-semibold">
                {new Date().toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric"
                })}
              </span>
            </div>

            {!isSuccess && (message || code) &&
            <div className="pt-2 border-t border-dashed border-surface-container-high animate-scale-up">
                <p className="text-xs text-error font-bold mb-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  <span>Chi tiết lỗi thanh toán:</span>
                </p>
                <p className="text-xs bg-error/5 text-error p-3.5 rounded-xl border border-error/10 leading-relaxed font-semibold">
                  {VNPAY_ERROR_MAP[code] || safeDecodeMessage(message) || "Đã xảy ra lỗi không xác định."}
                </p>
              </div>
            }
          </div>
        </div>

        {}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isSuccess ?
          <>
              <button
              onClick={handleGoToTickets}
              className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-primary/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
              
                <span className="material-symbols-outlined text-lg">confirmation_number</span>
                <span>Xem vé của tôi</span>
              </button>
              <button
              onClick={handleGoHome}
              className="w-full sm:flex-1 bg-surface-container-highest hover:bg-outline-variant/50 text-on-surface font-bold py-3.5 px-6 rounded-2xl border border-surface-container-high transition-all duration-200 flex items-center justify-center gap-2">
              
                <span className="material-symbols-outlined text-lg">home</span>
                <span>Về trang chủ</span>
              </button>
            </> :

          <>
              <button
              onClick={handleGoToTickets}
              className="w-full sm:flex-1 bg-error hover:bg-error/90 text-white font-bold py-3.5 px-6 rounded-2xl shadow-md shadow-error/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2">
              
                <span className="material-symbols-outlined text-lg">refresh</span>
                <span>Xem danh sách vé</span>
              </button>
              <button
              onClick={handleGoHome}
              className="w-full sm:flex-1 bg-surface-container-highest hover:bg-outline-variant/50 text-on-surface font-bold py-3.5 px-6 rounded-2xl border border-surface-container-high transition-all duration-200 flex items-center justify-center gap-2">
              
                <span className="material-symbols-outlined text-lg">home</span>
                <span>Về trang chủ</span>
              </button>
            </>
          }
        </div>
      </div>
    </div>);

}
