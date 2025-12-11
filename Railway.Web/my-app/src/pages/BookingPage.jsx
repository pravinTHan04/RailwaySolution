import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { jwtDecode } from "jwt-decode";

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const scheduleId = searchParams.get("scheduleId");
  const fromStopOrder = Number(searchParams.get("fromOrder"));
  const toStopOrder = Number(searchParams.get("toOrder"));

  const [carriages, setCarriages] = useState([]);
  const [activeCarriage, setActiveCarriage] = useState(null);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [requiredCount, setRequiredCount] = useState(null);

  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  const [suggesting, setSuggesting] = useState(false);
  const [suggestedSeatIds, setSuggestedSeatIds] = useState([]);
  const [suggestionInfo, setSuggestionInfo] = useState(null);

  // ========== ID Helpers ==========
  function getUserId() {
    const token = localStorage.getItem("authToken");
    if (!token) return null;

    const decoded = jwtDecode(token);
    return decoded.sub;
  }

  function getSeatLockToken() {
    const userId = getUserId();
    if (userId) return userId;

    let guestId = localStorage.getItem("guestId");
    if (!guestId) {
      guestId = "guest_" + crypto.randomUUID();
      localStorage.setItem("guestId", guestId);
    }
    return guestId;
  }

  // ========== Load Seats ==========
  useEffect(() => {
    if (scheduleId) loadSeats();
  }, [scheduleId]);

  async function loadSeats() {
    try {
      const res = await api.get("/api/seats/available", {
        params: { scheduleId, fromStopOrder, toStopOrder },
      });

      setCarriages(res.data);

      if (!activeCarriage && res.data.length > 0) {
        setActiveCarriage(res.data[0].carriage);
      }

      setLoading(false);
    } catch (err) {
      console.error("Seat API Error:", err);
    }
  }

  // ========== Countdown Timer ==========
  useEffect(() => {
    if (!timerActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetSelection();
          alert("⏳ Seat reservation expired. Please select again.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive]);

  // ========== Suggest Seats ==========
  async function suggestSeats() {
    if (!requiredCount) return alert("Select number of seats first.");

    setSuggesting(true);
    setSuggestionInfo(null);

    try {
      const res = await api.post("/api/booking/suggest-seats", {
        scheduleId,
        fromStopOrder,
        toStopOrder,
        seatCount: requiredCount,
      });

      const data = res.data;

      if (!data?.seats?.length) {
        alert("No suggestions available.");
        return;
      }

      const flatSeats = carriages.flatMap((c) => c.seats);
      const mapped = data.seats
        .map((s) => flatSeats.find((x) => x.seatId === s.seatId))
        .filter(Boolean);

      setSuggestedSeatIds(mapped.map((s) => s.seatId));
      setSuggestionInfo({
        reason: data.reason,
        exactMatch: data.exactMatch,
      });
    } catch (err) {
      console.error("Seat suggestion error:", err);
      alert("Unable to fetch suggestion.");
    } finally {
      setSuggesting(false);
    }
  }

  // ========== Select Seat ==========
  function toggleSeat(seat) {
    if (locked) return;
    if (seat.status !== "available") return;

    const exists = selectedSeats.some((s) => s.seatId === seat.seatId);

    if (exists) {
      setSelectedSeats((prev) => prev.filter((s) => s.seatId !== seat.seatId));
    } else if (selectedSeats.length < requiredCount) {
      setSelectedSeats((prev) => [...prev, seat]);
    }
  }

  // ========== Lock ==========
  async function lockSeats() {
    const seatIds = selectedSeats.map((s) => s.seatId);

    try {
      await api.post("/api/seats/lock", {
        scheduleId,
        seatIds,
        fromStopOrder,
        toStopOrder,
        tempUserToken: getSeatLockToken(),
      });

      setLocked(true);
      setTimerActive(true);
      loadSeats();
    } catch {
      alert("Could not lock seats.");
    }
  }

  // ========== Unlock ==========
  async function cancelLockedSeats() {
    const seatIds = selectedSeats.map((s) => s.seatId);

    try {
      await api.post("/api/seats/unlock", {
        scheduleId,
        seatIds,
      });

      resetSelection();
      loadSeats();
    } catch {
      alert("Failed to unlock seats.");
    }
  }

  // ========== Create Booking ==========
  async function continueToPassengerDetails() {
    const seatIds = selectedSeats.map((s) => s.seatId);

    try {
      const res = await api.post("/api/booking/create", {
        scheduleId,
        seatIds,
        fromStopOrder,
        toStopOrder,
      });

      const bookingId = res.data.id;
      if (!bookingId) return alert("Booking failed.");

      navigate(`/passenger?bookingId=${bookingId}&count=${selectedSeats.length}`);
    } catch (err) {
      alert("Booking failed.");
    }
  }

  // ========== Reset ==========
  function resetSelection() {
    setSelectedSeats([]);
    setLocked(false);
    setTimerActive(false);
    setTimeLeft(300);
  }

  // ========== Render ==========
  if (!scheduleId) {
    return <p className="p-6 text-red-500">No train selected.</p>;
  }

  if (loading) return <p className="p-6">Loading seats...</p>;

  const activeCar = carriages.find((c) => c.carriage === activeCarriage);

  // Organize seats into rows + A/B/C/D groups
  const rows = {};

  activeCar?.seats.forEach((seat) => {
    const letter = seat.seatNumber[0];
    const row = parseInt(seat.seatNumber.slice(1));

    if (!rows[row]) rows[row] = {};
    rows[row][letter] = seat;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">

      {/* HEADER */}
      <div className="mt-2">
        <h1 className="text-3xl font-semibold text-gray-900">Seat Selection</h1>
        <p className="text-gray-500">Choose your seats and lock them.</p>
      </div>

      {/* SEAT COUNT CARD */}
      {!requiredCount && (
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900">Number of Seats</h2>
          <select
            className="mt-3 w-40 p-3 rounded-xl bg-gray-50 border text-gray-800"
            onChange={(e) => setRequiredCount(Number(e.target.value))}
          >
            <option value="">Select…</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}

      {requiredCount && (
        <>
          {/* TIMER */}
          {timerActive && (
            <div className="bg-yellow-100 border border-yellow-200 rounded-xl p-4 text-center font-semibold">
              ⏳ Reserved: {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}

          {/* CARRIAGE SELECTOR */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Carriage</h2>

            <div className="flex gap-2 flex-wrap">
              {carriages.map((c) => (
                <button
                  key={c.carriage}
                  onClick={() => setActiveCarriage(c.carriage)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    activeCarriage === c.carriage
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  Carriage {c.carriage}
                </button>
              ))}
            </div>
          </div>

          {/* SEAT MAP */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Seats</h2>

            <div className="flex flex-col md:flex-row gap-6">

              {/* GRID */}
              <div className="flex-1">
                {Object.keys(rows)
                  .sort((a, b) => a - b)
                  .map((row) => (
                    <div key={row} className="grid grid-cols-4 gap-3 mb-3">
                      {["A", "B", "C", "D"].map((letter) => {
                        const seat = rows[row][letter];
                        if (!seat) return <div key={letter}></div>;

                        const isSelected = selectedSeats.some(
                          (s) => s.seatId === seat.seatId
                        );
                        const isSuggested = suggestedSeatIds.includes(seat.seatId);

                        let className = "p-3 rounded-xl border text-center text-sm";

                        if (seat.status === "booked") {
                          className += " bg-red-500 text-white";
                        } else if (seat.status === "held") {
                          className += " bg-gray-400 text-white";
                        } else if (isSelected) {
                          className += " bg-black text-white";
                        } else if (isSuggested) {
                          className += " bg-green-100 border-green-500";
                        } else {
                          className += " bg-gray-50 hover:bg-gray-100";
                        }

                        return (
                          <button
                            key={seat.seatId}
                            onClick={() => toggleSeat(seat)}
                            disabled={locked || seat.status !== "available"}
                            className={className}
                          >
                            {seat.seatNumber}
                          </button>
                        );
                      })}
                    </div>
                  ))}
              </div>

              {/* SUMMARY CARD */}
              <div className="w-full md:w-60 bg-gray-50 rounded-xl p-4 border space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Your Seats</h3>

                {selectedSeats.length === 0 ? (
                  <p className="text-gray-500 text-sm">None selected.</p>
                ) : (
                  selectedSeats.map((s) => (
                    <p key={s.seatId} className="font-medium text-gray-800">
                      • {s.seatNumber}
                    </p>
                  ))
                )}

                <p className="text-gray-700 font-medium pt-2 border-t">
                  {selectedSeats.length} / {requiredCount}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            {/* Left: Suggest */}
            <div>
              <button
                onClick={suggestSeats}
                disabled={suggesting || locked}
                className="px-5 py-3 rounded-xl bg-purple-600 text-white shadow hover:bg-purple-700 disabled:bg-gray-400"
              >
                {suggesting ? "Suggesting…" : "Suggest Best Seats"}
              </button>

              {suggestionInfo && (
                <p className="text-sm text-gray-600 mt-1">
                  {suggestionInfo.exactMatch ? "✅" : "⚠️"} {suggestionInfo.reason}
                </p>
              )}
            </div>

            {/* Right: Lock / Continue */}
            <div className="flex gap-3">
              {!locked ? (
                <button
                  onClick={lockSeats}
                  disabled={selectedSeats.length !== requiredCount}
                  className="px-6 py-3 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 disabled:bg-gray-400"
                >
                  Lock Seats
                </button>
              ) : (
                <>
                  <button
                    onClick={cancelLockedSeats}
                    className="px-5 py-3 bg-red-500 text-white rounded-xl shadow hover:bg-red-600"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={continueToPassengerDetails}
                    className="px-6 py-3 bg-black text-white rounded-xl shadow hover:bg-gray-900"
                  >
                    Continue →
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
