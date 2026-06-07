import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { companySignUp } from "../../api/company";
import { useToast } from "../../context/ToastContext";
import axiosClient from "../../api/axiosClient";
import { contactCheck, sendOtp, contactVerify } from "../../api/auth";
import VerifiedContactField from "../../components/common/VerifiedContactField";

export default function CompanyRegisterForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    companyId: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailVer, setEmailVer] = useState({ checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" });
  const [phoneVer, setPhoneVer] = useState({ checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" });


  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedCompanyName, setSelectedCompanyName] = useState("");
  const companyDropdownRef = useRef(null);


  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const res = await axiosClient.get("/public/company", { params: { limit: 10 } });
        const list = res.data?.companies || res.data || [];
        setCompanies(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Không thể tải danh sách công ty:", err);
      } finally {
        setLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCompanies = companies.filter((c) =>
  c.name?.toLowerCase().includes(companySearch.toLowerCase())
  );

  const handleSelectCompany = (company) => {
    setForm((current) => ({ ...current, companyId: String(company.id) }));
    setSelectedCompanyName(company.name);
    setCompanySearch("");
    setShowCompanyDropdown(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleEmailChange = (val) => {
    setForm((current) => ({ ...current, email: val }));
    setEmailVer((v) => (v.checked || v.sent || v.verified ? { checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" } : v));
  };

  const handlePhoneChange = (val) => {
    setForm((current) => ({ ...current, phone: val }));
    setPhoneVer((v) => (v.checked || v.sent || v.verified ? { checked: false, sent: false, verified: false, checking: false, sending: false, verifying: false, otp: "", error: "" } : v));
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Họ tên bắt buộc";
    if (!form.email.trim()) return "Email bắt buộc";
    if (!form.email.includes("@")) return "Email không hợp lệ";
    if (!form.phone.trim()) return "Số điện thoại bắt buộc";
    if (form.phone.length < 10) return "Số điện thoại tối thiểu 10 ký tự";
    if (!form.password) return "Mật khẩu bắt buộc";
    if (form.password.length < 8) return "Mật khẩu tối thiểu 8 ký tự";
    if (!form.companyId) return "Vui lòng chọn công ty";
    if (!Number.isFinite(Number(form.companyId))) return "Công ty không hợp lệ";
    return "";
  };

  // Verification helpers
  const getVerState = (field) => (field === "email" ? emailVer : phoneVer);
  const setVerState = (field) => (field === "email" ? setEmailVer : setPhoneVer);
  const currentFormValue = (field) => (field === "email" ? form.email : form.phone);

  const handleCheck = async (field) => {
    const value = currentFormValue(field).trim();
    const setter = setVerState(field);
    if (!value) { setter((s) => ({ ...s, error: "Nhập giá trị." })); return; }
    // Client-side format validation
    if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setter((s) => ({ ...s, error: "Email không hợp lệ. Vui lòng nhập đúng định dạng." }));
      return;
    }
    if (field === "phone" && !/^(?:\+84|0)\d{9}$/.test(value)) {
      setter((s) => ({ ...s, error: "Số điện thoại không hợp lệ (10 số, bắt đầu 0 hoặc +84)." }));
      return;
    }
    setter((s) => ({ ...s, checking: true, error: "", checked: false, sent: false, verified: false }));
    try {
      await contactCheck({ field, value });
      setter((s) => ({ ...s, checked: true, checking: false, error: "" }));
    } catch (err) {
      setter((s) => ({ ...s, checking: false, error: err.response?.data?.message || "Không khả dụng." }));
    }
  };

  const handleSendVerification = async (field) => {
    const value = currentFormValue(field).trim();
    const setter = setVerState(field);
    const state = getVerState(field);
    if (!state.checked) { setter((s) => ({ ...s, error: "Kiểm tra trước." })); return; }
    setter((s) => ({ ...s, sending: true, error: "" }));
    try {
      await sendOtp({ field, value });
      setter((s) => ({ ...s, sent: true, sending: false, otp: "", error: "" }));
    } catch (err) {
      setter((s) => ({ ...s, sending: false, error: "Gửi mã thất bại." }));
    }
  };

  const handleVerifyOtp = async (field) => {
    const value = currentFormValue(field).trim();
    const state = getVerState(field);
    const setter = setVerState(field);
    const otp = (state.otp || "").trim();
    if (!otp || !state.sent) { setter((s) => ({ ...s, error: "Nhập OTP." })); return; }
    setter((s) => ({ ...s, verifying: true, error: "" }));
    try {
      await contactVerify({ field, value, otp });
      setter((s) => ({ ...s, verified: true, verifying: false, error: "", _verifiedValue: value }));
    } catch (err) {
      setter((s) => ({ ...s, verifying: false, error: "OTP không đúng." }));
    }
  };

  const handleResend = async (field) => {
    setVerState(field)((s) => ({ ...s, sent: false, otp: "", error: "" }));
    await handleSendVerification(field);
  };


  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const emailOk = emailVer.verified && form.email.trim() === (emailVer._verifiedValue || form.email).trim();
    const phoneOk = phoneVer.verified && form.phone.trim() === (phoneVer._verifiedValue || form.phone).trim();
    if (!emailOk || !phoneOk) {
      setError("Vui lòng xác thực email và số điện thoại trước khi đăng ký.");
      return;
    }

    const payload = {
      fullName: form.fullName,
      contactInfo: {
        email: form.email,
        phone: form.phone
      },
      password: form.password,
      companyId: Number(form.companyId)
    };

    try {
      setLoading(true);
      const res = await companySignUp(payload);
      const successMessage = res.data?.message || "Đăng ký công ty thành công";
      addToast(successMessage, "success");
      setTimeout(() => navigate("/login"), 500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Đăng ký thất bại";
      setError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-on-surface mb-2">Đăng ký Công ty</h3>
        <p className="text-on-surface-variant">Tham gia BusGo để quản lý xe của bạn</p>
      </div>

      {error &&
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      }

      <div>
        <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin tài khoản</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Họ tên *</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="Nguyễn Văn A"
              required />
            
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin liên hệ</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <VerifiedContactField
            field="email"
            label="Email *"
            value={form.email}
            onChange={handleEmailChange}
            verification={emailVer}
            setVerification={setEmailVer}
            onCheck={() => handleCheck("email")}
            onSendVerification={() => handleSendVerification("email")}
            onVerifyOtp={() => handleVerifyOtp("email")}
            onResend={() => handleResend("email")}
            placeholder="company@example.com"
          />
          <VerifiedContactField
            field="phone"
            label="Số điện thoại *"
            value={form.phone}
            onChange={handlePhoneChange}
            verification={phoneVer}
            setVerification={setPhoneVer}
            onCheck={() => handleCheck("phone")}
            onSendVerification={() => handleSendVerification("phone")}
            onVerifyOtp={() => handleVerifyOtp("phone")}
            onResend={() => handleResend("phone")}
            placeholder="0901234567"
          />
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-on-surface mb-4">Bảo mật và công ty</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Mật khẩu *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 pr-12 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                placeholder="Abcd12345#"
                required />
              
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>

          <div ref={companyDropdownRef} className="relative">
            <label className="block text-sm font-bold text-on-surface mb-2">Chọn công ty *</label>
            <button
              type="button"
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className={`w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none text-left flex items-center justify-between gap-2 ${
              selectedCompanyName ? 'text-on-surface' : 'text-on-surface-variant/60'}`
              }>
              
              <span className="truncate">{selectedCompanyName || "-- Chọn công ty --"}</span>
              <span className="material-symbols-outlined text-on-surface-variant text-lg shrink-0">
                {showCompanyDropdown ? "expand_less" : "expand_more"}
              </span>
            </button>

            {showCompanyDropdown &&
            <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-outline-variant/20 overflow-hidden">
                {}
                <div className="p-3 border-b border-outline-variant/10">
                  <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
                    <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => setCompanySearch(e.target.value)}
                    placeholder="Tìm kiếm công ty..."
                    className="w-full bg-transparent border-0 outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50"
                    autoFocus />
                  
                  </div>
                </div>

                {}
                <div className="max-h-[200px] overflow-y-auto">
                  {loadingCompanies ?
                <div className="py-6 text-center text-on-surface-variant text-sm">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                      Đang tải...
                    </div> :
                filteredCompanies.length === 0 ?
                <div className="py-6 text-center text-on-surface-variant text-sm">
                      <span className="material-symbols-outlined text-2xl opacity-40 block mb-1">search_off</span>
                      Không tìm thấy công ty nào
                    </div> :

                filteredCompanies.map((company) =>
                <button
                  key={company.id}
                  type="button"
                  onClick={() => handleSelectCompany(company)}
                  className={`w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-center gap-3 border-b border-outline-variant/5 last:border-0 ${
                  form.companyId === String(company.id) ? 'bg-primary/10' : ''}`
                  }>
                  
                        {company.logoUrl ?
                  <img src={company.logoUrl} alt={company.name} className="w-8 h-8 rounded-lg object-cover shrink-0" /> :

                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-lg">business</span>
                          </div>
                  }
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-on-surface truncate">{company.name}</p>
                          {company.hotline &&
                    <p className="text-xs text-on-surface-variant truncate">Hotline: {company.hotline}</p>
                    }
                        </div>
                        {form.companyId === String(company.id) &&
                  <span className="material-symbols-outlined text-primary text-lg shrink-0">check_circle</span>
                  }
                      </button>
                )
                }
                </div>
              </div>
            }
          </div>
        </div>
      </div>



      <button
        type="submit"
        disabled={loading || !emailVer.verified || !phoneVer.verified}
        className="w-full bg-primary text-white px-6 py-4 rounded-xl font-bold hover:bg-primary/80 disabled:opacity-60 transition-all active:scale-95 flex items-center justify-center gap-2">
        
        {loading ?
        <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Đang đăng ký...</span>
          </> :

        <>
            <span className="material-symbols-outlined">business</span>
            <span>Đăng ký công ty</span>
          </>
        }
      </button>
    </form>);

}