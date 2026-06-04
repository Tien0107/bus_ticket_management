import React, { useEffect, useMemo, useState } from "react";
import { createRoute, getRoutes, updateRoute } from "../../api/operator";
import { useToast } from "../../context/ToastContext";
import ProvinceDropdown from "./ProvinceDropdown";
import {
  EmptyState,
  ErrorState,
  IconButton,
  LoadingState,
  ModalShell,
  OperatorPageShell,
  PrimaryButton,
  SecondaryButton,
  StatCard,
  inputClass } from
"./OperatorUI";

const emptyForm = {
  fromLocation: "",
  toLocation: "",
  distanceKm: "",
  durationMinutes: ""
};

const routeDropdownClass =
"min-h-[64px] rounded-xl border border-outline-variant/50 bg-white px-5 shadow-sm focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10";

const routeNumberInputClass =
`${inputClass} h-16 rounded-xl px-5 text-base font-semibold shadow-sm`;

const routeFieldLabelClass = "mb-3 block text-base font-extrabold text-on-surface";

const getRouteId = (route) => route?.id ?? route?.routeId ?? route?.route_id;
const hasRouteId = (route) => {
  const routeId = getRouteId(route);
  return routeId !== undefined && routeId !== null && routeId !== "";
};
const normalizeRouteLocation = (value) => String(value || "").trim().toLowerCase();
const parsePositiveNumber = (value) => {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
};

