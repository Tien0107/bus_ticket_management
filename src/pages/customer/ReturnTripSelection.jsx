import React, { useState, useEffect } from "react";
import { getTripSchedules } from "../../api/customer";
import { getLocalTodayInputValue as getLocalTodayStr } from "../../utils/date";

const getTodayStr = getLocalTodayStr;

const normalizeDate = (d) => {
  if (!d) return "";
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // try parse other formats (e.g. "5-6", "05/06/2025", "05-06-2025")
  // attempt DD-MM or DD/MM with current year as fallback for test data
  const m = s.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/);
  if (m) {
    let [, dd, mm, yy] = m;
    const now = new Date();
    const y = yy ? (yy.length === 2 ? 2000 + parseInt(yy,10) : parseInt(yy,10)) : now.getFullYear();
    const mmPad = String(mm).padStart(2, "0");
    const ddPad = String(dd).padStart(2, "0");
    const candidate = `${y}-${mmPad}-${ddPad}`;
    // validate it parses to a real date
    const test = new Date(candidate + "T00:00:00");
    if (!isNaN(test.getTime())) return candidate;
  }
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

const getDatePlusDays = (dateStr, days) => {
  const norm = normalizeDate(dateStr);
  if (!norm) return getTodayStr();
  // Safe calendar arithmetic using UTC to avoid local timezone off-by-one bugs
  const [year, month, day] = norm.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export default function ReturnTripSelection({ outboundData, setReturnBookingData, setBookingPhase, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);

  const todayStr = getTodayStr();
  const outboundDate = normalizeDate(outboundData.date) || todayStr;
  const isOutboundToday = outboundDate === todayStr;
  // Luôn đặt ngày về tối thiểu là ngày sau ngày đi (không cho phép cùng ngày với khứ hồi)
  const minReturnDate = getDatePlusDays(outboundDate, 1);

  const [date, setDate] = useState(() => {
    // Optimistic init with bump if needed (based on props at mount time)
    let initial = normalizeDate(outboundData.returnDate) || normalizeDate(outboundData.date) || "";
    if (!initial || initial < minReturnDate) {
      initial = minReturnDate;
    }
    return initial;
  });

  // Safety net: force the return date to jump to minReturnDate if it's not already after mount or if props update
  // This ensures it "nhảy" even if initializer didn't catch the right value for some reason (e.g. timing, state shape, format)
  useEffect(() => {
    const minD = getDatePlusDays(outboundData.date || todayStr, 1);
    setDate((prev) => {
      const p = normalizeDate(prev) || "";
      if (!p || p < minD) {
        return minD;
      }
      return prev;
    });
  }, [outboundData.date, outboundData.returnDate]);


  const outboundSchedule = outboundData.schedule || {};
  const returnFrom = outboundSchedule.toLocation || "Điểm đến";
  const returnTo = outboundSchedule.fromLocation || "Điểm xuất phát";

  useEffect(() => {
    if (!date) return;

    let active = true;
    const fetchSchedules = async () => {
      try {
        setLoading(true);

        const res = await getTripSchedules({
          from: returnFrom,
          to: returnTo,
          date: date,
          orderBy: "asc"
        });

        if (active) {
          const trips = res.data?.trip || res.data?.tripSchedules || res.data?.data || res.data || [];
          const tripArray = Array.isArray(trips) ? trips : [];
          setSchedules(tripArray);
        }
      } catch (err) {
        console.error("Lỗi lấy chuyến khứ hồi:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchSchedules();

    return () => {active = false;};
  }, [date, returnFrom, returnTo]);

  const handleSelectSchedule = (schedule) => {
    setReturnBookingData({
      scheduleId: schedule.id,
      companyId: schedule.company?.id || schedule.companyId,
      date: date,
      tripId: null,
      selectedSeats: [],
      pickupId: null,
      dropoffId: null,
      passengerInfo: { name: "", phone: "", email: "", note: "" },
      coupon: null,
      paymentMethod: "vnpay",
      totalPrice: 0,
      schedule: schedule
    });
    setBookingPhase("returnSeats");
  };

  return (
    <div className="bg-surface-container-low rounded-3xl p-8 border border-surface-container shadow-sm mb-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">swap_horiz</span>
            Chọn chuyến chiều về
          </h2>
          <p className="text-on-surface-variant font-medium mt-1">
            Từ <span className="font-bold text-primary">{returnFrom}</span> đến <span className="font-bold text-secondary">{returnTo}</span>
          </p>
        </div>
        <button onClick={onCancel} className="text-error font-bold hover:bg-error/10 px-4 py-2 rounded-xl transition-colors">
          Huỷ khứ hồi
        </button>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Ngày về</label>
        <input
          type="date"
          value={date}
          min={minReturnDate}
          onChange={(e) => {
            const newVal = normalizeDate(e.target.value);
            const minD = minReturnDate;
            setDate(newVal && newVal < minD ? minD : newVal);
          }}
          className="bg-white border border-outline-variant/30 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none font-medium w-full max-w-xs" />
        <p className="mt-1 text-xs font-medium text-on-surface-variant">
          Ngày về tối thiểu là ngày sau ngày khởi hành.
          {isOutboundToday && " (Ngày đi hôm nay → ngày về từ ngày mai)"}
        </p>
      </div>

      {loading ?
      <div className="flex flex-col items-center py-12">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="mt-4 font-medium text-on-surface-variant">Đang tìm chuyến...</p>
        </div> :
      schedules.length === 0 ?
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-outline-variant/50">
          <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">event_busy</span>
          <p className="font-medium text-on-surface-variant">Không tìm thấy chuyến về nào trong ngày này.</p>
          <p className="text-sm text-on-surface-variant">Vui lòng chọn một ngày khác.</p>
        </div> :

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((schedule) => {
          const h = schedule.departureTime ? parseInt(schedule.departureTime.split(":")[0]) : 0;
          const m = schedule.departureTime ? parseInt(schedule.departureTime.split(":")[1]) : 0;
          let arrTime = "--:--";
          if (!isNaN(h) && !isNaN(m) && schedule.durationMinutes) {
            let d = new Date();d.setHours(h);d.setMinutes(m + schedule.durationMinutes);
            arrTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          }

          return (
            <div key={schedule.id} onClick={() => handleSelectSchedule(schedule)} className="bg-white border border-outline-variant/20 hover:border-primary/50 hover:shadow-md cursor-pointer rounded-2xl p-5 transition-all group">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <img src={schedule.logoUrl || "https://placehold.co/100x100"} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-surface-container-low p-1" />
                    <div>
                      <p className="font-bold text-on-surface">{schedule.company?.name || schedule.name || "Nhà xe"}</p>
                      <p className="text-xs text-on-surface-variant font-medium">{schedule.vehicleType || "Limousine"}</p>
                    </div>
                  </div>
                  <p className="font-extrabold text-secondary text-lg">
                    {schedule.price ? schedule.price.toLocaleString() + 'đ' : '---'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <p className="font-bold text-lg text-on-surface">{schedule.departureTime ? schedule.departureTime.slice(0, 5) : "--:--"}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{returnFrom}</p>
                  </div>
                  <div className="flex-1 px-4 flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-on-surface-variant/50">{schedule.durationMinutes ? `${Math.floor(schedule.durationMinutes / 60)}h${schedule.durationMinutes % 60}m` : ''}</span>
                    <div className="w-full h-px bg-outline-variant/30 my-1 relative">
                      <span className="material-symbols-outlined text-sm text-outline-variant absolute left-1/2 -top-2.5 -translate-x-1/2 bg-white px-1 group-hover:text-primary transition-colors">directions_bus</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-on-surface">{arrTime}</p>
                    <p className="text-xs text-on-surface-variant mt-1">{returnTo}</p>
                  </div>
                </div>
              </div>);

        })}
        </div>
      }
    </div>);

}