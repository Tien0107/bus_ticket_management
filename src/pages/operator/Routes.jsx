import React, { useEffect, useMemo, useState } from "react";
import { createRoute, getRoutes, updateRoute } from "../../api/operator";
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
  StatCard,
  inputClass } from
"./OperatorUI";

const emptyForm = {
  fromLocation: "",
  toLocation: "",
  distanceKm: "",
  durationMinutes: ""
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
    if (!formData.fromLocation.trim() || !formData.toLocation.trim()) {
      addToast({ type: "warning", title: "Thiếu điểm đi hoặc điểm đến" });
      return;
    }

    const payload = {
      fromLocation: formData.fromLocation.trim(),
      toLocation: formData.toLocation.trim(),
      distanceKm: Number(formData.distanceKm || 0),
      durationMinutes: Number(formData.durationMinutes || 0)
    };

    try {
      if (editingRoute) {
        await updateRoute(editingRoute.id, payload);
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
        message: err.response?.data?.message || "Vui lòng kiểm tra dữ liệu tuyến."
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
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Tuyến</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Khoảng cách</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Thời gian</th>
                  <th className="px-5 py-3 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {routes.map((route) =>
              <tr key={route.id} className="hover:bg-surface-container-low/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-on-surface">{route.fromLocation} → {route.toLocation}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">ID: {route.id}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-on-surface">{Number(route.distanceKm || 0).toLocaleString("vi-VN")} km</td>
                    <td className="px-5 py-4 text-on-surface-variant">{Number(route.durationMinutes || 0).toLocaleString("vi-VN")} phút</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end">
                        <IconButton icon="edit" label="Sửa tuyến" variant="primary" onClick={() => openEditModal(route)} />
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>

          {nextCursor && (
            <div className="flex justify-center border-t border-outline-variant/30 bg-white px-5 py-4">
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
        footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={closeModal}>Hủy</SecondaryButton>
              <PrimaryButton icon={editingRoute ? "save" : "add"} onClick={handleSave}>
                {editingRoute ? "Cập nhật" : "Tạo tuyến"}
              </PrimaryButton>
            </div>
        }>
        
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Từ địa điểm">
                <input
                type="text"
                value={formData.fromLocation}
                onChange={(e) => handleChange("fromLocation", e.target.value)}
                className={inputClass}
                placeholder="Đồng Nai" />
              
              </Field>
              <Field label="Đến địa điểm">
                <input
                type="text"
                value={formData.toLocation}
                onChange={(e) => handleChange("toLocation", e.target.value)}
                className={inputClass}
                placeholder="Đắk Lắk" />
              
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Khoảng cách (km)">
                <input
                type="number"
                min="0"
                value={formData.distanceKm}
                onChange={(e) => handleChange("distanceKm", e.target.value)}
                className={inputClass} />
              
              </Field>
              <Field label="Thời gian (phút)">
                <input
                type="number"
                min="0"
                value={formData.durationMinutes}
                onChange={(e) => handleChange("durationMinutes", e.target.value)}
                className={inputClass} />
              
              </Field>
            </div>
          </div>
        </ModalShell>
      }
    </OperatorPageShell>);

}