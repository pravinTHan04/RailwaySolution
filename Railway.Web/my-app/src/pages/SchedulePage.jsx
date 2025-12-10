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
    <div className="min-h-screen p-6 bg-[#e0e0e0] flex justify-center">
      
      {/* MAX WIDTH CONTAINER */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* MESSAGE */}
        <div className="lg:col-span-2 mb-2 p-4 rounded-2xl text-gray-800 text-xl font-semibold
          shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]">
          {message}
        </div>

        {/* LEFT PANEL */}
        <div className="p-6 rounded-2xl bg-[#e0e0e0]
          shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]
          overflow-y-auto max-h-[80vh]">

          <h2 className="text-2xl font-bold mb-6 text-gray-700">Manual Search</h2>

          <div className="space-y-5">
            <select
              className="border-none rounded-xl p-4 w-full bg-[#e0e0e0] text-gray-700 
              shadow-inner shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]"
              onChange={(e) => setFrom(e.target.value)}
              value={from}
            >
              <option value="">From Station</option>
              {stations
                .filter((st) => st.id !== to)
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
            </select>

            <select
              className="border-none rounded-xl p-4 w-full bg-[#e0e0e0] text-gray-700 
              shadow-inner shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]"
              onChange={(e) => setTo(e.target.value)}
              value={to}
            >
              <option value="">To Station</option>
              {stations
                .filter((st) => st.id !== from)
                .map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
            </select>

            <input
              type="date"
              className="border-none rounded-xl p-4 w-full bg-[#e0e0e0] text-gray-700 
              shadow-inner shadow-[inset_4px_4px_8px_#bebebe,inset_-4px_-4px_8px_#ffffff]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <button
              onClick={searchManual}
              className="mt-4 py-3 w-full rounded-xl text-gray-700 font-semibold
              bg-[#e0e0e0]
              shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]
              active:shadow-inner active:shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]
              transition"
            >
              {manualLoading ? "Searching..." : "Search →"}
            </button>
          </div>

          {/* RESULTS */}
          {manualResults.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-semibold text-gray-700">Results</h3>

              {manualResults.map((trip) => (
                <div
                  key={trip.id}
                  className="p-5 rounded-xl bg-[#e0e0e0]
                  shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]"
                >
                  <p className="font-bold text-lg text-gray-700">{trip.train.name}</p>
                  <p className="text-gray-600">{trip.route.name}</p>

                  <p className="mt-2 text-sm text-gray-700">
                    Departure:{" "}
                    {new Date(trip.departureTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>

                  <button
                    className="mt-4 w-full py-2 rounded-xl bg-[#e0e0e0] text-gray-700
                    shadow-[6px_6px_12px_#bebebe,-6px_-6px_12px_#ffffff]
                    active:shadow-inner active:shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]
                    transition"
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

        {/* RIGHT PANEL */}
        <div className="p-6 rounded-2xl bg-[#e0e0e0]
          shadow-[8px_8px_16px_#bebebe,-8px_-8px_16px_#ffffff]
          overflow-y-auto max-h-[80vh] flex flex-col">

          <ChatBot />
        </div>
      </div>
    </div>
  );
}
