import React, { useEffect, useMemo, useState } from "react";
import {
  createTripPrice,
  deleteTripPrice,
  getRoutes,
  getStations,
  getTripPrices,
  updateTripPrice } from
"../../api/operator";
import { useToast } from "../../context/ToastContext";
import {
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  LoadingState,
  ModalShell,
  OperatorPageShell,
  PrimaryButton,
  SecondaryButton,
  SelectControl,
  StatCard,
  StatusBadge,
  ToolbarCard,
  formatCurrency,
  inputClass } from
"./OperatorUI";

const emptyForm = {
  routeId: "",
  fromStationId: "",
  toStationId: "",
  price: "",
  status: true
};

const OPTION_LIMIT = 100;

const getStoredCompanyId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.companyId || null;
  } catch {
    return null;
  }
};

function StationDropdown({ stations = [], value, onChange, placeholder = "Chọn trạm" }) {
  const [open, setOpen] = useState(false);
  const selectedStation = stations.find((station) => Number(station.id) === Number(value));

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-outline-variant/50 bg-white px-4 py-3 text-left text-sm font-medium text-on-surface outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
      >
        <span className={selectedStation ? "truncate" : "truncate text-outline"}>
          {selectedStation ? `${selectedStation.address} - ${selectedStation.city}` : placeholder}
        </span>
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
          {open ? "keyboard_arrow_up" : "keyboard_arrow_down"}
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-[180px] overflow-y-auto rounded-lg border border-outline-variant/40 bg-white py-1 shadow-[0_18px_48px_rgba(15,23,42,0.18)]">
          {stations.map((station) => {
            const active = Number(station.id) === Number(value);

            return (
              <button
                key={station.id}
                type="button"
                onClick={() => {
                  onChange(station.id);
                  setOpen(false);
                }}
                className={`flex h-9 w-full items-center truncate px-3 text-left text-xs font-bold transition-colors ${
                  active ? "bg-primary text-white" : "text-on-surface hover:bg-surface-container-low"
                }`}
              >
                {station.address} - {station.city}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Prices() {
  const { addToast } = useToast();
  const [prices, setPrices] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [stations, setStations] = useState([]);
  const [filterRouteId, setFilterRouteId] = useState("all");
  const [appliedRouteId, setAppliedRouteId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchBaseData();

  }, []);

  useEffect(() => {
    fetchPrices();

  }, [appliedRouteId]);

  const fetchBaseData = async () => {
    try {
      const [routesRes, stationsRes] = await Promise.all([
      getRoutes({ limit: OPTION_LIMIT }),
      getStations({ limit: OPTION_LIMIT })]
      );
      setRoutes(Array.isArray(routesRes.data?.routes) ? routesRes.data.routes : []);
      setStations(Array.isArray(stationsRes.data?.stations) ? stationsRes.data.stations : []);
    } catch (err) {
      console.error("Lỗi tải dữ liệu nền bảng giá:", err);
      addToast({ type: "error", title: "Không tải được tuyến hoặc trạm" });
    }
  };

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const params = {
        routeId: appliedRouteId !== "all" ? Number(appliedRouteId) : undefined,
        limit: 10
      };
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

      const response = await getTripPrices(params);
      setPrices(Array.isArray(response.data?.prices) ? response.data.prices : []);
      setError("");
    } catch (err) {
      console.error("Lỗi tải bảng giá:", err);
      setError("Không thể tải bảng giá.");
      addToast({ type: "error", title: "Không tải được bảng giá" });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const active = prices.filter((price) => Boolean(price.status)).length;
    const average = prices.length ?
    prices.reduce((sum, price) => sum + Number(price.price || 0), 0) / prices.length :
    0;

    return [
    { icon: "local_offer", label: "Bảng giá", value: prices.length, tone: "primary" },
    { icon: "check_circle", label: "Đang áp dụng", value: active, tone: "emerald" },
    { icon: "payments", label: "Giá trung bình", value: formatCurrency(average), tone: "amber" }];

  }, [prices]);

  const routeLabel = (routeId) => {
    const route = routes.find((item) => Number(item.id) === Number(routeId));
    return route ? `${route.fromLocation} → ${route.toLocation}` : "—";
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPrice(null);
    setFormData(emptyForm);
  };

  const openCreateModal = () => {
    setEditingPrice(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (price) => {
    setEditingPrice(price);
    setFormData({
      routeId: price.routeId || "",
      fromStationId: price.fromStationId || "",
      toStationId: price.toStationId || "",
      price: price.price ?? "",
      status: Boolean(price.status)
    });
    setShowModal(true);
  };

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.routeId || !formData.fromStationId || !formData.toStationId || !formData.price) {
      addToast({ type: "warning", title: "Thiếu thông tin bảng giá" });
      return;
    }

    if (Number(formData.fromStationId) === Number(formData.toStationId)) {
      addToast({ type: "warning", title: "Trạm đi và trạm đến không được trùng nhau" });
      return;
    }

    const companyId = editingPrice?.companyId || getStoredCompanyId();
    if (!companyId) {
      addToast({ type: "error", title: "Không tìm thấy công ty để lưu bảng giá" });
      return;
    }

    const payload = {
      companyId: Number(companyId),
      routeId: Number(formData.routeId),
      fromStationId: Number(formData.fromStationId),
      toStationId: Number(formData.toStationId),
      price: Number(formData.price),
      status: Boolean(formData.status)
    };

    try {
      if (editingPrice) {
        await updateTripPrice(editingPrice.id, payload);
        addToast({ type: "success", title: "Cập nhật bảng giá thành công" });
      } else {
        await createTripPrice(payload);
        addToast({ type: "success", title: "Tạo bảng giá thành công" });
      }
      closeModal();
      fetchPrices();
    } catch (err) {
      console.error("Lỗi lưu bảng giá:", err);
      addToast({
        type: "error",
        title: "Không lưu được bảng giá",
        message: err.response?.data?.message || "Vui lòng kiểm tra dữ liệu giá vé."
      });
    }
  };

  const handleDelete = async (price) => {
    if (!window.confirm(`Xóa bảng giá ${price.fromStationAddress || ""} → ${price.toStationAddress || ""}?`)) return;

    try {
      await deleteTripPrice(price.id);
      addToast({ type: "success", title: "Xóa bảng giá thành công" });
      fetchPrices();
    } catch (err) {
      console.error("Lỗi xóa bảng giá:", err);
      addToast({
        type: "error",
        title: "Không xóa được bảng giá",
        message: err.response?.data?.message || "Bảng giá có thể đang được sử dụng."
      });
    }
  };

  return (
    <OperatorPageShell
      eyebrow="Prices"
      title="Quản lý bảng giá"
      description="Thiết lập giá vé theo tuyến và cặp trạm đón trả."
      actions={<IconButton icon="add" label="Thêm bảng giá" variant="primary" onClick={openCreateModal} />}>
      
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) =>
        <StatCard key={stat.label} {...stat} />
        )}
      </div>

      <ToolbarCard>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto_auto]">
          <SelectControl value={filterRouteId} onChange={(e) => setFilterRouteId(e.target.value)}>
            <option value="all">Tất cả tuyến</option>
            {routes.map((route) =>
            <option key={route.id} value={route.id}>
                {route.fromLocation} → {route.toLocation}
              </option>
            )}
          </SelectControl>
          <PrimaryButton icon="filter_alt" onClick={() => setAppliedRouteId(filterRouteId)}>Lọc</PrimaryButton>
          <SecondaryButton
            icon="refresh"
            onClick={() => {
              setFilterRouteId("all");
              setAppliedRouteId("all");
            }}>
            
            Đặt lại
          </SecondaryButton>
        </div>
      </ToolbarCard>

      {loading ?
      <LoadingState /> :
      error ?
      <ErrorState message={error} /> :
      prices.length === 0 ?
      <EmptyState icon="local_offer" title="Chưa có bảng giá" description="Tạo bảng giá đầu tiên cho tuyến và cặp trạm." /> :

      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Tuyến</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Từ trạm</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Đến trạm</th>
                  <th className="px-5 py-3 text-right font-bold text-on-surface-variant">Giá</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {prices.map((price) =>
              <tr key={price.id} className="hover:bg-surface-container-low/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-on-surface">
                        {price.routeFromLocation && price.routeToLocation ?
                    `${price.routeFromLocation} → ${price.routeToLocation}` :
                    routeLabel(price.routeId)}
                      </p>
                      <p className="mt-1 text-xs text-on-surface-variant">ID: {price.id}</p>
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {price.fromStationAddress || "—"}
                      {price.fromStationCity ? `, ${price.fromStationCity}` : ""}
                    </td>
                    <td className="px-5 py-4 text-on-surface-variant">
                      {price.toStationAddress || "—"}
                      {price.toStationCity ? `, ${price.toStationCity}` : ""}
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-on-surface">{formatCurrency(price.price)}</td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={price.status ? "emerald" : "slate"}>
                        {price.status ? "Áp dụng" : "Tạm tắt"}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <IconButton icon="edit" label="Sửa bảng giá" onClick={() => openEditModal(price)} />
                        <IconButton icon="delete_outline" label="Xóa bảng giá" variant="danger" onClick={() => handleDelete(price)} />
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }

      {showModal &&
      <ModalShell
        title={editingPrice ? "Sửa bảng giá" : "Thêm bảng giá"}
        subtitle="Giá vé theo tuyến và trạm."
        onClose={closeModal}
        bodyClassName="overflow-visible"
        panelOverflowClassName="overflow-visible"
        footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={closeModal}>Hủy</SecondaryButton>
              <PrimaryButton icon={editingPrice ? "save" : "add"} onClick={handleSave}>
                {editingPrice ? "Cập nhật" : "Tạo bảng giá"}
              </PrimaryButton>
            </div>
        }>
        
          <div className="space-y-4">
            <Field label="Tuyến đường">
              <SelectControl value={formData.routeId} onChange={(e) => handleChange("routeId", e.target.value)}>
                <option value="">Chọn tuyến</option>
                {routes.map((route) =>
              <option key={route.id} value={route.id}>
                    {route.fromLocation} → {route.toLocation}
                  </option>
              )}
              </SelectControl>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Từ trạm">
                <StationDropdown
                  stations={stations}
                  value={formData.fromStationId}
                  placeholder="Chọn trạm đi"
                  onChange={(stationId) => handleChange("fromStationId", stationId)}
                />
              </Field>
              <Field label="Đến trạm">
                <StationDropdown
                  stations={stations}
                  value={formData.toStationId}
                  placeholder="Chọn trạm đến"
                  onChange={(stationId) => handleChange("toStationId", stationId)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Giá vé">
                <input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                className={inputClass}
                placeholder="250000" />
              
              </Field>
              <Field label="Trạng thái">
                <SelectControl
                value={formData.status ? "true" : "false"}
                onChange={(e) => handleChange("status", e.target.value === "true")}>
                
                  <option value="true">Áp dụng</option>
                  <option value="false">Tạm tắt</option>
                </SelectControl>
              </Field>
            </div>
          </div>
        </ModalShell>
      }
    </OperatorPageShell>);

}
