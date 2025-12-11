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
        setBookings(res.data);
      } catch (err) {
        console.error("Failed to load bookings:", err);
      } finally {
        setLoadingBookings(false);
      }
    }

    loadBookings();
  }, []);

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

  const totalBookings = bookings.length;
  const upcoming = bookings.filter((b) => b.status === "confirmed").length;
  const completed = bookings.filter((b) => b.status === "completed").length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 flex gap-6 items-center">
        <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center text-3xl font-semibold shadow-sm">
          {user.firstname?.[0]?.toUpperCase() || "U"}
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            {user.firstname} {user.lastname}
          </h2>
          <p className="text-gray-600 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-gray-900">{totalBookings}</div>
          <div className="text-xs text-gray-600">Total Bookings</div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-blue-600">{upcoming}</div>
          <div className="text-xs text-gray-600">Upcoming</div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-green-600">{completed}</div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 text-center">
          <div className="text-xl font-bold text-red-600">{cancelled}</div>
          <div className="text-xs text-gray-600">Cancelled</div>
        </div>

      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 space-y-3">
        <h2 className="text-xl font-semibold text-gray-900">Account Details</h2>

        <div><span className="font-medium">First Name:</span> {user.firstname}</div>
        <div><span className="font-medium">Last Name:</span> {user.lastname}</div>
        <div><span className="font-medium">Email:</span> {user.email}</div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Bookings</h2>

        {loadingBookings ? (
          <p className="text-gray-500">Loading your bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="text-gray-500">You have no bookings yet.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="border border-gray-200 bg-gray-50 rounded-xl p-4 shadow-sm"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">
                    {b.route || "Unknown route"}
                  </span>
                  <span className="text-xs text-gray-600">
                    {new Date(b.departure).toLocaleString()}
                  </span>
                </div>

                <p className="text-sm text-gray-700 mt-1">
                  <b>Status:</b>{" "}
                  <span
                    className={
                      b.status === "confirmed"
                        ? "text-blue-600"
                        : b.status === "completed"
                        ? "text-green-600"
                        : b.status === "cancelled"
                        ? "text-red-600"
                        : "text-gray-700"
                    }
                  >
                    {b.status}
                  </span>
                </p>

                <p className="text-sm text-gray-700">
                  <b>Seats:</b> {b.seats?.length ? b.seats.join(", ") : "N/A"}
                </p>

                <p className="text-sm text-gray-700">
                  <b>Ticket No:</b> {b.ticketNumber || "Not generated yet"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 bg-black text-white rounded-lg shadow hover:bg-gray-900 transition"
      >
        ← Back
      </button>
    </div>
  );
}
