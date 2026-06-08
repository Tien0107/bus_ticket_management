// Vietnam Provinces - latest from https://provinces.open-api.vn/api/v2/
// Post 2025 administrative merger (34 units). Using raw official names from the API.

const API_URL = "https://provinces.open-api.vn/api/v2/";

let cachedProvinces = null;
let inFlightPromise = null;

// Official list exactly as returned by the API (in the order the API provides them).
// This is the "danh sách tỉnh tp vn theo api mới nhất".
export const VIETNAM_PROVINCES = [
  "Thành phố Hà Nội",
  "Tỉnh Cao Bằng",
  "Tỉnh Tuyên Quang",
  "Tỉnh Điện Biên",
  "Tỉnh Lai Châu",
  "Tỉnh Sơn La",
  "Tỉnh Lào Cai",
  "Tỉnh Thái Nguyên",
  "Tỉnh Lạng Sơn",
  "Tỉnh Quảng Ninh",
  "Tỉnh Bắc Ninh",
  "Tỉnh Phú Thọ",
  "Thành phố Hải Phòng",
  "Tỉnh Hưng Yên",
  "Tỉnh Ninh Bình",
  "Tỉnh Thanh Hóa",
  "Tỉnh Nghệ An",
  "Tỉnh Hà Tĩnh",
  "Tỉnh Quảng Trị",
  "Thành phố Huế",
  "Thành phố Đà Nẵng",
  "Tỉnh Quảng Ngãi",
  "Tỉnh Gia Lai",
  "Tỉnh Khánh Hòa",
  "Tỉnh Đắk Lắk",
  "Tỉnh Lâm Đồng",
  "Tỉnh Đồng Nai",
  "Thành phố Hồ Chí Minh",
  "Tỉnh Tây Ninh",
  "Tỉnh Đồng Tháp",
  "Tỉnh Vĩnh Long",
  "Tỉnh An Giang",
  "Thành phố Cần Thơ",
  "Tỉnh Cà Mau",
];

function toDisplayName(rawName) {
  // For the new API we prefer the raw official names.
  // Keep a minimal cleanup just in case the response has extra spaces.
  return String(rawName || "").trim();
}

export async function getVietnamProvinces() {
  // Always ensure we have a good list immediately (seed from the official list)
  if (!cachedProvinces || cachedProvinces.length === 0) {
    cachedProvinces = [...VIETNAM_PROVINCES];
  }

  // Kick off a background refresh from the real API (https://provinces.open-api.vn/api/v2/)
  if (!inFlightPromise) {
    inFlightPromise = fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load provinces");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Take names exactly as provided by the API (official current administrative names)
          const names = data
            .map((p) => toDisplayName(p.name))
            .filter(Boolean);
          if (names.length > 0) {
            cachedProvinces = names;
          }
        }
        return cachedProvinces;
      })
      .catch((err) => {
        console.warn("Could not fetch latest provinces from API, using current list.", err);
        return cachedProvinces;
      })
      .finally(() => {
        inFlightPromise = null;
      });
  }

  // If there's an in-flight request, wait for it so callers get the freshest possible data
  if (inFlightPromise) {
    try {
      await inFlightPromise;
    } catch (e) {
      // ignore, we already have seeded list
    }
  }

  return cachedProvinces;
}

export function clearProvincesCache() {
  cachedProvinces = null;
  inFlightPromise = null;
}
