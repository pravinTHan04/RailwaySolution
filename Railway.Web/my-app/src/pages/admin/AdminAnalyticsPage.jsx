import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function AdminAnalyticsPage() {
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loadFactor, setLoadFactor] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [error, setError] = useState("");

  async function fetchLoadFactor() {
    try {
      const res = await api.get("/api/admin/load-factor", {
        params: { date },
      });
      setLoadFactor(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load load factor.");
    }
  }

  async function fetchRevenue() {
    try {
      const res = await api.get("/api/admin/revenue", {
        params: { from, to },
      });
      setRevenue(res.data);
    } catch (err) {
      console.error("Revenue error:", err.response?.data);
      setError("Failed to load revenue.");
    }
  }

  async function fetchBookings() {
    try {
      const res = await api.get("/api/admin/bookings-over-time", {
        params: { from, to },
      });
      setBookings(res.data);
    } catch (err) {
      console.error("Bookings error:", err.response?.data);
      setError("Failed to load booking stats.");
    }
  }

  function loadAll() {
    setError("");
    if (date) fetchLoadFactor();
    if (from && to) {
      fetchRevenue();
      fetchBookings();
    }
  }

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-3xl font-bold">📊 Admin Analytics Dashboard</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      {/* Filters */}
      <section className="bg-white p-6 shadow rounded space-y-4">
        <h2 className="text-xl font-semibold">Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-semibold">Load Factor Date</label>
            <input
              type="date"
              className="border p-2 w-full rounded"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">From Date</label>
            <input
              type="date"
              className="border p-2 w-full rounded"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div>
            <label className="font-semibold">To Date</label>
            <input
              type="date"
              className="border p-2 w-full rounded"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={loadAll}
          className="mt-4 bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
        >
          Load Analytics
        </button>
      </section>

      {/* Load Factor */}
      {date && (
        <section className="bg-white p-6 shadow rounded">
          <h2 className="text-xl font-semibold mb-4">
            🚆 Load Factor – {date}
          </h2>

          {loadFactor.length === 0 ? (
            <p>No data.</p>
          ) : (
            <table className="w-full border shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Train</th>
                  <th className="p-2 border">Capacity</th>
                  <th className="p-2 border">Booked</th>
                  <th className="p-2 border">% Load</th>
                </tr>
              </thead>
              <tbody>
                {loadFactor.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 border">{item.train}</td>
                    <td className="p-2 border">{item.totalSeats}</td>
                    <td className="p-2 border">{item.bookedSeats}</td>
                    <td className="p-2 border font-bold">
                      {item.loadFactor.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Revenue */}
      {from && to && (
        <section className="bg-white p-6 shadow rounded">
          <h2 className="text-xl font-semibold mb-4">
            💰 Revenue ({from} → {to})
          </h2>

          {revenue.length === 0 ? (
            <p>No revenue data.</p>
          ) : (
            <table className="w-full border shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Total Revenue (£)</th>
                  <th className="p-2 border">Payments</th>
                </tr>
              </thead>
              <tbody>
                {revenue.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 border">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="p-2 border">£{r.totalRevenue}</td>
                    <td className="p-2 border">{r.payments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Bookings Over Time */}
      {from && to && (
        <section className="bg-white p-6 shadow rounded">
          <h2 className="text-xl font-semibold mb-4">
            📈 Bookings Over Time
          </h2>

          {bookings.length === 0 ? (
            <p>No booking history.</p>
          ) : (
            <table className="w-full border shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">Bookings</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 border">
                      {new Date(b.date).toLocaleDateString()}
                    </td>
                    <td className="p-2 border">{b.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}
