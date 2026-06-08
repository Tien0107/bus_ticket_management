import React, { useEffect, useMemo, useRef, useState } from "react";
import { getVietnamProvinces, VIETNAM_PROVINCES } from "../../utils/provinces";

const normalizeText = (value) =>
String(value || "").
normalize("NFD").
replace(/[\u0300-\u036f]/g, "").
replace(/đ/g, "d").
replace(/Đ/g, "D").
toLowerCase().
trim();

export default function ProvinceDropdown({ value, onChange, placeholder, icon, className = "" }) {
  // Seed with the latest known list immediately so the dropdown shows content right when opened
  const [provinces, setProvinces] = useState(VIETNAM_PROVINCES);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const wrapperRef = useRef(null);
  const skipValueSyncRef = useRef(false);
  const loadedRef = useRef(false);

  // Try to get freshest list from the API in background (https://provinces.open-api.vn/api/v2/)
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    getVietnamProvinces()
      .then((list) => {
        if (list && list.length > 0) {
          setProvinces(list);
        }
      })
      .catch(() => {
        // keep the seeded list on error
      });
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
    const source = provinces.length > 0 ? provinces : [];
    if (!query) return source;
    return source.filter((province) => normalizeText(province).includes(query));
  }, [search, provinces]);

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
          {provinces.length === 0 ? (
            <div className="px-4 py-3 text-sm text-outline-variant text-center">Đang tải danh sách...</div>
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
