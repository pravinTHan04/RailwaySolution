import { useEffect, useState } from "react";
import api from "../api/axios";

export default function ProfilePage() {
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : null;

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

useEffect(() => {
  if (!user) {
    setLoadingBookings(false);
    return;
  }

  async function loadBookings() {
    try {
      const res = await api.get("/api/booking/my");
      console.log("My bookings:", res.data);
      setBookings(res.data);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  }

  loadBookings();
}, []);  

console.log("User from localStorage:", user);
console.log("Token:", localStorage.getItem("authToken"));


  if (!user) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="p-4 bg-red-100 border border-red-300 rounded">
          ⚠️ No user data found. Please login.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {/* User info */}
      <div className="p-5 bg-white border rounded-xl shadow space-y-3">
        <div>
          <span className="font-semibold">First Name:</span>{" "}
          {user.firstname || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Last Name:</span>{" "}
          {user.lastname || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Email:</span>{" "}
          {user.email || "N/A"}
        </div>

        <div>
          <span className="font-semibold">Role:</span>{" "}
          {user.role || "N/A"}
        </div>
      </div>

      {/* My bookings */}
      <div className="p-5 bg-white border rounded-xl shadow space-y-3">
        <h2 className="text-xl font-semibold mb-2">My Bookings</h2>

        {loadingBookings ? (
          <p>Loading your bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-gray-500">You have no bookings yet.</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="border rounded-lg p-3 flex flex-col gap-1 bg-gray-50"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">
                    {b.route || "Unknown route"}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(b.departure).toLocaleString()}
                  </span>
                </div>

                <div className="text-sm text-gray-700">
                  <b>Status:</b> {b.status}
                </div>

                <div className="text-sm text-gray-700">
                  <b>Seats:</b>{" "}
                  {b.seats && b.seats.length > 0
                    ? b.seats.join(", ")
                    : "N/A"}
                </div>

                <div className="text-sm text-gray-700">
                  <b>Ticket No:</b>{" "}
                  {b.ticketNumber || "Not generated yet"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
      >
        ← Back
      </button>
    </div>
  );
}
