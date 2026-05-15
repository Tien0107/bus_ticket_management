import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { companySignUp } from "../../api/company";
import { useToast } from "../../context/ToastContext";
import axiosClient from "../../api/axiosClient";

export default function CompanyRegisterForm() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [form, setForm] = useState({
    username: "",
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

  // Fetch companies from public API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoadingCompanies(true);
        const res = await axiosClient.get("/public/company", { params: { limit: 100 } });
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

  // Close dropdown when clicking outside
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
    if (!form.username.trim()) return "Tên đăng nhập bắt buộc";
    if (form.username.length < 3) return "Tên đăng nhập tối thiểu 3 ký tự";
    if (!form.fullName.trim()) return "Họ tên bắt buộc";
    if (!form.email.trim()) return "Email bắt buộc";
    if (!form.email.includes("@")) return "Email không hợp lệ";
    if (!form.phone.trim()) return "Số điện thoại bắt buộc";
    if (form.phone.length < 10) return "Số điện thoại tối thiểu 10 ký tự";
    if (!form.password) return "Mật khẩu bắt buộc";
    if (form.password.length < 8) return "Mật khẩu tối thiểu 8 ký tự";
    if (!form.companyId) return "Vui lòng chọn công ty";
    if (!Number.isFinite(Number(form.companyId))) return "Công ty không hợp lệ";
    if (!agreeTerms) return "Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.";
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
      username: form.username,
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
      await companySignUp(payload);
      addToast("Đăng ký công ty thành công", "success");
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
        <p className="text-on-surface-variant">Tham gia BusGo để quản lý xe buýt của bạn</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          <span className="material-symbols-outlined text-red-500">error</span>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <div>
        <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin tài khoản</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Tên đăng nhập *</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="company_admin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Họ tên *</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="Nguyễn Văn A"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin liên hệ</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Email *</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="company@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface mb-2">Số điện thoại *</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
              placeholder="0901234567"
              required
            />
          </div>
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

          <div ref={companyDropdownRef} className="relative">
            <label className="block text-sm font-bold text-on-surface mb-2">Chọn công ty *</label>
            <button
              type="button"
              onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
              className={`w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none text-left flex items-center justify-between gap-2 ${
                selectedCompanyName ? 'text-on-surface' : 'text-on-surface-variant/60'
              }`}
            >
              <span className="truncate">{selectedCompanyName || "-- Chọn công ty --"}</span>
              <span className="material-symbols-outlined text-on-surface-variant text-lg shrink-0">
                {showCompanyDropdown ? "expand_less" : "expand_more"}
              </span>
            </button>

            {showCompanyDropdown && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-outline-variant/20 overflow-hidden">
                {/* Search input */}
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

                {/* Company list */}
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

      <div className="flex items-start gap-4 py-2 px-1 relative">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container rounded-full"></div>
        <div className="pl-4 flex items-center">
          <input
            type="checkbox"
            id="terms-company"
            checked={agreeTerms}
            onChange={(event) => setAgreeTerms(event.target.checked)}
            className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
          />
          <label className="ml-3 text-sm text-on-surface-variant leading-tight" htmlFor="terms-company">
            Tôi đồng ý với{" "}
            <span className="text-primary font-semibold cursor-pointer hover:underline">
              Điều khoản sử dụng
            </span>{" "}
            và{" "}
            <span className="text-primary font-semibold cursor-pointer hover:underline">
              Chính sách bảo mật
            </span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white px-6 py-4 rounded-xl font-bold hover:bg-primary/80 disabled:opacity-60 transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>Đang đăng ký...</span>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined">business</span>
            <span>Đăng ký công ty</span>
          </>
        )}
      </button>
    </form>
  );
}
