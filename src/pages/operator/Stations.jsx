import React, { useEffect, useMemo, useState } from "react";
import { createStation, getStations } from "../../api/operator";
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
  SearchInput,
  SecondaryButton,
  StatCard,
  ToolbarCard,
  inputClass,
} from "./OperatorUI";

const emptyForm = {
  address: "",
  city: "",
};

export default function Stations() {
  const { addToast } = useToast();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await getStations({ limit: 100 });
      setStations(Array.isArray(response.data?.stations) ? response.data.stations : []);
      setError("");
    } catch (err) {
      console.error("Lỗi tải trạm:", err);
      setError("Không thể tải danh sách trạm.");
      addToast({ type: "error", title: "Không tải được trạm" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredStations = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return stations;

    return stations.filter((station) =>
      [station.address, station.city]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [stations, searchTerm]);

  const stats = useMemo(() => {
    const cityCount = new Set(stations.map((station) => station.city).filter(Boolean)).size;

    return [
      { icon: "location_on", label: "Tổng trạm", value: stations.length, tone: "primary" },
      { icon: "location_city", label: "Thành phố", value: cityCount, tone: "blue" },
    ];
  }, [stations]);

  const closeModal = () => {
    setShowModal(false);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    if (!formData.address.trim() || !formData.city.trim()) {
      addToast({ type: "warning", title: "Thiếu địa chỉ hoặc thành phố" });
      return;
    }

    try {
      await createStation({
        address: formData.address.trim(),
        city: formData.city.trim(),
      });
      addToast({ type: "success", title: "Tạo trạm thành công" });
      closeModal();
      fetchStations();
    } catch (err) {
      console.error("Lỗi tạo trạm:", err);
      addToast({
        type: "error",
        title: "Không tạo được trạm",
        message: err.response?.data?.message || "Vui lòng kiểm tra địa chỉ và thành phố.",
      });
    }
  };

  return (
    <OperatorPageShell
      eyebrow="Stations"
      title="Quản lý trạm"
      description="Tạo trạm đón trả và tra cứu trạm theo địa chỉ hoặc thành phố."
      actions={<IconButton icon="add" label="Thêm trạm" variant="primary" onClick={() => setShowModal(true)} />}
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <ToolbarCard>
        <SearchInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo địa chỉ hoặc thành phố"
        />
      </ToolbarCard>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : filteredStations.length === 0 ? (
        <EmptyState icon="pin_drop" title="Không tìm thấy trạm" description="Thử đổi từ khóa tìm kiếm hoặc thêm trạm mới." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-outline-variant/30 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Địa chỉ</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Thành phố</th>
                  <th className="px-5 py-3 text-left font-bold text-on-surface-variant">Công ty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {filteredStations.map((station) => (
                  <tr key={station.id} className="hover:bg-surface-container-low/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-on-surface">{station.address || "—"}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">ID: {station.id}</p>
                    </td>
                    <td className="px-5 py-4 font-medium text-on-surface">{station.city || "—"}</td>
                    <td className="px-5 py-4 text-on-surface-variant">#{station.companyId || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <ModalShell
          title="Thêm trạm mới"
          subtitle="Thông tin trạm đón trả."
          onClose={closeModal}
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryButton onClick={closeModal}>Hủy</SecondaryButton>
              <PrimaryButton icon="add_location" onClick={handleSave}>Tạo trạm</PrimaryButton>
            </div>
          }
        >
          <div className="space-y-4">
            <Field label="Địa chỉ">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData((current) => ({ ...current, address: e.target.value }))}
                className={inputClass}
                placeholder="Quốc Lộ 14"
              />
            </Field>
            <Field label="Thành phố">
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData((current) => ({ ...current, city: e.target.value }))}
                className={inputClass}
                placeholder="Đắk Lắk"
              />
            </Field>
          </div>
        </ModalShell>
      )}
    </OperatorPageShell>
  );
}
