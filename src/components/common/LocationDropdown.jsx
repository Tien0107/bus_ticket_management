import React, { useState, useRef, useEffect } from 'react';

const VIETNAM_PROVINCES = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", "Bình Dương", "Bình Phước", "Bình Thuận",
  "Cà Mau", "Cần Thơ", "Cao Bằng", "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Điện Biên", "Đồng Nai", "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Nội",
  "Hà Tĩnh", "Hải Dương", "Hải Phòng", "Hậu Giang", "Hòa Bình", "Hưng Yên", "Khánh Hòa", "Kiên Giang", "Kon Tum", "Lai Châu", "Lâm Đồng", "Lạng Sơn",
  "Lào Cai", "Long An", "Nam Định", "Nghệ An", "Ninh Bình", "Ninh Thuận", "Phú Thọ", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Ninh",
  "Quảng Trị", "Sóc Trăng", "Sơn La", "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "TP. Hồ Chí Minh", "Trà Vinh",
  "Tuyên Quang", "Vĩnh Long", "Vĩnh Phúc", "Yên Bái"
];

const removeDiacritics = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const LocationDropdown = ({ value, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value || "");
  const wrapperRef = useRef(null);

  useEffect(() => {
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

  const filtered = VIETNAM_PROVINCES.filter((province) => {
    if (!search) return true;
    const cleanSearch = removeDiacritics(search).toLowerCase();
    const cleanProvince = removeDiacritics(province).toLowerCase();
    return cleanProvince.includes(cleanSearch);
  });

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="flex items-center bg-surface-container-low px-4 py-3 rounded-xl focus-within:ring-2 ring-primary/20 transition-all cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <span className="material-symbols-outlined text-primary mr-3">
          {icon}
        </span>
        <input
          className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-on-surface w-full placeholder:text-outline-variant font-medium"
          placeholder={placeholder}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered.length > 0) {
                onChange(filtered[0]);
                setSearch(filtered[0]);
                setIsOpen(false);
              }
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
          {filtered.length > 0 ? (
            filtered.map((province, idx) => (
              <div
                key={idx}
                className="px-4 py-3 hover:bg-surface-container-low cursor-pointer flex items-center transition-colors text-sm font-medium"
                onClick={() => {
                  onChange(province);
                  setSearch(province);
                  setIsOpen(false);
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
