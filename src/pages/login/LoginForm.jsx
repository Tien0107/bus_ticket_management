import { Link } from "react-router-dom";

const loginMethodOptions = [
  { id: "email", label: "Email", icon: "mail" },
  { id: "phone", label: "Số điện thoại", icon: "call" },
];

export default function LoginForm({
  loginMethod,
  onLoginMethodChange,
  identifier,
  onIdentifierChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  loading,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-5" aria-busy={loading}>
      <div>
        <div className="mb-3 grid grid-cols-2 rounded-xl bg-surface-container-low p-1">
          {loginMethodOptions.map((item) => {
            const active = loginMethod === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onLoginMethodChange(item.id)}
                disabled={loading}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-extrabold transition-all ${
                  active
                    ? "bg-white text-primary shadow-sm ring-1 ring-outline-variant/20"
                    : "text-on-surface-variant hover:text-on-surface"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </div>
        <label className="mb-2 block text-sm font-bold text-on-surface">
          {loginMethod === "email" ? "Email" : "Số điện thoại"}
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            {loginMethod === "email" ? "mail" : "call"}
          </span>
          <input
            className="w-full rounded-xl border border-outline-variant/40 bg-white py-3.5 pl-12 pr-4 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder={loginMethod === "email" ? "you@example.com" : "0901234567"}
            type={loginMethod === "email" ? "email" : "tel"}
            inputMode={loginMethod === "email" ? "email" : "tel"}
            autoComplete={loginMethod === "email" ? "email" : "tel"}
            value={identifier}
            onChange={(event) => onIdentifierChange(event.target.value)}
            disabled={loading}
            required
          />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-bold text-on-surface">Mật khẩu</label>
          <Link to="/forgot-password" className="text-sm font-bold text-primary hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            lock
          </span>
          <input
            className="w-full rounded-xl border border-outline-variant/40 bg-white py-3.5 pl-12 pr-12 text-sm font-medium outline-none transition-all placeholder:text-outline focus:border-primary focus:ring-4 focus:ring-primary/10"
            placeholder="Nhập mật khẩu"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={loading}
            required
          />
          <button
            type="button"
            onClick={onTogglePassword}
            disabled={loading}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-outline transition-colors hover:bg-surface-container-low hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3">
        <input
          type="checkbox"
          disabled={loading}
          className="h-4 w-4 rounded border-outline text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span className="text-sm font-medium text-on-surface-variant">Ghi nhớ đăng nhập</span>
      </label>

      <button
        type="submit"
        disabled={loading}
        aria-disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-base font-extrabold text-white shadow-[0_12px_24px_rgba(0,110,28,0.18)] transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Đang đăng nhập...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-[20px]">login</span>
            Đăng nhập
          </>
        )}
      </button>
    </form>
  );
}
