import React, { useState, useRef, useEffect, useMemo } from 'react';

const FALLBACK_PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận",
  "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội",
  "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn",
  "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh",
  "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh",
  "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

const PROVINCE_API_URL = "https://provinces.open-api.vn/api/p/";
const viCollator = new Intl.Collator("vi", { sensitivity: "base" });
let cachedProvinces = null;
let provincesPromise = null;

const normalizeText = (value) =>
String(value || "").
normalize("NFD").
replace(/[\u0300-\u036f]/g, "").
replace(/đ/g, "d").
replace(/Đ/g, "D").
toLowerCase().
trim();

const formatProvinceName = (value) =>
String(value || "").
replace(/^Tỉnh\s+/i, "").
replace(/^Thành phố\s+/i, "TP. ").
trim();

const sortProvinces = (provinces) =>
[...new Set(provinces.filter(Boolean))].sort((a, b) => viCollator.compare(a, b));

const loadVietnamProvinces = async () => {
  if (cachedProvinces) return cachedProvinces;

  if (!provincesPromise) {
    provincesPromise = fetch(PROVINCE_API_URL).
    then((response) => {
      if (!response.ok) throw new Error("Không tải được danh sách tỉnh/thành");
      return response.json();
    }).
    then((data) => {
      const provinces = Array.isArray(data) ? data.map((item) => formatProvinceName(item?.name)).filter(Boolean) : [];
      cachedProvinces = sortProvinces(provinces.length > 0 ? provinces : FALLBACK_PROVINCES);
      return cachedProvinces;
    }).
    catch(() => {
      cachedProvinces = sortProvinces(FALLBACK_PROVINCES);
      return cachedProvinces;
    });
  }

  return provincesPromise;
};

const LocationDropdown = ({ value, onChange, placeholder, icon, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const [provinces, setProvinces] = useState(cachedProvinces || FALLBACK_PROVINCES);
  const [loading, setLoading] = useState(!cachedProvinces);
  const wrapperRef = useRef(null);
  const skipValueSyncRef = useRef(false);

  useEffect(() => {
    if (skipValueSyncRef.current) {
      skipValueSyncRef.current = false;
      return;
    }
    setSearch(value || "");
  }, [value]);

  useEffect(() => {
    let active = true;

    loadVietnamProvinces().then((list) => {
      if (!active) return;
      setProvinces(list);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch(value || "");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const filtered = useMemo(() => {
    const query = normalizeText(search);
    if (!query) return provinces;
    return provinces.filter((province) => normalizeText(province).includes(query));
  }, [provinces, search]);

  const selectProvince = (province) => {
    onChange(province);
    setSearch(province);
    setIsOpen(false);
  };

  const handleSearchChange = (event) => {
    const nextSearch = event.target.value;
    setSearch(nextSearch);
    setIsOpen(true);

    const exactProvince = provinces.find((province) => normalizeText(province) === normalizeText(nextSearch));
    if (exactProvince) {
      onChange(exactProvince);
    } else if (value) {
      skipValueSyncRef.current = true;
      onChange("");
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className={`flex items-center bg-surface-container-low px-4 py-3 rounded-xl focus-within:ring-2 ring-primary/20 transition-all cursor-pointer ${className}`}
        onClick={() => setIsOpen(true)}
      >
        {icon && (
          <span className="material-symbols-outlined text-primary mr-3">
            {icon}
          </span>
        )}
        <input
          className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-on-surface w-full placeholder:text-outline-variant font-medium"
          placeholder={placeholder}
          type="text"
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
              setSearch(value || "");
              return;
            }
            if (e.key !== "Enter") return;
            e.preventDefault();
            if (filtered.length > 0) {
              selectProvince(filtered[0]);
            }
          }}
        />
        {value && (
          <button 
            type="button"
            className="material-symbols-outlined text-outline-variant hover:text-on-surface transition-colors ml-2"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setSearch("");
            }}
          >
            close
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg border border-outline-variant/20 max-h-60 overflow-y-auto z-50 py-2">
          {loading ? (
            <div className="px-4 py-3 text-sm text-outline-variant text-center">
              Đang tải tỉnh/thành...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((province, idx) => (
              <div
                key={province || idx}
                className="px-4 py-3 hover:bg-surface-container-low cursor-pointer flex items-center transition-colors text-sm font-medium"
                onClick={() => {
                  selectProvince(province);
                }}
              >
                <span className="material-symbols-outlined text-outline-variant mr-3 text-lg">location_on</span>
                {province}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-outline-variant text-center">
              Không tìm thấy tỉnh/thành
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationDropdown;
