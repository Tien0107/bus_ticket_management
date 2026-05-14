import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getStoppingPoints, createStoppingPoint, updateStoppingPoint, getTripSchedules, getRoutes } from "../../api/operator";
import { getStations } from "../../api/operator";
import { useToast } from "../../context/ToastContext";
import ActionIconButton from "./ActionIconButton";

export default function StoppingPoints() {
  const { scheduleId } = useParams();
  const location = useLocation();
  const { addToast } = useToast();

  const [stoppingPoints, setStoppingPoints] = useState([]);
  const [stations, setStations] = useState([]);
  const [routeId, setRouteId] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    stationId: "",
    allowPickup: true,
    allowDropoff: true,
    stopOrder: "",
  });

  useEffect(() => {
    // Get companyId from localStorage safely
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};
      const cid = user?.companyId || parseInt(localStorage.getItem("companyId")) || null;
      console.log("👤 Current user companyId:", cid);
      setCompanyId(cid);
    } catch (e) {
      console.warn("⚠️ Error reading companyId from localStorage:", e);
      setCompanyId(null);
    }
  }, []);

  useEffect(() => {
    if (scheduleId) {
      fetchData();
    }
  }, [scheduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pointsRes, stationsRes, schedulesRes, routesRes] = await Promise.all([
        getStoppingPoints(scheduleId),
        getStations({ limit: 100 }),
        getTripSchedules({ limit: 100, orderBy: 'asc' }),
        getRoutes({ limit: 100 }),
      ]);
      setStoppingPoints(pointsRes?.data?.stoppingPoints || []);
      setStations(stationsRes?.data?.stations || []);
      
      // Debug: Log API responses
      console.log("📦 Stopping Points Response:", pointsRes?.data?.stoppingPoints);
      console.log("🏢 Stations Response:", stationsRes?.data?.stations);
      
      // Debug: Log all available stations
      console.log("📋 ALL STATIONS AVAILABLE:");
      console.table(stationsRes?.data?.stations || []);
      
      // Find current schedule
      const currentSchedule = schedulesRes?.data?.trip?.find(s => s.id === parseInt(scheduleId));
      console.log("📅 Current Schedule #" + scheduleId + ":", currentSchedule);
      
      if (currentSchedule) {
        const routes = routesRes?.data?.routes || [];
        console.log("🚌 Available routes:", routes);
        console.log("   Searching for: FROM [" + currentSchedule.fromLocation + "] TO [" + currentSchedule.toLocation + "]");
        
        // Try exact match first
        let matchedRoute = routes.find(route => 
          route.fromLocation === currentSchedule.fromLocation && 
          route.toLocation === currentSchedule.toLocation
        );
        
        // If no exact match, try case-insensitive
        if (!matchedRoute) {
          console.warn("⚠️ No exact match found. Trying case-insensitive...");
          matchedRoute = routes.find(route => 
            route.fromLocation?.toLowerCase() === currentSchedule.fromLocation?.toLowerCase() && 
            route.toLocation?.toLowerCase() === currentSchedule.toLocation?.toLowerCase()
          );
        }
        
        if (matchedRoute) {
          console.log("✅ Matched route ID:", matchedRoute.id, "From:", matchedRoute.fromLocation, "To:", matchedRoute.toLocation);
          setRouteId(matchedRoute.id);
        } else {
          console.error("❌ NO MATCHING ROUTE! Cannot proceed.");
          console.table(routes.map(r => ({ id: r.id, from: r.fromLocation, to: r.toLocation })));
          addToast({
            type: "error",
            title: "Không tìm thấy tuyến phù hợp",
            message: "Hãy tạo tuyến đường tương ứng trước khi thêm điểm dừng.",
          });
          setRouteId(null);
        }
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Không tải được điểm dừng",
        message: "Dữ liệu điểm dừng hoặc trạm chưa thể hiển thị.",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🔍 Form validation - stationId:", formData.stationId, "stopOrder:", formData.stopOrder);
    console.log("📊 Stations available:", stations.length);
    
    try {
      if (!formData.stationId || formData.stopOrder === "") {
        console.warn("⚠️ Form validation failed - missing stationId or stopOrder");
        if (addToast && typeof addToast === "function") {
          addToast({
            type: "warning",
            title: "Thiếu thông tin điểm dừng",
            message: "Chọn trạm và nhập thứ tự dừng trước khi lưu.",
          });
        }
        return;
      }
      
      if (!routeId) {
        console.error("❌ No valid routeId - cannot submit");
        if (addToast && typeof addToast === "function") {
          addToast({
            type: "error",
            title: "Chưa xác định được tuyến",
            message: "Vui lòng kiểm tra lại lịch biểu đang chọn.",
          });
        }
        return;
      }

      const payload = {
        scheduleId: parseInt(scheduleId),
        allowPickup: formData.allowPickup,
        allowDropoff: formData.allowDropoff,
        routeId: routeId,
        stopOrder: parseInt(formData.stopOrder),
        stationId: parseInt(formData.stationId),
      };

      console.log("📤 Final Payload (EXACTLY as per API Spec):", JSON.stringify(payload));
      console.log("   Fields check - scheduleId:", payload.scheduleId, "routeId:", payload.routeId, "stationId:", payload.stationId);
      
      // Debug: Check if stationId exists in stations
      const stationObj = stations.find(s => s.id === parseInt(formData.stationId));
      console.log("🏢 Station object for ID " + formData.stationId + ":", stationObj);
      
      if (!stationObj) {
        console.warn("⚠️ Station ID " + formData.stationId + " NOT FOUND in available stations!");
        console.log("Available station IDs:", stations.map(s => s.id).join(", "));
        if (addToast && typeof addToast === "function") {
          addToast({
            type: "warning",
            title: "Trạm không tồn tại",
            message: "Chọn một trạm khác trong danh sách hiện có.",
          });
        }
        return;
      }
      
      const routeObj = {id: routeId}; // We don't have routes in component scope, but log routeId
      console.log("🛣️ Route ID:", routeId);

      if (editingId) {
        const updateRes = await updateStoppingPoint(scheduleId, editingId, payload);
        console.log("✅ Update Response:", updateRes?.data);
        if (addToast && typeof addToast === "function") {
          addToast({
            type: "success",
            title: "Cập nhật điểm dừng thành công",
          });
        }
      } else {
        const createRes = await createStoppingPoint(scheduleId, payload);
        console.log("✅ Create Response:", createRes?.data);
        if (addToast && typeof addToast === "function") {
          addToast({
            type: "success",
            title: "Thêm điểm dừng thành công",
          });
        }
      }

      fetchData();
      resetForm();
    } catch (error) {
      console.error("❌ Error response:", error?.response);
      console.error("❌ Error data:", error?.response?.data);
      console.error("❌ Error status:", error?.response?.status);
      console.error("❌ Full error:", error);
      if (addToast && typeof addToast === "function") {
        addToast({
          type: "error",
          title: "Không lưu được điểm dừng",
          message: error?.response?.data?.message || "Vui lòng kiểm tra thông tin điểm dừng và thử lại.",
        });
      } else {
        console.error("❌ addToast is not a function:", typeof addToast);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      stationId: "",
      allowPickup: true,
      allowDropoff: true,
      stopOrder: "",
    });
    setEditingId(null);
  };

  const handleEdit = (point) => {
    setEditingId(point.id);
    setFormData({
      stationId: point.stationId,
      allowPickup: point.allowPickup,
      allowDropoff: point.allowDropoff,
      stopOrder: point.stopOrder,
    });
  };

  if (!scheduleId) {
    return (
      <div className="p-6 bg-red-50 rounded-lg">
        <p className="text-red-600">Vui lòng chọn lịch biểu trước</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Quản lý Điểm Dừng</h1>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          {editingId ? "Cập nhật Điểm Dừng" : "Thêm Điểm Dừng Mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trạm</label>
              <select
                value={formData.stationId}
                onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn trạm</option>
                {stations.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.address} - {station.city}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thứ tự Dừng</label>
              <input
                type="number"
                value={formData.stopOrder}
                onChange={(e) => setFormData({ ...formData, stopOrder: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1, 2, 3..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.allowPickup}
                onChange={(e) => setFormData({ ...formData, allowPickup: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Cho phép Đón khách</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.allowDropoff}
                onChange={(e) => setFormData({ ...formData, allowDropoff: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Cho phép Trả khách</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {editingId ? "Cập nhật" : "Thêm"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thứ tự</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Địa chỉ</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thành phố</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Đón</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Trả</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : stoppingPoints.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Chưa có điểm dừng
                </td>
              </tr>
            ) : (
              stoppingPoints.map((point) => (
                <tr key={point.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">{point.stopOrder}</td>
                  <td className="px-6 py-3 text-gray-900">{point.address}</td>
                  <td className="px-6 py-3 text-gray-900">{point.city}</td>
                  <td className="px-6 py-3">
                    <span className={point.allowPickup ? "text-green-600 font-medium" : "text-red-600"}>
                      {point.allowPickup ? "✓" : "✗"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={point.allowDropoff ? "text-green-600 font-medium" : "text-red-600"}>
                      {point.allowDropoff ? "✓" : "✗"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-4">
                      <ActionIconButton
                        icon="edit_square"
                        label="Sửa điểm dừng"
                        onClick={() => handleEdit(point)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
