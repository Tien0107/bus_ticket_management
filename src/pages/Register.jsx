import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CustomerRegisterForm from "./register/CustomerRegisterForm";
import DriverRegisterForm from "./register/DriverRegisterForm";
import CompanyRegisterForm from "./register/CompanyRegisterForm";
import OperatorRegisterForm from "./register/OperatorRegisterForm";
import SupportRegisterForm from "./register/SupportRegisterForm";

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
  {
    id: "support",
    icon: "headset_mic",
    title: "Nhân viên hỗ trợ",
    description: "Hỗ trợ khách hàng, giải đáp",
  },
];

const registerForms = {
  customer: <CustomerRegisterForm />,
  driver: <DriverRegisterForm />,
  company: <CompanyRegisterForm />,
  operator: <OperatorRegisterForm />,
  support: <SupportRegisterForm />,
};

function Register() {
  const [searchParams] = useSearchParams();
  const initialRegisterType = registerOptions.some((option) => option.id === searchParams.get("type"))
    ? searchParams.get("type")
    : "customer";
  const [registerType, setRegisterType] = useState(initialRegisterType);
  const selectedRegisterOption = registerOptions.find((option) => option.id === registerType) || registerOptions[0];

  const handleSelectType = (type) => {
    setRegisterType(type);
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
                onClick={() => handleSelectType(option.id)}
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
              <div className="flex flex-wrap gap-2 lg:hidden">
                {registerOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectType(option.id)}
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
            {registerForms[registerType]}

            <div className="relative my-6 flex items-center">
              <div className="flex-grow border-t border-outline-variant/20"></div>
              <span className="flex-shrink mx-4 text-on-surface-variant text-sm font-medium">hoặc</span>
              <div className="flex-grow border-t border-outline-variant/20"></div>
            </div>

            <div className="text-center">
              <p className="text-on-surface-variant text-sm">
                Đã có tài khoản?{" "}
                <Link to="/login" className="text-primary font-bold hover:underline">
                  Đăng nhập ngay
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
