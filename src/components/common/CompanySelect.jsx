import { useState, useEffect, useMemo, useRef } from "react";
import axiosClient from "../../api/axiosClient";

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

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

  const selectedCompany = useMemo(
    () => companies.find((company) => String(company.id) === String(value)) || null,
    [companies, value]
  );

  const filtered = useMemo(() => {
    const query = normalizeText(search);
    if (!query) return companies;

    return companies.filter((company) =>
      normalizeText(`${company.name || ""} ${company.hotline || ""}`).includes(query)
    );
  }, [companies, search]);

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
    "group flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border border-outline-variant/40 bg-white px-3.5 py-2.5 text-left shadow-sm outline-none transition-all hover:border-primary/40 hover:bg-surface-container-low/30 focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-surface-container-low disabled:text-on-surface-variant/70";

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
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {selectedCompany?.logoUrl ? (
            <img
              src={selectedCompany.logoUrl}
              alt={selectedCompany.name}
              className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-outline-variant/20"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined text-[20px]">business</span>
            </span>
          )}

          <span className="min-w-0 flex-1">
            <span className={`block truncate text-sm font-extrabold ${selectedName ? "text-on-surface" : "text-on-surface-variant/70"}`}>
              {selectedName || "Chọn công ty"}
            </span>
            <span className="mt-0.5 block truncate text-xs font-medium text-on-surface-variant">
              {selectedCompany?.hotline ? `Hotline: ${selectedCompany.hotline}` : "Chọn nhà xe bạn muốn tham gia"}
            </span>
          </span>
        </span>

        <div className="flex shrink-0 items-center gap-1">
          {selectedName && !disabled && (
            <span
              onClick={handleClear}
              className="material-symbols-outlined rounded-full p-1 text-lg text-on-surface-variant transition-colors hover:bg-red-50 hover:text-red-500"
              title="Bỏ chọn"
            >
              close
            </span>
          )}
          <span className="material-symbols-outlined text-xl text-on-surface-variant transition-transform">
            {open ? "expand_less" : "expand_more"}
          </span>
        </div>
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-600 ml-1">{error}</p>
      )}

      {open && (
        <div className="absolute left-0 right-0 z-[100] mt-2 flex max-h-[360px] flex-col overflow-hidden rounded-xl border border-outline-variant/20 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.14)]">
          <div className="border-b border-outline-variant/10 bg-surface-container-low/40 p-2.5">
            <div className="flex h-11 items-center gap-2 rounded-lg bg-white px-3 ring-1 ring-outline-variant/20 transition-colors focus-within:ring-primary/45">
              <span className="material-symbols-outlined text-[20px] text-primary">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm công ty..."
                className="company-select-search-input h-full min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-sm font-semibold text-on-surface shadow-none outline-none ring-0 placeholder:text-on-surface-variant/55 focus:border-0 focus:shadow-none focus:outline-none focus:ring-0"
                style={{ border: 0, boxShadow: "none", outline: "none" }}
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[17px]">close</span>
                </button>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {loading ? (
              <div className="py-8 text-center text-sm font-medium text-on-surface-variant">
                <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
                Đang tải danh sách công ty...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-8 text-center text-sm font-medium text-on-surface-variant">
                <span className="material-symbols-outlined mb-1 block text-3xl opacity-40">search_off</span>
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
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-primary/5 active:bg-primary/10 ${
                      isSelected ? "bg-primary/10 ring-1 ring-primary/20" : ""
                    }`}
                  >
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={company.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-outline-variant/20"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <span className="material-symbols-outlined text-[20px] text-primary">business</span>
                      </div>
                    )}

                    <div className="min-w-0 flex-1 text-left">
                      <div className="truncate text-sm font-extrabold text-on-surface">{company.name}</div>
                      {company.hotline && (
                        <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium text-on-surface-variant">
                          <span className="material-symbols-outlined text-[14px] text-primary">call</span>
                          Hotline: {company.hotline}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <span className="material-symbols-outlined text-[17px]">check</span>
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-outline-variant/10 bg-surface-container-low/40 px-4 py-2 text-center text-xs font-medium text-on-surface-variant">
            {filtered.length ? `${filtered.length} công ty phù hợp` : "Chọn công ty bạn muốn tham gia"}
          </div>
        </div>
      )}
    </div>
  );
}
