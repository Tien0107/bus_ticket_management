import { useState } from "react";
import { customerSignUp } from "../api/auth";
import { driverSignUp } from "../api/driver";
import { companySignUp } from "../api/company";
import { operatorSignUp } from "../api/operator";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";

const registerOptions = [
  {
    id: "customer",
    icon: "person",
    title: "Khách hàng",
    description: "Đặt vé và quản lý hành trình",
  },
  {
    id: "driver",
    icon: "directions_bus",
    title: "Tài xế",
    description: "Theo dõi chuyến và check-in",
  },
  {
    id: "company",
    icon: "business",
    title: "Công ty",
    description: "Quản lý đội xe và nhân sự",
  },
  {
    id: "operator",
    icon: "support_agent",
    title: "Điều hành viên",
    description: "Quản lý tuyến, trạm và lịch",
  },
];

function Register() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [registerType, setRegisterType] = useState("customer"); // customer, driver, company, operator
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const selectedRegisterOption = registerOptions.find((option) => option.id === registerType) || registerOptions[0];

  const [customerForm, setCustomerForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [driverForm, setDriverForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    licenseNumber: "",
    vehicleNumber: "",
    vehicleType: "bus",
    companyName: "",
  });

  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
    businessRegistration: "",
    address: "",
    city: "",
    taxCode: "",
  });

  const [operatorForm, setOperatorForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleCustomerChange = (e) => {
    setCustomerForm({ ...customerForm, [e.target.name]: e.target.value });
  };

  const handleDriverChange = (e) => {
    setDriverForm({ ...driverForm, [e.target.name]: e.target.value });
  };

  const handleCompanyChange = (e) => {
    setCompanyForm({ ...companyForm, [e.target.name]: e.target.value });
  };

  const handleOperatorChange = (e) => {
    setOperatorForm({ ...operatorForm, [e.target.name]: e.target.value });
  };

  // CUSTOMER SUBMIT
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }
    if (customerForm.password !== customerForm.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])[^\s]+$/;
    if (!passwordRegex.test(customerForm.password)) {
      setError("Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_), không có dấu cách.");
      return;
    }
    if (customerForm.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);

    const payload = {
      username: customerForm.username,
      fullName: customerForm.fullName,
      contactInfo: {
        email: customerForm.email,
        phone: customerForm.phone,
      },
      password: customerForm.password,
    };

    try {
      await customerSignUp(payload);
      addToast("Đăng ký khách hàng thành công", "success");
      
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      const data = err.response?.data;
      let errorMsg = "Đăng ký thất bại";
      
      if (data?.issues && Array.isArray(data.issues)) {
        errorMsg = data.issues.map((i) => i.reason || i.field).join(". ");
        setError(errorMsg);
      } else {
        errorMsg = data?.message || "Đăng ký thất bại";
        setError(errorMsg);
      }
      
      addToast("Đăng ký thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  // DRIVER SUBMIT
  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }
    if (driverForm.password !== driverForm.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])[^\s]+$/;
    if (!passwordRegex.test(driverForm.password)) {
      setError("Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_), không có dấu cách.");
      return;
    }
    if (driverForm.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (driverForm.phone.length < 10) {
      setError("Số điện thoại phải có ít nhất 10 ký tự.");
      return;
    }

    setLoading(true);

    const payload = {
      username: driverForm.username,
      fullName: driverForm.fullName,
      password: driverForm.password,
      licenseNumber: driverForm.licenseNumber,
      vehicleNumber: driverForm.vehicleNumber,
      vehicleType: driverForm.vehicleType,
      companyName: driverForm.companyName,
      companyId: 1,
      contactInfo: {
        email: driverForm.email,
        phone: driverForm.phone,
      },
    };

    try {
      await driverSignUp(payload);
      addToast("Đăng ký tài xế thành công", "success");
      
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      const data = err.response?.data;
      let errorMsg = "Đăng ký thất bại";
      
      if (data?.issues && Array.isArray(data.issues)) {
        errorMsg = data.issues.map((i) => i.reason || i.field).join(". ");
        setError(errorMsg);
      } else {
        errorMsg = data?.message || "Đăng ký thất bại";
        setError(errorMsg);
      }
      
      addToast("Đăng ký thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  // COMPANY SUBMIT
  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation - chỉ những field cần thiết
    const newErrors = {};
    if (!companyForm.companyName.trim()) newErrors.companyName = "Tên công ty bắt buộc";
    if (!companyForm.email.trim()) newErrors.email = "Email bắt buộc";
    if (!companyForm.phone.trim()) newErrors.phone = "Số điện thoại bắt buộc";
    if (!companyForm.username.trim()) newErrors.username = "Tên đăng nhập bắt buộc";
    if (companyForm.username.length < 3) newErrors.username = "Tên đăng nhập tối thiểu 3 ký tự";
    if (!companyForm.password) newErrors.password = "Mật khẩu bắt buộc";
    if (companyForm.password.length < 6) newErrors.password = "Mật khẩu tối thiểu 6 ký tự";
    if (companyForm.password !== companyForm.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu không khớp";
    }

    if (Object.keys(newErrors).length > 0) {
      setError(Object.values(newErrors)[0]);
      return;
    }

    if (!agreeTerms) {
      setError("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }

    setLoading(true);

    // Map payload đúng theo API contract
    const payload = {
      username: companyForm.username,
      fullName: companyForm.companyName,
      contactInfo: {
        email: companyForm.email,
        phone: companyForm.phone,
      },
      password: companyForm.password,
      companyId: 1,
    };

    console.log("Company signup payload:", payload);

    try {
      await companySignUp(payload);
      addToast("Đăng ký công ty thành công", "success");
      
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      console.error("Signup error:", err);
      const errorMsg = err.response?.data?.message || "Đăng ký thất bại";
      setError(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  // OPERATOR SUBMIT
  const handleOperatorSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!agreeTerms) {
      setError("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      return;
    }
    if (operatorForm.password !== operatorForm.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])[^\s]+$/;
    if (!passwordRegex.test(operatorForm.password)) {
      setError("Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_), không có dấu cách.");
      return;
    }
    if (operatorForm.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (operatorForm.phone.length < 10) {
      setError("Số điện thoại phải có ít nhất 10 ký tự.");
      return;
    }

    setLoading(true);

    const payload = {
      username: operatorForm.username,
      fullName: operatorForm.fullName,
      password: operatorForm.password,
      contactInfo: {
        email: operatorForm.email,
        phone: operatorForm.phone,
      },
      companyId: 1,
      role: "operator",
      staffProfileRole: "dispatcher",
    };

    try {
      await operatorSignUp(payload);
      addToast("Đăng ký nhân viên điều hành thành công", "success");
      
      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      const data = err.response?.data;
      let errorMsg = "Đăng ký thất bại";
      
      if (data?.issues && Array.isArray(data.issues)) {
        errorMsg = data.issues.map((i) => i.reason || i.field).join(". ");
        setError(errorMsg);
      } else {
        errorMsg = data?.message || "Đăng ký thất bại";
        setError(errorMsg);
      }
      
      addToast("Đăng ký thất bại", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-on-surface font-body">
      <header className="border-b border-outline-variant/30 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-3 text-xl font-extrabold tracking-tight text-on-surface">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
              <span className="material-symbols-outlined text-[22px]">directions_bus</span>
            </span>
            BusGo
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden rounded-lg px-4 py-2 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-on-surface sm:inline-flex"
            >
              Trang chủ
            </Link>
            <Link
              to="/login"
              className="rounded-lg border border-outline-variant/50 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/5"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[380px_1fr] lg:px-8 lg:py-10">
        <aside className="hidden self-start rounded-2xl border border-outline-variant/30 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] lg:block">
          <div className="rounded-xl bg-primary p-5 text-white">
            <span className="material-symbols-outlined text-[34px]">route</span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight">
              Tạo tài khoản BusGo
            </h1>
            <p className="mt-3 text-sm leading-6 text-white/85">
              Chọn đúng vai trò để hệ thống mở các công cụ phù hợp cho hành trình, vận hành và quản lý.
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {registerOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setRegisterType(option.id);
                  setError("");
                  setAgreeTerms(false);
                }}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  registerType === option.id
                    ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                    : "border-outline-variant/30 hover:border-primary/40 hover:bg-surface-container-low"
                }`}
              >
                <span className={`material-symbols-outlined mt-0.5 text-[22px] ${
                  registerType === option.id ? "text-primary" : "text-outline"
                }`}>
                  {option.icon}
                </span>
                <span>
                  <span className="block font-bold text-on-surface">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-on-surface-variant">{option.description}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-2xl border border-outline-variant/30 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="border-b border-outline-variant/20 p-6 lg:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
              <span className="material-symbols-outlined text-[17px]">{selectedRegisterOption.icon}</span>
              {selectedRegisterOption.title}
            </span>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-on-surface lg:text-4xl">
                  Đăng ký tài khoản
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-on-surface-variant">
                  Điền thông tin bên dưới để bắt đầu sử dụng BusGo với vai trò {selectedRegisterOption.title.toLowerCase()}.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 lg:hidden">
                {registerOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setRegisterType(option.id);
                      setError("");
                      setAgreeTerms(false);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                      registerType === option.id
                        ? "bg-primary text-white"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                    {option.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="auth-register-form p-6 lg:p-8">

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl mb-6">
                <span className="material-symbols-outlined text-red-500">error</span>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* CUSTOMER FORM */}
            {registerType === "customer" && (
              <form onSubmit={handleCustomerSubmit} className="space-y-5">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-on-surface mb-2">Đăng ký Khách hàng</h3>
                  <p className="text-on-surface-variant">Tạo tài khoản để đặt vé dễ dàng hơn</p>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-on-surface-variant ml-1">
                    Họ và tên
                  </label>
                  <input
                    name="fullName"
                    className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                    placeholder="Nguyễn Văn A"
                    type="text"
                    value={customerForm.fullName}
                    onChange={handleCustomerChange}
                    required
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-on-surface-variant ml-1">
                    Tên đăng nhập
                  </label>
                  <input
                    name="username"
                    className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                    placeholder="nguyenvana"
                    type="text"
                    value={customerForm.username}
                    onChange={handleCustomerChange}
                    required
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Email
                    </label>
                    <input
                      name="email"
                      className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="example@email.com"
                      type="email"
                      value={customerForm.email}
                      onChange={handleCustomerChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Số điện thoại
                    </label>
                    <input
                      name="phone"
                      className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="09xx xxx xxx"
                      type="tel"
                      value={customerForm.phone}
                      onChange={handleCustomerChange}
                      required
                    />
                  </div>
                </div>

                {/* Password Info */}
                <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-primary mt-0.5">info</span>
                  Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_)
                </p>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        className="w-full bg-white border-0 rounded-xl p-4 pr-12 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        value={customerForm.password}
                        onChange={handleCustomerChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Xác nhận mật khẩu
                    </label>
                    <input
                      name="confirmPassword"
                      className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={customerForm.confirmPassword}
                      onChange={handleCustomerChange}
                      required
                    />
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-4 py-2 px-1 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container rounded-full"></div>
                  <div className="pl-4 flex items-center">
                    <input
                      type="checkbox"
                      id="terms-customer"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <label className="ml-3 text-sm text-on-surface-variant leading-tight" htmlFor="terms-customer">
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

                {/* Submit Button */}
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
                    <span>Đăng ký khách hàng</span>
                  )}
                </button>
              </form>
            )}

            {/* DRIVER FORM */}
            {registerType === "driver" && (
              <form onSubmit={handleDriverSubmit} className="space-y-5">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-on-surface mb-2">Đăng ký Tài xế</h3>
                  <p className="text-on-surface-variant">Tham gia mạng lưới tài xế chuyên nghiệp của BusGo</p>
                </div>

                {/* Personal Info */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin cá nhân</h4>
                  
                  <div className="space-y-4">
                    {/* Full Name & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-on-surface-variant ml-1">
                          Họ và tên
                        </label>
                        <input
                          name="fullName"
                          className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                          placeholder="Nguyễn Văn A"
                          type="text"
                          value={driverForm.fullName}
                          onChange={handleDriverChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-on-surface-variant ml-1">
                          Số điện thoại
                        </label>
                        <input
                          name="phone"
                          className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                          placeholder="09xx xxx xxx"
                          type="tel"
                          value={driverForm.phone}
                          onChange={handleDriverChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Username & Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-on-surface-variant ml-1">
                          Tên đăng nhập
                        </label>
                        <input
                          name="username"
                          className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                          placeholder="taixe_nguyen"
                          type="text"
                          value={driverForm.username}
                          onChange={handleDriverChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-on-surface-variant ml-1">
                          Email
                        </label>
                        <input
                          name="email"
                          className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                          placeholder="example@email.com"
                          type="email"
                          value={driverForm.email}
                          onChange={handleDriverChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* License Info */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin bằng cấp</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Số giấy phép lái xe
                      </label>
                      <input
                        name="licenseNumber"
                        className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                        placeholder="123456789"
                        type="text"
                        value={driverForm.licenseNumber}
                        onChange={handleDriverChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Info */}
                <div className="border-t pt-4">
                  <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin xe</h4>
                  
                  <div className="space-y-4">
                    {/* Vehicle Number & Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-on-surface-variant ml-1">
                          Biển số xe
                        </label>
                        <input
                          name="vehicleNumber"
                          className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                          placeholder="29A-12345"
                          type="text"
                          value={driverForm.vehicleNumber}
                          onChange={handleDriverChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-on-surface-variant ml-1">
                          Loại xe
                        </label>
                        <select
                          name="vehicleType"
                          className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all"
                          value={driverForm.vehicleType}
                          onChange={handleDriverChange}
                        >
                          <option value="bus">Xe bus</option>
                          <option value="minibus">Minibus</option>
                          <option value="coach">Xe khách</option>
                        </select>
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Tên công ty (nếu có)
                      </label>
                      <input
                        name="companyName"
                        className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                        placeholder="Công ty vận tải ABC"
                        type="text"
                        value={driverForm.companyName}
                        onChange={handleDriverChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Password Info */}
                <div className="border-t pt-4">
                  <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 flex items-start gap-2 mb-4">
                    <span className="material-symbols-outlined text-sm text-primary mt-0.5">info</span>
                    Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_)
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Mật khẩu
                      </label>
                      <div className="relative">
                        <input
                          name="password"
                          className="w-full bg-white border-0 rounded-xl p-4 pr-12 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          value={driverForm.password}
                          onChange={handleDriverChange}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-on-surface-variant ml-1">
                        Xác nhận mật khẩu
                      </label>
                      <input
                        name="confirmPassword"
                        className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        value={driverForm.confirmPassword}
                        onChange={handleDriverChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-4 py-2 px-1 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container rounded-full"></div>
                  <div className="pl-4 flex items-center">
                    <input
                      type="checkbox"
                      id="terms-driver"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <label className="ml-3 text-sm text-on-surface-variant leading-tight" htmlFor="terms-driver">
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

                {/* Submit Button */}
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
            )}

            {/* COMPANY FORM */}
            {registerType === "company" && (
              <form onSubmit={handleCompanySubmit} className="space-y-6">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-on-surface mb-2">Đăng ký Công ty</h3>
                  <p className="text-on-surface-variant">Tham gia BusGo để quản lý xe buýt của bạn</p>
                </div>

                {/* Company Info Section */}
                <div>
                  <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin công ty</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Tên công ty *</label>
                      <input
                        type="text"
                        name="companyName"
                        value={companyForm.companyName}
                        onChange={handleCompanyChange}
                        className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Công ty vận tải ABC"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-on-surface mb-2">Số ĐKKD *</label>
                        <input
                          type="text"
                          name="businessRegistration"
                          value={companyForm.businessRegistration}
                          onChange={handleCompanyChange}
                          className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                          placeholder="0101234567890"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-on-surface mb-2">Mã số thuế</label>
                        <input
                          type="text"
                          name="taxCode"
                          value={companyForm.taxCode}
                          onChange={handleCompanyChange}
                          className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                          placeholder="012345678"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Địa chỉ *</label>
                      <input
                        type="text"
                        name="address"
                        value={companyForm.address}
                        onChange={handleCompanyChange}
                        className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        placeholder="123 Đường Nguyễn Huệ"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Thành phố *</label>
                      <input
                        type="text"
                        name="city"
                        value={companyForm.city}
                        onChange={handleCompanyChange}
                        className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        placeholder="TP. Hồ Chí Minh"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Info Section */}
                <div>
                  <h4 className="text-lg font-bold text-on-surface mb-4">Thông tin liên hệ</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={companyForm.email}
                        onChange={handleCompanyChange}
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
                        value={companyForm.phone}
                        onChange={handleCompanyChange}
                        className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        placeholder="0901234567"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Account Section */}
                <div>
                  <h4 className="text-lg font-bold text-on-surface mb-4">Tài khoản đăng nhập</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-on-surface mb-2">Tên đăng nhập *</label>
                      <input
                        type="text"
                        name="username"
                        value={companyForm.username}
                        onChange={handleCompanyChange}
                        className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                        placeholder="company_admin"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-on-surface mb-2">Mật khẩu *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={companyForm.password}
                            onChange={handleCompanyChange}
                            className="w-full px-4 py-3 pr-12 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                            placeholder="••••••"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                          >
                            <span className="material-symbols-outlined text-xl">
                              {showPassword ? "visibility_off" : "visibility"}
                            </span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-on-surface mb-2">Xác nhận mật khẩu *</label>
                        <input
                          type={showPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={companyForm.confirmPassword}
                          onChange={handleCompanyChange}
                          className="w-full px-4 py-3 bg-surface-container-low border-0 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                          placeholder="••••••"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-4 py-2 px-1 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container rounded-full"></div>
                  <div className="pl-4 flex items-center">
                    <input
                      type="checkbox"
                      id="terms-company"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
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

                {/* Submit Button */}
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
            )}

            {/* OPERATOR FORM */}
            {registerType === "operator" && (
              <form onSubmit={handleOperatorSubmit} className="space-y-5">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-on-surface mb-2">Đăng ký Nhân viên Điều hành</h3>
                  <p className="text-on-surface-variant">Tham gia BusGo để quản lý tuyến đường, trạm, và lịch biểu</p>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-on-surface-variant ml-1">
                    Họ và tên
                  </label>
                  <input
                    name="fullName"
                    className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                    placeholder="Nguyễn Văn A"
                    type="text"
                    value={operatorForm.fullName}
                    onChange={handleOperatorChange}
                    required
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-on-surface-variant ml-1">
                    Tên đăng nhập
                  </label>
                  <input
                    name="username"
                    className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                    placeholder="nhanvien_dieuhanhh"
                    type="text"
                    value={operatorForm.username}
                    onChange={handleOperatorChange}
                    required
                  />
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Email
                    </label>
                    <input
                      name="email"
                      className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="example@email.com"
                      type="email"
                      value={operatorForm.email}
                      onChange={handleOperatorChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Số điện thoại
                    </label>
                    <input
                      name="phone"
                      className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="09xx xxx xxx"
                      type="tel"
                      value={operatorForm.phone}
                      onChange={handleOperatorChange}
                      required
                    />
                  </div>
                </div>

                {/* Password Info */}
                <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm text-primary mt-0.5">info</span>
                  Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt (#@$%&!*?^_)
                </p>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Mật khẩu
                    </label>
                    <div className="relative">
                      <input
                        name="password"
                        className="w-full bg-white border-0 rounded-xl p-4 pr-12 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        value={operatorForm.password}
                        onChange={handleOperatorChange}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-on-surface-variant ml-1">
                      Xác nhận mật khẩu
                    </label>
                    <input
                      name="confirmPassword"
                      className="w-full bg-white border-0 rounded-xl p-4 text-on-surface ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all placeholder:text-gray-400"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={operatorForm.confirmPassword}
                      onChange={handleOperatorChange}
                      required
                    />
                  </div>
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-4 py-2 px-1 relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-container rounded-full"></div>
                  <div className="pl-4 flex items-center">
                    <input
                      type="checkbox"
                      id="terms-operator"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <label className="ml-3 text-sm text-on-surface-variant leading-tight" htmlFor="terms-operator">
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

                {/* Submit Button */}
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
                      <span className="material-symbols-outlined">person_check</span>
                      <span>Đăng ký điều hành viên</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-8 flex items-center">
              <div className="flex-grow border-t border-outline-variant/20"></div>
              <span className="flex-shrink mx-4 text-on-surface-variant text-sm font-medium">hoặc</span>
              <div className="flex-grow border-t border-outline-variant/20"></div>
            </div>

            {/* Login Redirect */}
            <div className="text-center">
              <p className="text-on-surface-variant">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Register;
