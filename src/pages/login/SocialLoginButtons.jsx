import { useCallback, useEffect, useRef, useState } from "react";
import { verifyAuthFacebookToken, verifyAuthGoogleToken } from "../../api/auth";
import { useToast } from "../../context/ToastContext";
import { FACEBOOK_APP_ID, initGoogleButton, isHttpsPage, loadFacebookSdk } from "./socialAuth";

const GoogleIcon = () => (
  <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" className="h-7 w-7">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303C33.652 32.657 29.223 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.284-7.946l-6.522 5.026C9.505 39.556 16.227 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

export default function SocialLoginButtons({ disabled = false, onLoginSuccess, setError }) {
  const { addToast } = useToast();
  const googleButtonRef = useRef(null);
  const [socialLoading, setSocialLoading] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleRenderKey, setGoogleRenderKey] = useState(0);

  const handleGoogleCredential = useCallback(
    async (response) => {
      if (!response?.credential) {
        setError("Không nhận được Google ID token.");
        addToast("Đăng nhập Google thất bại", "error");
        return;
      }

      setError("");
      setSocialLoading("google");

      try {
        const res = await verifyAuthGoogleToken({ idToken: response.credential });
        await onLoginSuccess(res.data, "Đăng nhập Google thành công");
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || "Đăng nhập Google thất bại";
        setError(errorMsg);
        addToast("Đăng nhập Google thất bại", "error");
      } finally {
        setSocialLoading("");
      }
    },
    [addToast, onLoginSuccess, setError]
  );

  useEffect(() => {
    let mounted = true;

    const renderGoogleButton = async () => {
      try {
        setGoogleReady(false);
        const ready = await initGoogleButton({
          buttonElement: googleButtonRef.current,
          onCredential: handleGoogleCredential,
        });

        if (mounted) setGoogleReady(ready);
      } catch {
        if (mounted) setGoogleReady(false);
      }
    };

    renderGoogleButton();

    return () => {
      mounted = false;
    };
  }, [handleGoogleCredential, googleRenderKey]);

  const handleGoogleButtonFallback = useCallback(() => {
    if (disabled || socialLoading) return;
    setGoogleRenderKey((key) => key + 1);
    addToast("Google Login đang tải, thử lại sau vài giây", "info");
  }, [addToast, disabled, socialLoading]);

  const handleFacebookLogin = async () => {
    if (disabled || socialLoading) return;

    setError("");

    if (!isHttpsPage()) {
      const errorMsg = "Facebook Login cần chạy trên HTTPS. Hãy mở trang bằng https://localhost:3000/login.";
      setError(errorMsg);
      addToast("Facebook Login cần HTTPS", "error");
      return;
    }

    setSocialLoading("facebook");

    try {
      const FB = await loadFacebookSdk();
      const loginResponse = await new Promise((resolve) => {
        FB.login(resolve, { scope: "public_profile,email", return_scopes: true });
      });

      if (loginResponse.status !== "connected" || !loginResponse.authResponse?.accessToken) {
        throw new Error(
          loginResponse.status === "unknown"
            ? "Facebook chưa xác thực được domain hiện tại. Kiểm tra App Domains, Allowed Domains for JavaScript SDK và Valid OAuth Redirect URIs trên Meta."
            : "Bạn đã hủy hoặc chưa cấp quyền đăng nhập Facebook."
        );
      }

      const { accessToken, signedRequest } = loginResponse.authResponse;
      const res = await verifyAuthFacebookToken({
        accessToken,
        idToken: loginResponse.authResponse.idToken || signedRequest || "",
      });

      await onLoginSuccess(res.data, "Đăng nhập Facebook thành công");
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Đăng nhập Facebook thất bại";
      setError(errorMsg);
      addToast("Đăng nhập Facebook thất bại", "error");
    } finally {
      setSocialLoading("");
    }
  };

  return (
    <>
      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-outline-variant/40" />
        <span className="text-xs font-bold uppercase tracking-wide text-outline">hoặc tiếp tục với</span>
        <div className="h-px flex-1 bg-outline-variant/40" />
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="relative h-14 w-14 overflow-hidden rounded-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-outline-variant/40 bg-white transition-colors hover:bg-surface-container-low">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant/40 bg-white">
              <GoogleIcon />
            </span>
          </div>
          {!googleReady && (
            <button
              type="button"
              onClick={handleGoogleButtonFallback}
              disabled={disabled || Boolean(socialLoading)}
              className="absolute inset-0 z-20 rounded-xl"
              aria-label="Đăng nhập bằng Google"
              title="Google"
            />
          )}
          <div
            ref={googleButtonRef}
            className={`auth-google-render absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-xl transition-opacity ${
              googleReady && !disabled && !socialLoading ? "opacity-[0.01]" : "pointer-events-none opacity-0"
            }`}
          />
          {socialLoading === "google" && (
            <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center rounded-xl bg-white/80">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleFacebookLogin}
          disabled={disabled || socialLoading === "facebook"}
          className="flex h-14 w-14 items-center justify-center rounded-xl border border-outline-variant/40 bg-white text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Đăng nhập bằng Facebook"
          title="Facebook"
        >
          {socialLoading === "facebook" ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-xl font-extrabold text-white">
              f
            </span>
          )}
        </button>
      </div>

      {!FACEBOOK_APP_ID && (
        <p className="mt-3 text-xs text-on-surface-variant">
          Facebook cần cấu hình <span className="font-semibold">REACT_APP_FACEBOOK_APP_ID</span> để hoạt động.
        </p>
      )}
    </>
  );
}
