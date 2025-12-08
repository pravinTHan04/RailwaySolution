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
      <div className="p-6 text-red-600">
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
    if (passengers.some(p => !p.FullName.trim() || !p.Email.trim())) {
      alert("Please enter name and email for all passengers.");
      return;
    }

    try {
      const body = {
        BookingId: bookingId,
        Passengers: passengers,
      };

      console.log("Sending:", body);

      await api.post("/api/booking/passengers", body);

      navigate(`/payment?bookingId=${bookingId}&count=${seatCount}`);
    } catch (err) {
      console.error("Passenger save failed:", err);
      alert(err.response?.data?.error || "Failed to save passenger details");
    }
  }

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-2xl font-bold">Passenger Details</h1>

      {passengers.map((p, i) => (
        <div key={i} className="border p-4 rounded">
          <h2 className="font-semibold">Passenger {i + 1}</h2>

          <input
            placeholder="Full Name"
            className="border p-2 w-full mt-2"
            value={p.FullName}
            onChange={(e) => handleChange(i, "FullName", e.target.value)}
          />

          <input
            placeholder="Email"
            className="border p-2 w-full mt-2"
            value={p.Email}
            onChange={(e) => handleChange(i, "Email", e.target.value)}
          />
        </div>
      ))}

      <button
        onClick={submit}
        className="bg-blue-600 text-white px-5 py-2 rounded"
      >
        Continue to Payment →
      </button>
    </div>
  );
}