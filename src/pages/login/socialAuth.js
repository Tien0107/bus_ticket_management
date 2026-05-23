export const GOOGLE_CLIENT_ID = "335430946794-8mkv3iqd0dvgq208ep9gf6t9hj07lsqc.apps.googleusercontent.com";
export const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || "1920728485259212";
export const FACEBOOK_GRAPH_VERSION = process.env.REACT_APP_FACEBOOK_GRAPH_VERSION || "v25.0";

export const isHttpsPage = () => window.location.protocol === "https:";

export const loadScript = (src, id) =>
  new Promise((resolve, reject) => {
    const existingScript = document.getElementById(id);

    if (existingScript) {
      if (existingScript.dataset.loaded === "true") {
        resolve(existingScript);
      } else {
        existingScript.addEventListener("load", () => resolve(existingScript), { once: true });
        existingScript.addEventListener("error", reject, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve(script);
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });

export const initGoogleButton = async ({ buttonElement, onCredential }) => {
  await loadScript("https://accounts.google.com/gsi/client?hl=vi", "google-identity-services");

  if (!buttonElement || !window.google?.accounts?.id) {
    return false;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: onCredential,
    ux_mode: "popup",
  });

  buttonElement.innerHTML = "";
  window.google.accounts.id.renderButton(buttonElement, {
    type: "icon",
    theme: "outline",
    size: "large",
    shape: "circle",
    locale: "vi",
  });

  return true;
};

export const loadFacebookSdk = () =>
  new Promise((resolve, reject) => {
    if (!FACEBOOK_APP_ID) {
      reject(new Error("Chưa cấu hình Facebook App ID."));
      return;
    }

    if (window.FB) {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: FACEBOOK_GRAPH_VERSION,
      });
      resolve(window.FB);
      return;
    }

    window.fbAsyncInit = () => {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: FACEBOOK_GRAPH_VERSION,
      });
      resolve(window.FB);
    };

    loadScript("https://connect.facebook.net/vi_VN/sdk.js", "facebook-jssdk").catch(reject);
  });
