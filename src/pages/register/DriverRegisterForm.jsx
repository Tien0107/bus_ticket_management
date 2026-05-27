import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { driverSignUp } from "../../api/driver";
import { useToast } from "../../context/ToastContext";
import axiosClient from "../../api/axiosClient";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])[^\s]+$/;

export default function DriverRegisterForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    companyId: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Company dropdown state
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

  const validate = () => {
    if (!agreeTerms) return "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.";
    if (!passwordRegex.test(form.password)) {
      return "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_), không có dấu cách.";
    }
    if (form.password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
    if (form.phone.length < 10) return "Số điện thoại phải có ít nhất 10 ký tự.";
    if (!form.companyId) return "Vui lòng chọn công ty.";
    if (!Number.isFinite(Number(form.companyId))) return "Công ty không hợp lệ.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      fullName: form.fullName,
      contactInfo: {
        email: form.email,
        phone: form.phone,
      },
      password: form.password,
      companyId: Number(form.companyId),
    };

    try {
      setLoading(true);
      await driverSignUp(payload);
      addToast("Đăng ký tài xế thành công", "success");
      setTimeout(() => navigate("/login"), 500);
    } catch (err) {
      const data = err.response?.data;
      const errorMessage = Array.isArray(data?.issues)
        ? data.issues.map((item) => item.reason || item.field).join(". ")
        : data?.message || "Đăng ký thất bại";
      setError(errorMessage);
      addToast("Đăng ký thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-on-surface mb-2">Đăng ký Tài xế</h3>
        <p className="text-on-surface-variant">Tham gia mạng lưới tài xế chuyên nghiệp của BusGo</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div className="border-t pt-4">
        <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin cá nhân</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant ml-1">Họ và tên</label>
              <input
                name="fullName"
                className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                placeholder="Nguyễn Văn A"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant ml-1">Số điện thoại</label>
              <input
                name="phone"
                className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                placeholder="09xx xxx xxx"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface-variant ml-1">Email</label>
              <input
                name="email"
                className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                placeholder="example@email.com"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-lg font-bold text-on-surface mb-4">Bảo mật và công ty</h4>
        <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 flex items-start gap-2 mb-4">
          <span className="material-symbols-outlined text-sm text-primary mt-0.5">info</span>
          Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-on-surface-variant ml-1">Mật khẩu</label>
            <div className="relative">
              <input
                name="password"
                className="w-full bg-white border-0 rounded-xl p-4 pr-12 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                placeholder="••••••••"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
          </div>
          <div className="space-y-2" ref={companyDropdownRef}>
            <label className="block text-sm font-medium text-on-surface-variant ml-1">Chọn công ty</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                className={`w-full bg-white border-0 rounded-xl p-4 text-left ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all flex items-center justify-between gap-2 ${
                  selectedCompanyName ? 'text-on-surface' : 'text-gray-400'
                }`}
              >
                <span className="truncate">{selectedCompanyName || "-- Chọn công ty --"}</span>
                <span className="material-symbols-outlined text-on-surface-variant text-lg shrink-0">
                  {showCompanyDropdown ? "expand_less" : "expand_more"}
                </span>
              </button>

              {showCompanyDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-outline-variant/20 overflow-hidden">
                  <div className="p-3 border-b border-outline-variant/10">
                    <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-on-surface-variant text-lg">search</span>
                      <input
                        type="text"
                        value={companySearch}
                        onChange={(e) => setCompanySearch(e.target.value)}
                        placeholder="Tìm kiếm công ty..."
                        className="w-full bg-transparent border-0 outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {loadingCompanies ? (
                      <div className="py-6 text-center text-on-surface-variant text-sm">
                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
                        Đang tải...
                      </div>
                    ) : filteredCompanies.length === 0 ? (
                      <div className="py-6 text-center text-on-surface-variant text-sm">
                        <span className="material-symbols-outlined text-2xl opacity-40 block mb-1">search_off</span>
                        Không tìm thấy công ty nào
                      </div>
                    ) : (
                      filteredCompanies.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => handleSelectCompany(company)}
                          className={`w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors flex items-center gap-3 border-b border-outline-variant/5 last:border-0 ${
                            form.companyId === String(company.id) ? 'bg-primary/10' : ''
                          }`}
                        >
                          {company.logoUrl ? (
                            <img src={company.logoUrl} alt={company.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-primary text-lg">business</span>
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-on-surface truncate">{company.name}</p>
                            {company.hotline && (
                              <p className="text-xs text-on-surface-variant truncate">Hotline: {company.hotline}</p>
                            )}
                          </div>
                          {form.companyId === String(company.id) && (
                            <span className="material-symbols-outlined text-primary text-lg shrink-0">check_circle</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-primary to-primary-container text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Đang đăng ký...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">directions_car</span>
            <span>Đăng ký tài xế</span>
          </>
        )}
      </button>
    </form>
  );
}
