import React, { useEffect, useMemo, useRef, useState } from "react";

const PROVINCE_API_URL = "https://provinces.open-api.vn/api/v2/";
let cachedProvinceNames = null;
let provinceRequest = null;

const fetchProvinceNames = () => {
  if (cachedProvinceNames) return Promise.resolve(cachedProvinceNames);
  if (provinceRequest) return provinceRequest;

  provinceRequest = fetch(PROVINCE_API_URL).
  then((response) => {
    if (!response.ok) {
      throw new Error("Không tải được danh sách tỉnh/thành");
    }

    return response.json();
  }).
  then((data) => {
    cachedProvinceNames = Array.isArray(data) ?
    data.map((province) => province?.name).filter(Boolean) :
    [];
    return cachedProvinceNames;
  }).
  finally(() => {
    provinceRequest = null;
  });

  return provinceRequest;
};

const normalizeText = (value) =>
String(value || "").
normalize("NFD").
replace(/[\u0300-\u036f]/g, "").
replace(/đ/g, "d").
replace(/Đ/g, "D").
toLowerCase().
trim();

export default function ProvinceDropdown({ value, onChange, placeholder, icon, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const [provinces, setProvinces] = useState(cachedProvinceNames || []);
  const [loading, setLoading] = useState(!cachedProvinceNames);
  const [loadError, setLoadError] = useState("");
  const wrapperRef = useRef(null);
  const skipValueSyncRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    fetchProvinceNames().
    then((provinceNames) => {
      if (!isMounted) return;
      setProvinces(provinceNames);
      setLoadError("");
    }).
    catch((error) => {
      if (!isMounted) return;
      console.error("Lỗi tải danh sách tỉnh/thành:", error);
      setLoadError("Không tải được danh sách tỉnh/thành");
    }).
    finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (skipValueSyncRef.current) {
      skipValueSyncRef.current = false;
      return;
    }
    setSearch(value || "");
  }, [value]);

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
        onClick={() => setIsOpen(true)}>
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
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              setSearch(value || "");
              return;
            }
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (filtered.length > 0) {
              selectProvince(filtered[0]);
            }
          }}
        />
        {value && (
          <button
            type="button"
            className="material-symbols-outlined text-outline-variant hover:text-on-surface transition-colors ml-2"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
              setSearch("");
            }}>
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
          ) : loadError ? (
            <div className="px-4 py-3 text-sm text-error text-center">
              {loadError}
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((province, index) => (
              <button
                key={province || index}
                type="button"
                className="w-full px-4 py-3 hover:bg-surface-container-low cursor-pointer flex items-center transition-colors text-left text-sm font-medium"
                onClick={() => selectProvince(province)}>
                <span className="material-symbols-outlined text-outline-variant mr-3 text-lg">location_on</span>
                {province}
              </button>
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
}
