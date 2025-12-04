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

  function resetSelection() {
    setSelectedSeats([]);
    setLocked(false);
    setTimerActive(false);
    setTimeLeft(300);
    fetchSeatAvailability();
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
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Seat Selection</h1>

      {!requiredCount && (
        <div>
          <h2 className="text-lg font-semibold">How many seats do you need?</h2>
          <select
            className="border p-3 rounded-lg mt-3"
            onChange={(e) => setRequiredCount(Number(e.target.value))}
          >
            <option value="">Select</option>
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
          {timerActive && (
            <div className="p-3 bg-yellow-200 rounded font-semibold">
              ⏳ Reserved for:{" "}
              {Math.floor(timeLeft / 60)}:
              {String(timeLeft % 60).padStart(2, "0")}
            </div>
          )}

{/* Carriage selector */}
<div className="flex gap-3 mb-4">
  {carriages.map((c) => (
    <button
      key={c.carriage}
      onClick={() => setActiveCarriage(c.carriage)}
      className={`px-4 py-2 rounded ${
        activeCarriage === c.carriage
          ? "bg-blue-600 text-white"
          : "bg-gray-300 hover:bg-gray-400"
      }`}
    >
      Carriage {c.carriage}
    </button>
  ))}
</div>

{/* Seats of active carriage */}
<div className="grid grid-cols-4 gap-3 bg-gray-100 p-4 rounded-lg max-w-md">
  {carriages
    .find((c) => c.carriage === activeCarriage)?.seats
    .map((seat) => {
      const isSelected = selectedSeats.some((s) => s.seatId === seat.seatId);

      return (
        <button
          key={seat.seatId}
          disabled={seat.status !== "available" || locked}
          onClick={() => toggleSeat(seat)}
          className={`p-3 border rounded-lg font-semibold ${
            seat.status === "booked"
              ? "bg-red-500 text-white"
              : seat.status === "held"
              ? "bg-gray-400 text-white"
              : isSelected
              ? "bg-blue-600 text-white"
              : "bg-white hover:bg-blue-200"
          }`}
        >
          {seat.seatNumber}
        </button>
      );
    })}
</div>


          {!locked ? (
  <button
    onClick={lockSeats}
    disabled={selectedSeats.length !== requiredCount}
    className="bg-green-600 text-white px-6 py-2 rounded disabled:bg-gray-400"
  >
    Lock Seats
  </button>
) : (
  <div className="flex gap-3">
    <button
      onClick={cancelLockedSeats}
      className="bg-red-500 text-white px-4 py-2 rounded"
    >
      Cancel & Change Seats
    </button>
    <button
      onClick={continueToPassengerDetails}
      className="bg-blue-600 text-white px-6 py-2 rounded"
    >
      Continue →
    </button>
  </div>
)}

        </>
      )}
    </div>
  );
}
