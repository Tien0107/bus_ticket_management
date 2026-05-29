import React, { useState, useEffect } from "react";
import { getPickupPoints, getDropoffPoints, prepareTrip, getTripSeats, getTripScheduleRatings } from "../../api/customer";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../context/ToastContext";

const getApiMessage = (err, fallback) => err.response?.data?.message || err.message || fallback;

export default function BookingSeatStep({
  bookingData,
  setBookingData,
  onNext,
  isRoundTrip,
  setIsRoundTrip,
  bookingPhase,
  setBookingPhase,
  returnBookingData,
  setReturnBookingData
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seatError, setSeatError] = useState("");
  const { addToast } = useToast();

  const handleNextClick = async () => {
    setIsSubmitting(true);
    await onNext();
    setIsSubmitting(false);
  };

  const [pickups, setPickups] = useState([]);
  const [dropoffs, setDropoffs] = useState([]);
  const [seats, setSeats] = useState([]);
  const [companyRating, setCompanyRating] = useState("5.0");


  const schedule = location.state?.schedule || {};
  const companyName = schedule.company?.name || schedule.name || "Nhà xe BusGo";
  const departureTime = schedule.departureTime ? schedule.departureTime.slice(0, 5) : "--:--";


  let arrivalTime = "--:--";
  if (schedule.departureTime && schedule.durationMinutes) {
    let [h, m] = schedule.departureTime.split(":").map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      let d = new Date();d.setHours(h);d.setMinutes(m + schedule.durationMinutes);
      arrivalTime = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
  }

  const durationStr = schedule.durationMinutes ? `${Math.floor(schedule.durationMinutes / 60)}h ${schedule.durationMinutes % 60}m` : "Di chuyển";


  useEffect(() => {
    let active = true;
    const fetchRating = async () => {
      const compId = bookingData.companyId || schedule.companyId || schedule.company?.id;
      if (!compId) return;
      try {
        const res = await getTripScheduleRatings({ companyId: compId, limit: 100 });
        if (!active) return;
        const comments = res.data?.comments || [];
        if (comments.length > 0) {
          let sum = 0;
          comments.forEach((c) => sum += c.rating || 5);
          setCompanyRating((sum / comments.length).toFixed(1));
        } else {
          setCompanyRating("5.0");
        }
      } catch (err) {
        console.error("Lỗi lấy rating:", err);
      }
    };
    fetchRating();
    return () => {active = false;};
  }, [bookingData.companyId, schedule]);


  useEffect(() => {
    let active = true;
    const fetchStep1 = async () => {
      try {
        setLoading(true);
        setSeatError("");
        if (!bookingData.companyId || !bookingData.date) {
          addToast("Thiếu định danh chuyến đi. Bạn sẽ được chuyển về trang chủ.", "error");
          navigate("/");
          return;
        }

        let realTripId = bookingData.tripId;
        if (!realTripId) {
          const prepareRes = await prepareTrip({
            scheduleId: Number(bookingData.scheduleId),
            companyId: Number(bookingData.companyId),
            departureDate: bookingData.date
          });
          const preparedData = prepareRes.data?.data || prepareRes.data;
          realTripId = preparedData?.id || prepareRes.id;
        }

        const pickupRes = await getPickupPoints(bookingData.scheduleId);
        if (!active) return;

        const pickData = pickupRes.data?.tripStops || pickupRes.data || [];
        setPickups(pickData);

        setBookingData((prev) => {
          let nextState = { ...prev, tripId: realTripId };
          if (pickData.length > 0 && !prev.pickupId) {
            nextState.pickupId = pickData[0].stationId;
            nextState.pickupOrder = pickData[0].stopOrder;
          }
          return nextState;
        });
      } catch (err) {
        console.error("Lỗi API Step 1:", err);
        if (active) {
          setPickups([]);
          setDropoffs([]);
          setSeats([]);
          setLoadingSeats(false);
          setSeatError(getApiMessage(err, "Không thể chuẩn bị chuyến đi để chọn ghế."));
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchStep1();
    return () => {active = false;};
  }, [bookingData.scheduleId, bookingData.companyId, bookingData.date]);


  useEffect(() => {
    let active = true;
    const fetchStep2 = async () => {
      if (!bookingData.pickupId || typeof bookingData.pickupOrder !== 'number') {
        if (active) setDropoffs([]);
        return;
      }
      try {
        const dropoffRes = await getDropoffPoints(bookingData.scheduleId, bookingData.pickupId, bookingData.pickupOrder);
        if (!active) return;
        const dropData = dropoffRes.data?.tripStops || dropoffRes.data || [];
        setDropoffs(dropData);

        setBookingData((prev) => {
          let nextState = { ...prev };
          if (dropData.length > 0) {
            const d = dropData[dropData.length - 1];
            nextState.dropoffId = d.stationId;
            nextState.dropoffOrder = d.stopOrder;
            nextState.unitPrice = d.price || 0;
          } else {
            nextState.dropoffId = null;
            nextState.dropoffOrder = null;
            nextState.unitPrice = 0;
          }
          return nextState;
        });
      } catch (err) {
        console.error("Lỗi API lấy Dropoff:", err);
      }
    };
    fetchStep2();
    return () => {active = false;};
  }, [bookingData.scheduleId, bookingData.pickupId, bookingData.pickupOrder]);


  useEffect(() => {
    let active = true;
    const fetchSeats = async () => {
      if (!bookingData.tripId || typeof bookingData.pickupOrder !== 'number' || typeof bookingData.dropoffOrder !== 'number') {
        if (active) setLoadingSeats(false);
        return;
      }
      try {
        setLoadingSeats(true);
        setSeatError("");
        const seatsRes = await getTripSeats(bookingData.tripId, bookingData.pickupOrder, bookingData.dropoffOrder);
        if (!active) {console.log("Aborted effect");return;}
        const seatData = seatsRes.data?.seats || seatsRes.data || [];
        setSeats(seatData);
      } catch (err) {
        console.error("Lỗi API lấy sơ đồ ghế:", err);
        if (active) {
          setSeats([]);
          setSeatError("Không thể tải sơ đồ ghế: " + getApiMessage(err, "Vui lòng thử lại sau."));
        }
      } finally {
        if (active) setLoadingSeats(false);
      }
    };
    fetchSeats();
    return () => {active = false;};
  }, [bookingData.tripId, bookingData.pickupOrder, bookingData.dropoffOrder]);

  const handleSeatClick = (seat) => {
    if (seat.status === "booked") return;
    setBookingData((prev) => {
      const isSelected = prev.selectedSeats.some((s) => s.seatNumber === seat.seatNumber);

      let newSeats;
      if (isSelected) {

        newSeats = [];
      } else {

        newSeats = [{ id: seat.id, seatNumber: seat.seatNumber }];
      }

      return { ...prev, selectedSeats: newSeats, totalPrice: newSeats.length * (prev.unitPrice || 0) };
    });
  };

  const handlePickupChange = (p) => {
    setBookingData((d) => ({ ...d, pickupId: p.stationId, pickupOrder: p.stopOrder, selectedSeats: [], totalPrice: 0 }));
  };

  const handleDropoffChange = (d) => {
    setBookingData((prev) => ({ ...prev, dropoffId: d.stationId, dropoffOrder: d.stopOrder, unitPrice: d.price || 0, selectedSeats: [], totalPrice: 0 }));
  };

  const isFloor2 = (seat) => {
    if (!seat || !seat.type) return false;
    const typeStr = String(seat.type).toLowerCase();
    return typeStr.includes("2") || typeStr.includes("upper") || typeStr.includes("t2") || typeStr.includes("trên");
  };

  const floor1Seats = seats.filter((s) => !isFloor2(s));
  const floor2Seats = seats.filter((s) => isFloor2(s));

  const getSeatLabel = (seat) => seat.seatNumber || seat.name || "?";
  const isSeatBooked = (seat) => seat.status === "booked";

  const renderSleeperSeat = (seat) => {
    const isSelected = bookingData.selectedSeats.some((s) => s.seatNumber === seat.seatNumber);
    const isBooked = isSeatBooked(seat);
    const stateClass = isBooked ?
    "cursor-not-allowed border-outline-variant/25 bg-surface-container-high/70 text-on-surface-variant/35 shadow-none" :
    isSelected ?
    "border-primary bg-primary/5 text-primary shadow-[0_14px_30px_rgba(0,110,28,0.16)] ring-4 ring-primary/10" :
    "border-outline-variant/45 bg-white text-on-surface shadow-[0_8px_20px_rgba(26,28,28,0.06)] hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_14px_28px_rgba(26,28,28,0.10)]";
    const pillowClass = isBooked ?
    "border-outline-variant/15 bg-white/35" :
    isSelected ?
    "border-primary/25 bg-white" :
    "border-outline-variant/35 bg-surface-container-lowest";
    const lineClass = isSelected ? "bg-primary/20" : isBooked ? "bg-outline-variant/20" : "bg-outline-variant/25";

    return (
      <button
        key={seat.id || getSeatLabel(seat)}
        type="button"
        className={`group relative flex h-[82px] w-[62px] shrink-0 items-end justify-center rounded-[18px] border pb-3 text-sm font-extrabold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${stateClass}`}
        disabled={isBooked}
        onClick={() => handleSeatClick(seat)}
        aria-pressed={isSelected}
        title={`Ghế ${getSeatLabel(seat)}`}>
        
        <span className={`absolute left-2 right-2 top-2 h-5 rounded-xl border ${pillowClass}`} />
        <span className={`absolute left-3 right-3 top-10 h-px ${lineClass}`} />
        <span className="relative z-10 leading-none">{getSeatLabel(seat)}</span>
      </button>);

  };

  const renderSeatDeck = (title, deckSeats, tone = "primary") => {
    const titleClass = tone === "secondary" ?
    "border-secondary/15 bg-secondary/5 text-secondary" :
    "border-primary/15 bg-primary/5 text-primary";

    return (
      <div className="rounded-3xl border border-outline-variant/25 bg-white p-4 shadow-[0_18px_42px_rgba(26,28,28,0.06)]">
        <div className="mb-5 flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-extrabold ${titleClass}`}>
            {title}
          </span>
          <span className="text-xs font-bold text-on-surface-variant/70">{deckSeats.length} ghế</span>
        </div>
        {deckSeats.length === 0 ?
        <p className="rounded-2xl bg-surface-container-low px-4 py-6 text-center text-sm font-medium text-on-surface-variant">
            Không có ghế tầng này
          </p> :

        <div className="grid grid-cols-2 justify-items-center gap-x-7 gap-y-6 rounded-2xl bg-surface-container-low px-4 py-5">
            {deckSeats.map(renderSleeperSeat)}
          </div>
        }
      </div>);

  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
         <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
         <p className="text-on-surface-variant font-medium">Đang gọi Sơ đồ xe và Điểm dừng...</p>
       </div>);

  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-on-surface-variant mb-8">
        <span className="hover:text-primary cursor-pointer" onClick={() => navigate("/")}>Trang chủ</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
        <span className="font-semibold text-on-surface">Chi tiết chuyến {bookingPhase === 'returnSeats' ? '(Chiều về)' : '(Chiều đi)'}</span>
      </nav>

      {bookingPhase === 'returnSeats' &&
      <div className="bg-secondary/10 border border-secondary/20 p-4 rounded-xl mb-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-secondary">info</span>
          <div>
            <p className="font-bold text-secondary">Đang chọn ghế chuyến về</p>
            <p className="text-sm text-on-surface-variant">Vui lòng chọn 1 ghế cho chuyến về của bạn.</p>
          </div>
        </div>
      }

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-24">
        {}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-surface-container">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex items-center gap-4">
                {schedule.logoUrl ?
                <img src={schedule.logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-contain bg-surface-container-low border border-surface-container p-2" /> :

                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center p-2 text-primary">
                    <span className="material-symbols-outlined text-3xl">directions_bus</span>
                  </div>
                }
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-on-surface">{companyName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-0.5 text-[#FFB800]">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="font-bold text-on-surface">{companyRating}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-primary-container/10 px-4 py-2 rounded-full">
                <span className="text-primary font-bold text-sm">Limousine Option</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 mb-10">
              <div className="text-left">
                <p className="text-3xl font-extrabold text-on-surface tracking-tight">{departureTime}</p>
                <p className="font-semibold text-on-surface mt-1">{schedule.fromLocation || "Sài Gòn"}</p>
              </div>
              <div className="flex min-w-[180px] flex-col items-center gap-2 px-4">
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-on-surface shadow-sm ring-1 ring-outline-variant/30">
                  {durationStr}
                </span>
                <div className="relative flex w-44 items-center justify-between">
                  <div className="absolute left-4 right-4 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary/65 via-outline-variant/70 to-secondary/65"></div>
                  <div className="relative z-10 h-4 w-4 rounded-full border-2 border-white bg-primary shadow-[0_0_0_5px_rgba(0,110,28,0.12)]"></div>
                  <div className="relative z-20 flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 bg-white text-primary shadow-[0_10px_24px_rgba(26,28,28,0.12)]">
                    <span className="material-symbols-outlined text-[26px]">directions_bus</span>
                  </div>
                  <div className="relative z-10 h-4 w-4 rounded-full border-2 border-white bg-secondary shadow-[0_0_0_5px_rgba(159,66,0,0.12)]"></div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold text-on-surface tracking-tight">{arrivalTime}</p>
                <p className="font-semibold text-on-surface mt-1">{schedule.toLocation || "Đà Lạt"}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-6 border-t border-surface-container">
              {['wifi', 'ac_unit', 'usb', 'local_drink'].map((icon, i) =>
              <div key={i} className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-low rounded-xl p-6 border border-surface-container/50">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">location_on</span>
                Điểm đón
              </h3>
              {pickups.length === 0 ? <p className="text-sm text-on-surface-variant italic">Không có điểm đón</p> :
              <ul className="space-y-4">
                  {pickups.map((p) =>
                <li key={p.stationId} className="flex gap-3 cursor-pointer items-start" onClick={() => handlePickupChange(p)}>
                      <input type="radio" checked={bookingData.pickupId === p.stationId} readOnly className="mt-1 w-4 h-4 text-primary" />
                      <div>
                        <p className="font-semibold text-on-surface leading-tight mt-0.5">{p.address}</p>
                        <p className="text-sm text-on-surface-variant mt-1 italic">{p.city}</p>
                      </div>
                    </li>
                )}
                </ul>
              }
            </div>
            
            <div className="bg-surface-container-low rounded-xl p-6 border border-surface-container/50">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">flag</span>
                Điểm trả
              </h3>
              {dropoffs.length === 0 ? <p className="text-sm text-on-surface-variant italic">Không có điểm trả</p> :
              <ul className="space-y-4">
                  {dropoffs.map((d) =>
                <li key={d.stationId} className="flex gap-3 cursor-pointer items-start" onClick={() => handleDropoffChange(d)}>
                        <input type="radio" checked={bookingData.dropoffId === d.stationId} readOnly className="mt-1 w-4 h-4 text-secondary" />
                        <div className="flex-1">
                          <p className="font-semibold text-on-surface leading-tight mt-0.5">{d.address}</p>
                          <p className="text-sm text-on-surface-variant mt-1 italic">{d.city} {d.price ? `- ${d.price.toLocaleString()}đ` : ''}</p>
                        </div>
                      </li>
                )}
                </ul>
              }
            </div>
          </div>
        </div>

        {}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
            <div className="bg-surface-container-low px-6 py-4 flex justify-between items-center border-b border-surface-container">
              <h2 className="font-bold text-xl">Chọn ghế</h2>
              <span className="text-xs text-on-surface-variant font-bold bg-surface-container px-3 py-1.5 rounded-full">
                {floor2Seats.length > 0 ? "Sơ đồ 2 tầng" : "Sơ đồ 1 tầng"}
              </span>
            </div>
            
            <div className="p-8 relative min-h-[300px]">
              {loadingSeats ?
              <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                 </div> :
              null}

              {seatError &&
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined mt-0.5 text-[22px]">error</span>
                    <div>
                      <p className="font-extrabold text-red-800">Không thể chọn ghế</p>
                      <p className="mt-1 text-sm font-medium leading-6">{seatError}</p>
                    </div>
                  </div>
                </div>
              }

              {!seatError &&
              <>
              <div className="mb-6 flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-outline-variant/20 bg-white px-4 py-3 shadow-[0_10px_28px_rgba(26,28,28,0.05)]">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-7 rounded-xl border border-outline-variant/45 bg-white shadow-sm"></div>
                  <span className="text-xs font-semibold text-on-surface-variant">Trống</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-9 w-7 rounded-xl border border-primary bg-primary/5 shadow-sm ring-2 ring-primary/10"></div>
                  <span className="text-xs font-semibold text-on-surface-variant">Đang chọn</span>
                </div>
              </div>

              {seats.length === 0 && !loadingSeats ?
                <p className="text-center text-sm text-on-surface-variant py-8 bg-surface-container-low rounded-2xl">
                  Sơ đồ trống (API chưa trả ghế)
                </p> :
                floor2Seats.length > 0 ?
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {renderSeatDeck("Tầng 1", floor1Seats)}
                  {renderSeatDeck("Tầng 2", floor2Seats, "secondary")}
                </div> :

                <div className="mx-auto max-w-sm">
                  {renderSeatDeck("Tầng 1", floor1Seats)}
                </div>
                }
                </>
              }
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-surface-container px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="hidden md:block">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Ghế đang chọn</p>
              <p className="font-bold text-on-surface">{bookingData.selectedSeats.length > 0 ? bookingData.selectedSeats.map((s) => s.seatNumber).join(", ") : "Chưa chọn ghế"}</p>
            </div>
            <div className="h-10 w-px bg-surface-container mx-2 hidden sm:block"></div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Tổng cộng</p>
              <p className="text-2xl font-extrabold text-secondary leading-none">{bookingData.totalPrice.toLocaleString()}đ</p>
            </div>
          </div>
          <div className="flex gap-4">
            {bookingPhase === "outbound" && !isRoundTrip &&
            <button
              disabled={bookingData.selectedSeats.length === 0 || !bookingData.pickupId || !bookingData.dropoffId}
              onClick={() => {
                setIsRoundTrip(true);
                setBookingPhase("returnSelection");
              }}
              className="bg-secondary text-white px-6 py-3.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center gap-2">
              
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                Khứ hồi
              </button>
            }
            <button
              disabled={bookingData.selectedSeats.length === 0 || !bookingData.pickupId || !bookingData.dropoffId || isSubmitting}
              onClick={handleNextClick}
              className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-3.5 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center gap-2">
              
              {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {isSubmitting ? "Đang giữ chỗ..." : "Tiếp tục"}
            </button>
          </div>
        </div>
      </div>
    </>);

}