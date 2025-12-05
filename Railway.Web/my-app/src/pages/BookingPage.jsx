import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const scheduleId = searchParams.get("scheduleId");

  const fromStopOrder = Number(searchParams.get("fromOrder"));
const toStopOrder = Number(searchParams.get("toOrder"));

const [carriages, setCarriages] = useState([]);
const [activeCarriage, setActiveCarriage] = useState(null);

  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [requiredCount, setRequiredCount] = useState(null);
  const [loading, setLoading] = useState(true);

  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [locked, setLocked] = useState(false);

  const [suggesting, setSuggesting] = useState(false);
  const [suggestionInfo, setSuggestionInfo] = useState(null);
  const [suggestedSeatIds, setSuggestedSeatIds] = useState([]);

 

  function getUserToken() {
  // If user logged in and backend stores name in localStorage
  const user = localStorage.getItem("userName");
  if (user) return user;

  // Otherwise ensure persistent guest identity
  let guest = localStorage.getItem("guestId");
  if (!guest) {
    guest = "guest_" + crypto.randomUUID();
    localStorage.setItem("guestId", guest);
  }

  return guest;
}


  useEffect(() => {
    if (scheduleId) fetchSeatAvailability();
  }, [scheduleId]);

  useEffect(() => {
    if (!timerActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          resetSelection();
          alert("⏳ Seat locks expired. Please select again.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive]);

async function fetchSeatAvailability() {
  try {
    const res = await api.get("/api/seats/available", {
      params: { scheduleId, fromStopOrder, toStopOrder },
    });

    setCarriages(res.data);

    // Default to carriage 1
    if (!activeCarriage && res.data.length > 0) {
      setActiveCarriage(res.data[0].carriage);
    }

    setLoading(false);
  } catch (err) {
    console.error("Seat API Error:", err);
  }
}

async function suggestSeats() {
  if (!requiredCount) {
    alert("Select how many seats you need first.");
    setSuggestedSeatIds(mappedSeats.map(s => s.seatId));
    return;
  }

  if (!scheduleId) return;

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

    if (!data || !data.seats || data.seats.length === 0) {
      alert("No seat suggestion available for this segment.");
      return;
    }

    // Flatten all seats from carriages
    const flatSeats = carriages.flatMap((c) => c.seats);

    // Map backend results (seatId only) to actual seat objects from availability API
    const mappedSeats = data.seats
      .map((s) => flatSeats.find((seat) => seat.seatId === s.seatId))
      .filter(Boolean);

    if (mappedSeats.length === 0) {
      alert("Suggestion returned seats that are not in current layout.");
      return;
    }

    // Apply suggestion to selected seats
setSuggestedSeatIds(mappedSeats.map(s => s.seatId));

    // Save info for UI message
    setSuggestionInfo({
      exactMatch: data.exactMatch,
      reason: data.reason,
      count: mappedSeats.length,
    });
  } catch (err) {
    console.error("Seat suggestion failed:", err);
    alert("Could not get seat suggestion.");
  } finally {
    setSuggesting(false);
  }
}

function resetSelection() {
    setSelectedSeats([]);
    setLocked(false);
    setTimerActive(false);
    setTimeLeft(300);
    fetchSeatAvailability();
  }

// function parseSeat(seat) {
//   const letter = seat.seatNumber.substring(0, 1);   // A/B/C/D
//   const row = Number(seat.seatNumber.substring(1)); // 1,2,3...
//   return { ...seat, row, letter };
// }

const active = carriages.find((c) => c.carriage === activeCarriage);

const rows = {};

if (active) {
  active.seats.forEach((seat) => {
    const letter = seat.seatNumber.substring(0, 1);
    const row = parseInt(seat.seatNumber.substring(1));

    if (!rows[row]) rows[row] = {};
    rows[row][letter] = seat;
  });
}


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
``

  async function lockSeats() {
    if (selectedSeats.length !== requiredCount) return;

    const seatIds = selectedSeats.map((s) => s.seatId);

    try {
      await api.post("/api/seats/lock", {
        scheduleId,
        seatIds,
        fromStopOrder,
        toStopOrder,
        tempUserToken: getUserToken()
      });

      setLocked(true);
      setTimerActive(true);
      fetchSeatAvailability();
    } catch (err) {
      console.error("Lock failed:", err);
      alert("⚠ Could not lock seats.");
    }
  }

  async function cancelLockedSeats() {
  if (!locked || selectedSeats.length === 0) return;

  const seatIds = selectedSeats.map(s => s.seatId);

  try {
    await api.post("/api/seats/unlock", {
      scheduleId,
      seatIds
    });

    // Reset local state
    setLocked(false);
    setTimerActive(false);
    setTimeLeft(300);
    setSelectedSeats([]);

    await fetchSeatAvailability();
  } catch (err) {
    console.error("Unlock failed:", err);
    alert("⚠ Failed to unlock seats.");
  }
}


 async function continueToPassengerDetails() {
  if (!locked) return alert("You must lock seats first.");

  try {
const res = await api.post("/api/booking/create", {
  scheduleId,
  passengerName: getUserToken(),
  seatIds: selectedSeats.map(s => s.seatId),
  fromStopOrder,
  toStopOrder
});

// FIX: Read correct key
const bookingId = res.data.id;  

if (!bookingId) {
  alert("❌ Booking failed. No booking ID returned.");
  return;
}

navigate(`/passenger?bookingId=${bookingId}&count=${selectedSeats.length}`);

    
  } catch (err) {
    console.error("Booking creation failed:", err);
    alert("Could not create booking.");
  }
}



  if (!scheduleId)
    return <div className="p-6 text-red-500 text-lg">❌ No train selected.</div>;

  if (loading) return <div className="p-6 text-lg">Loading seats...</div>;

return (
  <div className="max-w-5xl mx-auto p-6 space-y-8">

    {/* Header */}
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Seat Selection</h1>
        <p className="text-gray-500 mt-1">Choose your seats and lock them.</p>
      </div>
    </header>

    {/* Step Card */}
    {!requiredCount && (
      <section className="bg-white shadow-sm border rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-800">How many seats do you need?</h2>

        <select
          className="mt-4 w-48 border rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-blue-500"
          onChange={(e) => setRequiredCount(Number(e.target.value))}
        >
          <option value="">Select...</option>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </section>
    )}

    {requiredCount && (
      <>
        {/* Timer */}
        {timerActive && (
          <div className="p-4 bg-yellow-50 border border-yellow-300 text-yellow-900 rounded-xl shadow-sm text-center text-lg font-semibold">
            ⏳ Reserved for {Math.floor(timeLeft / 60)}:
            {String(timeLeft % 60).padStart(2, "0")}
          </div>
        )}

        {/* Carriage Selector */}
        <section className="bg-white shadow-sm border rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Select Carriage</h2>

          <div className="flex gap-3 flex-wrap">
            {carriages.map((c) => (
              <button
                key={c.carriage}
                onClick={() => setActiveCarriage(c.carriage)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm
                  ${
                    activeCarriage === c.carriage
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
              >
                Carriage {c.carriage}
              </button>
            ))}
          </div>
        </section>

        {/* SEAT MAP */}
        <section className="bg-white shadow-sm border rounded-xl p-6">
          <h2 className="flex justify-center gap-10 text-xl font-semibold text-gray-800 mb-6">Choose Seats</h2>

          <div className="flex justify-center gap-10">
            {/* Seats Grid */}
            <div>
              {Object.keys(rows).sort((a, b) => a - b).map((rowNumber) => (
  <div key={rowNumber} className="grid grid-cols-4 gap-4 mb-4">
    {["A", "B", "C", "D"].map((letter) => {
      const seat = rows[rowNumber][letter];
      if (!seat) return <div key={letter}></div>;

      const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);
      const isSuggested = suggestedSeatIds.includes(seat.seatId);

      const statusStyles =
        seat.status === "booked"
          ? "bg-red-500 text-white cursor-not-allowed"
          : seat.status === "held"
          ? "bg-gray-400 text-white cursor-not-allowed"
          : isSelected
          ? "bg-blue-600 text-white"
          : isSuggested
          ? "bg-green-100 border-green-500"
          : "bg-white hover:bg-blue-100";

      const suggestionBorder = isSuggested ? "ring-2 ring-green-500" : "";

      return (
        <button
          key={seat.seatId}
          disabled={locked || seat.status !== "available"}
          onClick={() => toggleSeat(seat)}
          className={`p-4 rounded-lg border shadow-sm transition font-semibold text-center 
            ${statusStyles} ${suggestionBorder}`}
        >
          {seat.seatNumber}
        </button>
      );
    })}
  </div>
))}

            </div>

            {/* Sidebar Summary */}
            <aside className="w-64 bg-gray-50 border rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Your Selection</h3>

              <div className="text-gray-600">
                {selectedSeats.length === 0 ? (
                  <p>No seats selected.</p>
                ) : (
                  selectedSeats.map((s) => (
                    <p key={s.seatId} className="font-medium">
                      • Seat {s.seatNumber}
                    </p>
                  ))
                )}
              </div>

              <div className="pt-2 border-t">
                <p className="text-gray-700 font-medium">
                  Total: {selectedSeats.length} / {requiredCount}
                </p>
              </div>
            </aside>
          </div>
        </section>

        {/* Actions */}
<div className="flex justify-between items-center mt-4">
  {/* Left: Suggest Button */}
  <div>
<button
  onClick={suggestSeats}
  disabled={!requiredCount || locked || suggesting}
  className="p-4 rounded-lg bg-purple-600 text-white shadow-md hover:bg-purple-700 disabled:bg-gray-400"
>
  {suggesting ? "Suggesting..." : "Suggest Best Seats"}
</button>


    {suggestionInfo && (
      <p className="mt-2 text-sm text-gray-600">
        {suggestionInfo.exactMatch ? "✅" : "⚠️"} {suggestionInfo.reason}
      </p>
    )}
  </div>

  {/* Right: Lock / Continue Buttons */}
  <div className="flex gap-4">
    {!locked ? (
      <button
        onClick={lockSeats}
        disabled={selectedSeats.length !== requiredCount}
        className="px-6 py-3 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        Lock Seats
      </button>
    ) : (
      <>
        <button
          onClick={cancelLockedSeats}
          className="px-5 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600"
        >
          Cancel
        </button>

        <button
          onClick={continueToPassengerDetails}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
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
