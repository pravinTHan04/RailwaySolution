import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function PassengerDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get("bookingId");
  const seatCount = Number(searchParams.get("count"));

  if (!bookingId || !seatCount || Number.isNaN(seatCount)) {
    return (
      <div className="p-6 text-red-600 text-lg">
        ❌ Missing booking information. Go back and select seats again.
      </div>
    );
  }

  const [passengers, setPassengers] = useState(
    Array.from({ length: seatCount }, () => ({ FullName: "", Email: "" }))
  );

  const handleChange = (index, field, value) => {
    const clone = [...passengers];
    clone[index][field] = value;
    setPassengers(clone);
  };

  async function submit() {
    if (passengers.some((p) => !p.FullName.trim() || !p.Email.trim())) {
      alert("Please enter name and email for all passengers.");
      return;
    }

    try {
      await api.post("/api/booking/passengers", {
        BookingId: bookingId,
        Passengers: passengers,
      });

      navigate(`/payment?bookingId=${bookingId}&count=${seatCount}`);
    } catch (err) {
      console.error("Passenger save failed:", err);
      alert(err.response?.data?.error || "Failed to save passenger details");
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">

      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-semibold text-gray-900">Passenger Details</h1>
        <p className="text-gray-500 mt-1">Enter information for each passenger.</p>
      </div>

      {/* PASSENGER CARDS */}
      {passengers.map((p, i) => (
        <div
          key={i}
          className="bg-white shadow-sm rounded-2xl border p-6 space-y-4"
        >
          <h2 className="text-lg font-semibold text-gray-900">
            Passenger {i + 1}
          </h2>

          {/* FULL NAME */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              value={p.FullName}
              onChange={(e) => handleChange(i, "FullName", e.target.value)}
              placeholder="Enter full name"
              className="w-full p-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-black/10 focus:bg-white transition"
            />
          </div>

          {/* EMAIL */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={p.Email}
              onChange={(e) => handleChange(i, "Email", e.target.value)}
              placeholder="Enter email"
              className="w-full p-3 rounded-xl border bg-gray-50 focus:ring-2 focus:ring-black/10 focus:bg-white transition"
            />
          </div>
        </div>
      ))}

      {/* CONTINUE BUTTON */}
      <div className="flex justify-end">
        <button
          onClick={submit}
          className="px-6 py-3 bg-black text-white rounded-xl text-sm font-semibold shadow hover:bg-gray-900 transition"
        >
          Continue to Payment →
        </button>
      </div>
    </div>
  );
}
