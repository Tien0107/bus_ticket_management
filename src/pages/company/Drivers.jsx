import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getDrivers, verifyCompanyAccount } from "../../api/company";
import { createNotification } from "../../api/notification";
import { useToast } from "../../context/ToastContext";
import {
  CompanyPageShell,
  EmptyState,
  ErrorState,
  Field,
  IconButton,
  LoadingState,
  ModalShell,
  PrimaryButton,
  SearchInput,
  SecondaryButton,
  SelectControl,
  StatCard,
  StatusBadge,
  ToolbarCard } from
"./CompanyUI";

const statusLabel = {
  active: "Hoạt động",
  inactive: "Không hoạt động",
  banned: "Bị chặn"
};

const statusTone = {
  active: "emerald",
  inactive: "amber",
  banned: "red"
};

const accountStatusNotification = {
  active: {
    title: "Tài khoản tài xế đã được duyệt",
    body: "Công ty đã duyệt tài khoản tài xế của bạn. Bạn có thể truy cập hệ thống."
  },
  inactive: {
    title: "Tài khoản tài xế đã bị tạm ngưng",
    body: "Công ty đã tạm ngưng tài khoản tài xế của bạn."
  },
  banned: {
    title: "Tài khoản tài xế đã bị cấm",
    body: "Công ty đã cấm tài khoản tài xế của bạn."
  }
};