export default function Routes() {
  const { addToast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [nextCursor, setNextCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchRoutes = async ({ append = false, cursor = null } = {}) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = { limit: 10 };
      if (append && cursor) params.next = cursor;

      const response = await getRoutes(params);
      const newRoutes = Array.isArray(response.data?.routes) ? response.data.routes : [];
      const responseNext = response.data?.next || null;

      if (append) {
        setRoutes((prev) => [...prev, ...newRoutes]);
      } else {
        setRoutes(newRoutes);
      }

      setNextCursor(responseNext);
      setError("");
    } catch (err) {
      console.error("Lỗi tải tuyến:", err);
      setError("Không thể tải danh sách tuyến đường.");
      addToast({ type: "error", title: "Không tải được tuyến đường" });
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setNextCursor(null);
    fetchRoutes();
  }, []);

  const stats = useMemo(() => {
    const totalDistance = routes.reduce((sum, route) => sum + Number(route.distanceKm || 0), 0);
    const totalDuration = routes.reduce((sum, route) => sum + Number(route.durationMinutes || 0), 0);

    return [
    { icon: "route", label: "Tổng tuyến", value: routes.length, tone: "primary" },
    { icon: "straighten", label: "Tổng km", value: totalDistance.toLocaleString("vi-VN"), tone: "blue" },
    { icon: "schedule", label: "Tổng phút", value: totalDuration.toLocaleString("vi-VN"), tone: "amber" }];

  }, [routes]);

  const openCreateModal = () => {
    setEditingRoute(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (route) => {
    setEditingRoute(route);
    setFormData({
      fromLocation: route.fromLocation || "",
      toLocation: route.toLocation || "",
      distanceKm: route.distanceKm ?? "",
      durationMinutes: route.durationMinutes ?? ""
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRoute(null);
    setFormData(emptyForm);
  };

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    const fromLocation = formData.fromLocation.trim();
    const toLocation = formData.toLocation.trim();
    const distanceKm = parsePositiveNumber(formData.distanceKm);
    const durationMinutes = parsePositiveNumber(formData.durationMinutes);

    if (!fromLocation || !toLocation) {
      addToast({ type: "warning", title: "Thiếu điểm đi hoặc điểm đến" });
      return;
    }

    if (normalizeRouteLocation(fromLocation) === normalizeRouteLocation(toLocation)) {
      addToast({ type: "warning", title: "Điểm đi và điểm đến không được trùng nhau" });
      return;
    }

    if (!distanceKm || !durationMinutes) {
      addToast({ type: "warning", title: "Khoảng cách và thời gian phải lớn hơn 0" });
      return;
    }

    const editingRouteId = getRouteId(editingRoute);
    const duplicateRoute = routes.find((route) =>
    normalizeRouteLocation(route.fromLocation) === normalizeRouteLocation(fromLocation) &&
    normalizeRouteLocation(route.toLocation) === normalizeRouteLocation(toLocation) &&
    String(getRouteId(route)) !== String(editingRouteId)
    );

    if (duplicateRoute) {
      addToast({ type: "warning", title: "Tuyến đường này đã tồn tại" });
      return;
    }

    const payload = {
      fromLocation,
      toLocation,
      distanceKm,
      durationMinutes
    };

    try {
      if (editingRoute) {
        const routeId = getRouteId(editingRoute);
        if (!hasRouteId(editingRoute)) {
          addToast({ type: "error", title: "Không tìm thấy ID tuyến để cập nhật" });
          return;
        }

        const response = await updateRoute(routeId, payload);
        const updatedRoute = response.data?.route || { ...editingRoute, ...payload, id: routeId };
        setRoutes((current) =>
        current.map((route) => String(getRouteId(route)) === String(routeId) ? { ...route, ...updatedRoute } : route)
        );
        addToast({ type: "success", title: "Cập nhật tuyến thành công" });
      } else {
        await createRoute(payload);
        addToast({ type: "success", title: "Tạo tuyến thành công" });
      }

      closeModal();
      setNextCursor(null);
      fetchRoutes();
    } catch (err) {
      console.error("Lỗi lưu tuyến:", err);
      addToast({
        type: "error",
        title: "Không lưu được tuyến",
        message: err.response?.data?.message || err.response?.data?.error || err.response?.data?.detail || err.message || "Vui lòng kiểm tra dữ liệu tuyến."
      });
    }
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      fetchRoutes({ append: true, cursor: nextCursor });
    }
  };

  return (
    <OperatorPageShell
      eyebrow="Routes"
      title="Quản lý tuyến đường"
      description="Tạo và cập nhật tuyến khai thác theo đúng API điều phối."
      actions={<IconButton icon="add" label="Thêm tuyến" variant="primary" onClick={openCreateModal} />}>
      
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) =>
        <StatCard key={stat.label} {...stat} />
        )}
      </div>

      {loading ?
      <LoadingState /> :
      error ?
      <ErrorState message={error} /> :
      routes.length === 0 ?
      <EmptyState icon="route" title="Chưa có tuyến đường" description="Tạo tuyến đầu tiên để cấu hình lịch biểu và bảng giá." /> :

      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Tuyến</th>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Khoảng cách</th>
                  <th className="px-4 py-2.5 text-left font-bold text-on-surface-variant">Thời gian</th>
                  <th className="px-4 py-2.5 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {routes.map((route) =>
              <tr key={getRouteId(route) ?? `${route.fromLocation}-${route.toLocation}`} className="hover:bg-surface-container-low/70">
                    <td className="px-4 py-2.5">
                      <p className="font-bold text-on-surface">{route.fromLocation} → {route.toLocation}</p>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-on-surface">{Number(route.distanceKm || 0).toLocaleString("vi-VN")} km</td>
                    <td className="px-4 py-2.5 text-on-surface-variant">{Number(route.durationMinutes || 0).toLocaleString("vi-VN")} phút</td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end">
                        <IconButton icon="edit" label="Sửa tuyến" variant="primary" disabled={!hasRouteId(route)} onClick={() => openEditModal(route)} />
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          {nextCursor && (
            <div className="flex justify-center border-t border-outline-variant/30 bg-white px-4 py-2.5">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/60 bg-white px-5 py-2 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? "Đang tải thêm..." : "Tải thêm"}
              </button>
            </div>
          )}
        </div>
      }

      {showModal &&
      <ModalShell
        title={editingRoute ? "Sửa tuyến đường" : "Thêm tuyến đường"}
        subtitle="Thông tin tuyến khai thác."
        onClose={closeModal}
        maxWidth="max-w-5xl"
        panelOverflowClassName="overflow-visible"
        headerClassName="border-b border-outline-variant/20 px-8 py-6"
        titleClassName="text-3xl font-black tracking-tight text-on-surface"
        subtitleClassName="mt-2 text-base font-medium text-on-surface-variant"
        bodyClassName="overflow-visible"
        bodyPaddingClassName="px-8 py-7"
        footerClassName="border-t border-outline-variant/20 bg-surface/60 px-8 py-5"
        footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton className="min-h-[52px] rounded-xl px-6 text-base" onClick={closeModal}>Hủy</SecondaryButton>
              <PrimaryButton className="min-h-[52px] rounded-xl px-7 text-base" icon={editingRoute ? "save" : "add"} onClick={handleSave}>
                {editingRoute ? "Cập nhật" : "Tạo tuyến"}
              </PrimaryButton>
            </div>
        }>
        
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low/40 p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="relative z-30">
                <span className={routeFieldLabelClass}>Từ địa điểm</span>
                <ProvinceDropdown
                value={formData.fromLocation}
                onChange={(value) => handleChange("fromLocation", value)}
                placeholder="Chọn tỉnh/thành đi"
                icon="location_on"
                className={routeDropdownClass} />
              
              </div>
              <div className="relative z-20">
                <span className={routeFieldLabelClass}>Đến địa điểm</span>
                <ProvinceDropdown
                value={formData.toLocation}
                onChange={(value) => handleChange("toLocation", value)}
                placeholder="Chọn tỉnh/thành đến"
                icon="flag"
                className={routeDropdownClass} />
              
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div>
                <span className={routeFieldLabelClass}>Khoảng cách (km)</span>
                <input
                type="number"
                min="0"
                value={formData.distanceKm}
                onChange={(e) => handleChange("distanceKm", e.target.value)}
                className={routeNumberInputClass}
                placeholder="Ví dụ: 320" />
              
              </div>
              <div>
                <span className={routeFieldLabelClass}>Thời gian (phút)</span>
                <input
                type="number"
                min="0"
                value={formData.durationMinutes}
                onChange={(e) => handleChange("durationMinutes", e.target.value)}
                className={routeNumberInputClass}
                placeholder="Ví dụ: 420" />
              
              </div>
            </div>
          </div>
        </ModalShell>
      }
    </OperatorPageShell>);

}
