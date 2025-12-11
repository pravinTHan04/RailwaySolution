import { useEffect, useState, useRef } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import ChatBot from "../components/Chatbot.jsx";

export default function SchedulePage() {
  const navigate = useNavigate();

  const [stations, setStations] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [manualResults, setManualResults] = useState([]);
  const [message, setMessage] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  const effectRan = useRef(false);

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (!effectRan.current) {
      sendLocation();
      effectRan.current = true;
    }
  }, []);

  async function sendLocation() {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await api.post("/api/ai/location", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setMessage((prev) => prev + " " + res.data.message);
      },
      async () => {
        const res = await api.post("/api/ai/location", {});
        setMessage((prev) => prev + " " + res.data.message);
      }
    );
  }

  async function loadStations() {
    try {
      const res = await api.get("/api/stations");
      setStations(res.data);
    } catch (err) {
      console.error("Station load failed", err);
    }
  }

  async function searchManual() {
    if (!from || !to || !date) {
      alert("Please select From, To, and Date.");
      return;
    }

    setManualLoading(true);
    setManualResults([]);

    try {
      const res = await api.get("/api/schedules/search", {
        params: { from, to, date },
      });
      setManualResults(res.data);
    } catch {
      alert("Manual search failed.");
    }

    setManualLoading(false);
  }

  return (
    <div className="min-h-screen p-4 flex justify-center bg-gray-100">

      {/* Container */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Message Header */}
        <div className="lg:col-span-2 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 text-gray-900 text-lg font-medium">
          {message}
        </div>

        {/* LEFT PANEL (Manual Search) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-h-[80vh] overflow-y-auto">

          <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Search</h2>

          <div className="space-y-4">

            {/* FROM */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">From</label>
              <select
                className="p-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-black/20"
                onChange={(e) => setFrom(e.target.value)}
                value={from}
              >
                <option value="">Select From Station</option>
                {stations
                  .filter((st) => st.id !== to)
                  .map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* TO */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">To</label>
              <select
                className="p-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-black/20"
                onChange={(e) => setTo(e.target.value)}
                value={to}
              >
                <option value="">Select To Station</option>
                {stations
                  .filter((st) => st.id !== from)
                  .map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* DATE */}
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700">Date</label>
              <input
                type="date"
                className="p-3 rounded-lg border border-gray-300 bg-white text-gray-800 focus:ring-2 focus:ring-black/20"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* BUTTON */}
            <button
              onClick={searchManual}
              className="w-full p-3 rounded-lg bg-black text-white font-semibold hover:bg-gray-900 transition"
            >
              {manualLoading ? "Searching..." : "Search →"}
            </button>
          </div>

          {/* RESULTS */}
          {manualResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Results</h3>

              {manualResults.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  <p className="font-semibold text-gray-900">{trip.train.name}</p>
                  <p className="text-gray-600 text-sm">{trip.route.name}</p>

                  <p className="mt-2 text-sm text-gray-700">
                    Departure:{" "}
                    {new Date(trip.departureTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <button
                    className="mt-3 w-full p-2 rounded-lg bg-gray-800 text-white hover:bg-black transition text-sm"
                    onClick={() =>
                      navigate(
                        `/book?scheduleId=${trip.id}&fromOrder=${trip.fromStopOrder}&toOrder=${trip.toStopOrder}`
                      )
                    }
                  >
                    Book →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT PANEL (Chatbot) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-h-[80vh] overflow-y-auto">
          <ChatBot />
        </div>

      </div>
    </div>
  );
}