export default function Drivers() {
  const { addToast } = useToast();

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState("active");
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const keyword = searchTerm.trim();
      const params = {
        status: filterStatus !== "all" ? filterStatus : undefined,
        phone: keyword || undefined,
        limit: 10
      };
      Object.keys(params).forEach((key) => params[key] === undefined && delete params[key]);

      const response = await getDrivers(params);
      setDrivers(Array.isArray(response.data?.drivers) ? response.data.drivers : []);
      setError("");
    } catch {
      setError("Không thể tải danh sách tài xế.");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchTerm]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const stats = useMemo(() => [
  { icon: "badge", label: "Tổng tài xế", value: drivers.length, tone: "primary" },
  { icon: "verified", label: "Hoạt động", value: drivers.filter((driver) => driver.status === "active").length, tone: "emerald" },
  { icon: "pause_circle", label: "Không hoạt động", value: drivers.filter((driver) => driver.status === "inactive").length, tone: "amber" },
  { icon: "block", label: "Bị chặn", value: drivers.filter((driver) => driver.status === "banned").length, tone: "red" }],
  [drivers]);

  const getDriverId = (driver) => driver?.userId || driver?.id;

  const notifyDriverStatus = async (driverId, status) => {
    const notification = accountStatusNotification[status];
    if (!driverId || !notification) return;

    try {
      await createNotification({
        userId: driverId,
        title: notification.title,
        body: notification.body,
        data: JSON.stringify({
          type: "account_status",
          status,
          path: "/driver/dashboard"
        })
      });
    } catch {

    }
  };

  const handleOpenStatusModal = (driver = selectedDriver) => {
    setSelectedDriver(driver);
    setStatusForm(driver?.status || "active");
    setShowStatusModal(true);
  };

  const handleSaveStatus = async () => {
    const driverId = getDriverId(selectedDriver);
    if (!driverId) {
      addToast("Không tìm thấy ID tài xế", "error");
      return;
    }

    try {
      setStatusLoading(true);
      await verifyCompanyAccount({ id: driverId, status: statusForm });
      await notifyDriverStatus(driverId, statusForm);
      addToast("Cập nhật trạng thái tài xế thành công", "success");
      setShowStatusModal(false);
      setShowDetailModal(false);
      setSelectedDriver(null);
      fetchDrivers();
    } catch (err) {
      addToast(err.response?.data?.message || "Cập nhật trạng thái tài xế thất bại", "error");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <CompanyPageShell
      eyebrow="Drivers"
      title="Quản lý tài xế"
      description="Tra cứu tài xế theo số điện thoại, xem thông tin và cập nhật trạng thái tài khoản.">
      
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) =>
        <StatCard key={stat.label} {...stat} />
        )}
      </div>

      <ToolbarCard>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_240px]">
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo số điện thoại" />
          
          <SelectControl value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
            <option value="banned">Bị chặn</option>
          </SelectControl>
        </div>
      </ToolbarCard>

      {loading ?
      <LoadingState /> :
      error ?
      <ErrorState message={error} /> :
      drivers.length === 0 ?
      <EmptyState icon="person_search" title="Không tìm thấy tài xế" description="Thử đổi số điện thoại hoặc bộ lọc trạng thái." /> :

      <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Tài xế</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Liên hệ</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Trạng thái</th>
                  <th className="px-5 py-3 text-right font-bold text-on-surface-variant">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {drivers.map((driver) =>
              <tr key={getDriverId(driver)} className="hover:bg-surface-container-low/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-[22px]">person</span>
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-on-surface">{driver.fullName || "Chưa có tên"}</p>
                          <p className="mt-1 text-xs text-on-surface-variant">ID: {getDriverId(driver) || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-on-surface">{driver.email || "—"}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">{driver.phone || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge tone={statusTone[driver.status] || "slate"}>
                        {statusLabel[driver.status] || driver.status || "—"}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <IconButton
                      icon="visibility"
                      label="Xem chi tiết"
                      onClick={() => {
                        setSelectedDriver(driver);
                        setShowDetailModal(true);
                      }} />
                    
                        <IconButton icon="manage_accounts" label="Đổi trạng thái" variant="primary" onClick={() => handleOpenStatusModal(driver)} />
                      </div>
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        </div>
      }

      {showDetailModal && selectedDriver &&
      <ModalShell
        title="Chi tiết tài xế"
        subtitle={selectedDriver.fullName}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedDriver(null);
        }}
        footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton
            onClick={() => {
              setShowDetailModal(false);
              setSelectedDriver(null);
            }}>
            
                Đóng
              </SecondaryButton>
              <IconButton
            icon="manage_accounts"
            label="Đổi trạng thái"
            variant="primary"
            onClick={() => {
              setShowDetailModal(false);
              handleOpenStatusModal(selectedDriver);
            }} />
          
            </div>
        }>
        
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
          ["Tên đầy đủ", selectedDriver.fullName],
          ["Email", selectedDriver.email],
          ["Số điện thoại", selectedDriver.phone],
          ["Vai trò", selectedDriver.role || "driver"]].
          map(([label, value]) =>
          <div key={label} className="rounded-lg bg-surface-container-low p-4">
                <p className="text-sm text-on-surface-variant">{label}</p>
                <p className="mt-1 font-bold text-on-surface">{value || "—"}</p>
              </div>
          )}
          </div>
          <div className="mt-4 rounded-lg bg-surface-container-low p-4">
            <p className="text-sm text-on-surface-variant">Trạng thái hiện tại</p>
            <div className="mt-2">
              <StatusBadge tone={statusTone[selectedDriver.status] || "slate"}>
                {statusLabel[selectedDriver.status] || selectedDriver.status || "—"}
              </StatusBadge>
            </div>
          </div>
        </ModalShell>
      }

      {showStatusModal && selectedDriver &&
      <ModalShell
        title="Đổi trạng thái tài xế"
        subtitle={selectedDriver.fullName}
        onClose={() => setShowStatusModal(false)}
        footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={() => setShowStatusModal(false)} disabled={statusLoading}>Hủy</SecondaryButton>
              <PrimaryButton onClick={handleSaveStatus} disabled={statusLoading} icon="save">
                {statusLoading ? "Đang lưu..." : "Lưu trạng thái"}
              </PrimaryButton>
            </div>
        }>
        
          <Field label="Trạng thái tài khoản">
            <SelectControl value={statusForm} onChange={(e) => setStatusForm(e.target.value)}>
              <option value="active">Hoạt động</option>
              <option value="inactive">Không hoạt động</option>
              <option value="banned">Bị chặn</option>
            </SelectControl>
          </Field>
        </ModalShell>
      }
    </CompanyPageShell>);

}