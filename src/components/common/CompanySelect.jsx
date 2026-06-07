import { useState, useEffect, useRef } from "react";
import axiosClient from "../../api/axiosClient";

export default function CompanySelect({
  value,
  onChange,
  label = "Chọn công ty",
  required = true,
  disabled = false,
  error,
}) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const containerRef = useRef(null);

  // Fetch companies once
  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get("/public/company", { params: { limit: 50 } });
        const list = res.data?.companies || res.data || [];
        if (!cancelled) setCompanies(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Không tải được danh sách công ty", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, []);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Sync selected name when value changes from outside
  useEffect(() => {
    if (!value) {
      setSelectedName("");
      return;
    }
    const found = companies.find((c) => String(c.id) === String(value));
    setSelectedName(found ? found.name : "");
  }, [value, companies]);

  const filtered = companies.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleSelect = (company) => {
    onChange?.(String(company.id));
    setSelectedName(company.name);
    setSearch("");
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("");
    setSelectedName("");
    setSearch("");
  };

  const baseInputClass =
    "w-full bg-white border-0 rounded-xl p-4 text-left ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary outline-none transition-all flex items-center justify-between gap-2 disabled:bg-surface-container-low disabled:text-on-surface-variant/70";

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-on-surface-variant ml-1 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`${baseInputClass} ${selectedName ? "text-on-surface" : "text-on-surface-variant/60"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate flex-1 text-left">
          {selectedName || "-- Chọn công ty --"}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {selectedName && !disabled && (
            <span
              onClick={handleClear}
              className="material-symbols-outlined text-on-surface-variant hover:text-red-500 p-0.5 rounded transition-colors text-lg"
              title="Bỏ chọn"
            >
              close
            </span>
          )}
          <span className="material-symbols-outlined text-on-surface-variant text-xl">
            {open ? "expand_less" : "expand_more"}
          </span>
        </div>
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-600 ml-1">{error}</p>
      )}

      {open && (
        <div className="absolute z-[100] left-0 right-0 mt-2 rounded-2xl bg-white shadow-[0_10px_40px_rgba(15,23,42,0.18)] border border-outline-variant/20 overflow-hidden">
          {/* Search header */}
          <div className="p-3 border-b border-outline-variant/10 bg-white sticky top-0">
            <div className="flex items-center gap-2 bg-surface-container-low rounded-xl px-3 py-2.5">
              <span className="material-symbols-outlined text-on-surface-variant text-xl">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm công ty..."
                className="flex-1 bg-transparent border-0 outline-none text-sm text-on-surface placeholder:text-on-surface-variant/60"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[260px] overflow-y-auto py-1">
            {loading ? (
              <div className="py-8 text-center text-on-surface-variant text-sm">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-2" />
                Đang tải danh sách công ty...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-on-surface-variant text-sm">
                <span className="material-symbols-outlined text-3xl opacity-40 block mb-1">search_off</span>
                Không tìm thấy công ty phù hợp
              </div>
            ) : (
              filtered.map((company) => {
                const isSelected = String(value) === String(company.id);
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelect(company)}
                    className={`w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-primary/5 active:bg-primary/10 transition-colors border-b border-outline-variant/5 last:border-b-0 ${
                      isSelected ? "bg-primary/10" : ""
                    }`}
                  >
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="w-9 h-9 rounded-xl object-cover ring-1 ring-outline-variant/20 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl">business</span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1 text-left">
                      <div className="font-semibold text-on-surface truncate">{company.name}</div>
                      {company.hotline && (
                        <div className="text-xs text-on-surface-variant mt-0.5 truncate">
                          Hotline: {company.hotline}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-2xl shrink-0">check_circle</span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 text-[11px] text-center text-on-surface-variant/70 border-t border-outline-variant/10 bg-surface-container-low/50">
            Chọn công ty bạn muốn tham gia
          </div>
        </div>
      )}
    </div>
  );
}
