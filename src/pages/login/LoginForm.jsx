import { Link } from "react-router-dom";

export default function LoginForm({
  identifier,
  onIdentifierChange,
  password,
  onPasswordChange,
  showPassword,
  onTogglePassword,
  loading,
  onSubmit,
  rememberLogin = true,
  onRememberLoginChange,
  fieldErrors = {},
  formError = "",
}) {
  const hasIdentifierError = Boolean(fieldErrors.identifier);
  const hasPasswordError = Boolean(fieldErrors.password);
  const inputBaseClass =
    "w-full rounded-xl border bg-white py-3.5 text-sm font-medium outline-none transition-all placeholder:text-outline focus:ring-4 disabled:cursor-not-allowed disabled:bg-surface-container-low/50 disabled:text-on-surface-variant";
  const normalInputClass = "border-outline-variant/40 focus:border-primary focus:ring-primary/10";
  const errorInputClass = "border-red-300 bg-red-50/30 focus:border-red-500 focus:ring-red-500/10";
  const fieldErrorClass = "mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-500";

  return (
    <form onSubmit={onSubmit} className="space-y-5" aria-busy={loading} noValidate>
      <div>
        <label className="mb-2 block text-sm font-bold text-on-surface">Email hoặc số điện thoại</label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
            alternate_email
          </span>
          <input
            className={`${inputBaseClass} pl-12 pr-4 ${hasIdentifierError ? errorInputClass : normalInputClass}`}
            placeholder="Email hoặc số điện thoại"
            type="text"
            inputMode="text"
            autoComplete="username"
            autoCapitalize="none"
            name="identifier"
            value={identifier}
            onChange={(event) => onIdentifierChange(event.target.value)}
            disabled={loading}
            aria-invalid={hasIdentifierError}
            aria-describedby={hasIdentifierError ? "login-identifier-error" : undefined}
            required
          />
        </div>
        {hasIdentifierError && (
          <p id="login-identifier-error" className={fieldErrorClass}>
            <span className="material-symbols-outlined text-[16px]">info</span>
            {fieldErrors.identifier}
          </p>
        )}
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
            className={`${inputBaseClass} pl-12 pr-12 ${hasPasswordError ? errorInputClass : normalInputClass}`}
            placeholder="Nhập mật khẩu"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            disabled={loading}
            aria-invalid={hasPasswordError}
            aria-describedby={hasPasswordError ? "login-password-error" : undefined}
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
        {hasPasswordError && (
          <p id="login-password-error" className={fieldErrorClass}>
            <span className="material-symbols-outlined text-[16px]">info</span>
            {fieldErrors.password}
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-on-surface">
        <input
          type="checkbox"
          checked={rememberLogin}
          onChange={(event) => onRememberLoginChange?.(event.target.checked)}
          disabled={loading}
          className="h-4 w-4 cursor-pointer rounded border-outline-variant accent-primary disabled:cursor-not-allowed disabled:opacity-60"
        />
        <span>Ghi nhớ đăng nhập</span>
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

      {formError && (
        <p className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-red-600">
          <span className="material-symbols-outlined text-[16px]">info</span>
          {formError}
        </p>
      )}
    </form>
  );
}
